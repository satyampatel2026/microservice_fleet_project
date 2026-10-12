const {
  getRegistrationAuthAccount,
  getRegistrationPartnerProfile,
} = require("./partnerRegistrationRecovery");
const authDb = require("../model/authDb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");

const PARTNER_SERVICE_URL =
  process.env.PARTNER_SERVICE_URL || "http://localhost:5003";


const registerPartnerV2 = async (req, res) => {
  const { partnername, email, mobile, password } = req.body || {};

  if (
    typeof partnername !== "string" ||
    typeof email !== "string" ||
    typeof mobile !== "string" ||
    typeof password !== "string" ||
    !partnername.trim() ||
    !email.trim() ||
    !/^[0-9]{10}$/.test(mobile) ||
    password.length < 6
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid partner registration details",
    });
  }

  const normalizedEmail = email.trim().toLowerCase();
  let partnerId = null;
let registrationToken = null;

  try {
    const [existingAccounts] = await authDb.query(
      `SELECT auth_id
       FROM auth_accounts
       WHERE account_type = 'partner'
         AND email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    if (existingAccounts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    registrationToken = crypto.randomBytes(32).toString("hex");

if (!process.env.INTERNAL_SERVICE_KEY) {
  throw new Error("INTERNAL_SERVICE_KEY is missing");
}

 try {
  const profileResponse = await axios.post(
    `${PARTNER_SERVICE_URL}/internal/partners`,
    {
      partnername: partnername.trim(),
      email: normalizedEmail,
      mobile,
      registrationToken,
    },
    {
      headers: {
        "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
      },
      timeout: 5000,
    }
  );

  partnerId = profileResponse.data?.data?.partner_id;
} catch (profileError) {
  // Only attempt recovery when the POST result is unknown.
  if (profileError.response) {
    throw profileError;
  }

  const lookupResponse = await axios.get(
    `${PARTNER_SERVICE_URL}/internal/partners/registration/${registrationToken}`,
    {
      headers: {
        "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
      },
      timeout: 5000,
    }
  );

  if (
    lookupResponse.data?.success !== true ||
    lookupResponse.data?.data?.email !== normalizedEmail ||
    lookupResponse.data?.data?.status !== "inactive"
  ) {
    throw new Error("Unable to verify created partner profile");
  }

  partnerId = lookupResponse.data.data.partner_id;
}

if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
  throw new Error("Invalid partner ID returned by Partner Service");
}

  const [authResult] = await authDb.query(
  `INSERT INTO auth_accounts
     (account_type, account_id, email, password_hash, status)
   VALUES ('partner', ?, ?, ?, 'inactive')`,
  [partnerId, normalizedEmail, hashedPassword]
);

if (!authResult.insertId) {
  throw new Error("Failed to create partner auth account");
}

  const activationResponse = await axios.patch(
  `${PARTNER_SERVICE_URL}/internal/partners/${partnerId}/activate`,
  {
    email: normalizedEmail,
    registrationToken,
  },
  {
    headers: {
      "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
    },
    timeout: 5000,
  }
);

if (activationResponse.data?.success !== true) {
  throw new Error("Partner profile activation failed");
}
 const [activationResult] = await authDb.query(
  `UPDATE auth_accounts
   SET status = 'active'
   WHERE account_type = 'partner'
     AND account_id = ?
     AND email = ?
     AND status = 'inactive'`,
  [partnerId, normalizedEmail]
);

if (activationResult.affectedRows !== 1) {
  throw new Error("Failed to activate partner auth account");
} 

return res.status(201).json({
  success: true,
  message: "Partner created successfully",
});
   } catch (error) {
    console.error("Partner Registration V2 Error:", error.message);

    if (partnerId === null && registrationToken) {
  try {
    const lookupResponse = await axios.get(
      `${PARTNER_SERVICE_URL}/internal/partners/registration/${registrationToken}`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        timeout: 5000,
      }
    );

    const profile = lookupResponse.data?.data;

    if (
      lookupResponse.data?.success === true &&
      Number.isSafeInteger(profile?.partner_id) &&
      profile.partner_id > 0 &&
      profile.email === normalizedEmail
    ) {
      partnerId = profile.partner_id;
    }
  } catch (lookupError) {
    console.error(
      "Registration token recovery lookup failed:",
      lookupError.message
    );
  }
}

    if (partnerId !== null) {
      try {
        const authAccount = await getRegistrationAuthAccount(
          partnerId,
          normalizedEmail
        );

        const partnerProfile = await getRegistrationPartnerProfile(
          partnerId,
          normalizedEmail
        );

         if (
  authAccount?.status === "active" &&
  partnerProfile?.status === "active"
) {
  return res.status(201).json({
    success: true,
    message: "Partner created successfully",
  });
}
        if (
  authAccount?.status === "inactive" &&
  partnerProfile?.status === "active"
) {
  const [recoveryResult] = await authDb.query(
    `UPDATE auth_accounts
     SET status = 'active'
     WHERE auth_id = ?
       AND account_type = 'partner'
       AND account_id = ?
       AND email = ?
       AND status = 'inactive'`,
    [authAccount.auth_id, partnerId, normalizedEmail]
  );

  if (recoveryResult.affectedRows === 1) {
    console.log("Partner registration activation recovered:", {
      partnerId,
    });
      return res.status(201).json({
    success: true,
    message: "Partner created successfully",
  });
  }
}

         if (
  !authAccount &&
  partnerProfile?.status === "inactive" &&
  registrationToken
) {
  try {
    const rollbackResponse = await axios.delete(
      `${PARTNER_SERVICE_URL}/internal/partners/${partnerId}/rollback`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        data: {
          email: normalizedEmail,
          registrationToken,
        },
        timeout: 5000,
      }
    );

    console.log("Registration profile rollback:", {
      partnerId,
      success: rollbackResponse.data?.success === true,
    });
  } catch (rollbackError) {
    console.error(
      "Registration profile rollback failed:",
      rollbackError.message
    );
  }
}
      if (
  authAccount?.status === "inactive" &&
  partnerProfile?.status === "inactive"
) {
  console.warn("Incomplete partner registration:", {
    partnerId,
    message: "Both auth account and partner profile are inactive",
  });
}
        console.error("Registration Recovery State:", {
  partnerId,
  authStatus: authAccount?.status || "not_found",
  partnerStatus: partnerProfile?.status || "not_found",
});
      } catch (recoveryError) {
        console.error(
          "Registration state verification failed:",
          recoveryError.message
        );
      }
    }

    return res.status(500).json({
      success: false,
      message: "Partner registration failed",
    });
  }
}

module.exports = { registerPartnerV2 };