const authDb = require("../model/authDb");
const axios = require("axios");
const {activatePartnerWithEvent,} = require("../services/partnerActivationService");

const PARTNER_SERVICE_URL =
  process.env.PARTNER_SERVICE_URL || "http://localhost:5003";


const getRegistrationAuthAccount = async (partnerId, email) => {
  if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
    return null;
  }

  const [accounts] = await authDb.query(
     `SELECT auth_id, partner_id, email, status
        FROM partner_accounts
      WHERE partner_id = ?
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
  try {
    if (partnerId == null && registrationToken) {
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
        response.data?.success !== true ||
        profile?.email !== normalizedEmail ||
        !Number.isSafeInteger(profile?.partner_id) ||
        profile.partner_id <= 0
      ) {
        return { recovered: false, partnerId: null };
      }

      partnerId = profile.partner_id;
    }

    if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
      return { recovered: false, partnerId };
    }

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
      return { recovered: true, partnerId };
    }

    if (
      authAccount?.status === "inactive" &&
      partnerProfile?.status === "active"
    ) {
      await activatePartnerWithEvent(partnerId, normalizedEmail);

return {
  recovered: true,
  partnerId,
};
    }

    if (
      authAccount?.status === "inactive" &&
      partnerProfile?.status === "inactive" &&
      registrationToken
    ) {
      const response = await axios.patch(
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

       if (response.data?.success === true) {
  await activatePartnerWithEvent(partnerId, normalizedEmail);

  return {
    recovered: true,
    partnerId,
  };
}
    }

    console.warn("Partner registration remains incomplete:", {
      partnerId,
      authStatus: authAccount?.status || "not_found",
      partnerStatus: partnerProfile?.status || "not_found",
    });

    return { recovered: false, partnerId };
  } catch (error) {
    console.error("Partner registration recovery failed:", error.message);
    return { recovered: false, partnerId };
  }
};

module.exports = {
  getRegistrationAuthAccount,getRegistrationPartnerProfile,recoverPartnerRegistration
};