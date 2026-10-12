const authDb = require("../model/authDb");
const axios = require("axios");

const PARTNER_SERVICE_URL =
  process.env.PARTNER_SERVICE_URL || "http://localhost:5003";


const getRegistrationAuthAccount = async (partnerId, email) => {
  if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
    return null;
  }

  const [accounts] = await authDb.query(
    `SELECT auth_id, account_id, email, status
     FROM auth_accounts
     WHERE account_type = 'partner'
       AND account_id = ?
       AND email = ?
     LIMIT 1`,
    [partnerId, email]
  );

  return accounts[0] || null;
};

const getRegistrationPartnerProfile = async (partnerId, email) => {
  if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
    return null;
  }

  const response = await axios.get(
    `${PARTNER_SERVICE_URL}/internal/partners/${partnerId}/profile`,
    {
      headers: {
        "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
      },
      timeout: 5000,
    }
  );

  const partner = response.data?.data;

  if (
    response.data?.success !== true ||
    partner?.partner_id !== partnerId ||
    partner?.email !== email
  ) {
    throw new Error("Partner profile verification failed");
  }

  return partner;
};

const recoverPartnerRegistration = async ({
  partnerId,
  normalizedEmail,
  registrationToken,
}) => {
  if (partnerId === null && registrationToken) {
    try {
      const response = await axios.get(
        `${PARTNER_SERVICE_URL}/internal/partners/registration/${registrationToken}`,
        {
          headers: {
            "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
          },
          timeout: 5000,
        }
      );

      const profile = response.data?.data;

      if (
        response.data?.success === true &&
        Number.isSafeInteger(profile?.partner_id) &&
        profile.partner_id > 0 &&
        profile.email === normalizedEmail
      ) {
        partnerId = profile.partner_id;
      }
    } catch (error) {
      console.error(
        "Registration recovery lookup failed:",
        error.message
      );
    }
  }
  if (Number.isSafeInteger(partnerId) && partnerId > 0) {
  try {
    const authAccount = await getRegistrationAuthAccount(
      partnerId,
      normalizedEmail
    );

    const partnerProfile = await getRegistrationPartnerProfile(
      partnerId,
      normalizedEmail
    );

    console.log("Partner Registration Recovery Check:", {
      partnerId,
      authStatus: authAccount?.status || "not_found",
      partnerStatus: partnerProfile?.status || "not_found",
    });

    if (
  authAccount?.status === "active" &&
  partnerProfile?.status === "active"
) {
  return {
    recovered: true,
    partnerId,
  };
}
  } catch (error) {
    console.error(
      "Partner registration state check failed:",
      error.message
    );
  }
}
  return {
    recovered: false,
    partnerId,
  };
};

module.exports = {
  getRegistrationAuthAccount,getRegistrationPartnerProfile,recoverPartnerRegistration
};