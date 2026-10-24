const { recoverPartnerRegistration } = require("./partnerRegistrationRecovery");
// const { activatePartnerWithEvent,} = require("../services/partnerActivationService");
await activatePartnerWithEvent(partnerId, normalizedEmail);
const authDb = require("../model/authDb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");

const PARTNER_SERVICE_URL =
  process.env.PARTNER_SERVICE_URL || "http://localhost:5003";


const registerPartnerV2 = async (req, res) => {
  const { partnername, email, mobile, password,service_ids } = req.body || {};

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
  // Validate selected services
if (
  !Array.isArray(service_ids) ||
  service_ids.length === 0 ||
  service_ids.length > 100
) {
  return res.status(400).json({
    success: false,
    message: "Select between 1 and 100 services",
  });
}

const checkedIds = [];

for (const id of service_ids) {
  if (!Number.isSafeInteger(id) || id <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid service ID",
    });
  }

  if (checkedIds.includes(id)) {
    return res.status(400).json({
      success: false,
      message: "Duplicate service ID",
    });
  }

  checkedIds.push(id);
}
  const normalizedEmail = email.trim().toLowerCase();
  let partnerId = null;
let registrationToken = null;

  try {
    const [existingAccounts] = await authDb.query(
      `SELECT auth_id
       FROM partner_accounts
       WHERE email = ?
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
      service_ids
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
  `INSERT INTO partner_accounts
     (partner_id, email, password_hash, status)
    VALUES (?, ?, ?, 'inactive')`,
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
await activatePartnerWithEvent(partnerId, normalizedEmail);

return res.status(201).json({
  success: true,
  message: "Partner created successfully",
});
     } catch (error) {
    console.error("Partner Registration V2 Error:", error.message);

    const recovery = await recoverPartnerRegistration({
      partnerId,
      normalizedEmail,
      registrationToken,
    });

    if (recovery.recovered) {
      return res.status(201).json({
        success: true,
        message: "Partner created successfully",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Partner registration could not be completed",
    });
  }
};
module.exports = { registerPartnerV2 };