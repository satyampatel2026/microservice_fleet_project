const authDb = require("../model/authDb");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const axios = require("axios");

const PARTNER_SERVICE_URL =
  process.env.PARTNER_SERVICE_URL || "http://localhost:5003";

const registerPartnerV2 = async (req, res) => {
  const {
    partnername,
    email,
    mobile,
    password,
    service_ids,
  } = req.body || {};

  // 1. Partner details check karo
  if (
    typeof partnername !== "string" ||
    !partnername.trim() ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof mobile !== "string" ||
    !/^[0-9]{10}$/.test(mobile) ||
    typeof password !== "string" ||
    password.length < 6
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid partner registration details",
    });
  }

  // 2. Selected services check karo
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

  try {
    // 3. Email already registered hai?
    const [accounts] = await authDb.query(
      `SELECT auth_id
       FROM partner_accounts
       WHERE email = ?
       LIMIT 1`,
      [normalizedEmail]
    );

    if (accounts.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Email already registered",
      });
    }

    if (!process.env.INTERNAL_SERVICE_KEY) {
      throw new Error("INTERNAL_SERVICE_KEY is missing");
    }

    // 4. Password hash aur internal registration token banao
    const passwordHash = await bcrypt.hash(password, 10);

    const registrationToken = crypto
      .randomBytes(32)
      .toString("hex");

    // Client Service ki tarah internal REST calls ki settings
    const options = {
      headers: {
        "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
      },
      timeout: 5000,
    };

    // 5. Partner Service mein profile banao
    const profileResponse = await axios.post(
      `${PARTNER_SERVICE_URL}/internal/partners`,
      {
        partnername: partnername.trim(),
        email: normalizedEmail,
        mobile,
        service_ids,
        registrationToken,
      },
      options
    );

    const partnerId = profileResponse.data?.data?.partner_id;

    if (
      profileResponse.data?.success !== true ||
      !Number.isSafeInteger(partnerId) ||
      partnerId <= 0
    ) {
      throw new Error("Invalid partner profile response");
    }

    // 6. Auth database mein login account banao
    await authDb.query(
      `INSERT INTO partner_accounts
       (partner_id, email, password_hash, status)
       VALUES (?, ?, ?, 'inactive')`,
      [partnerId, normalizedEmail, passwordHash]
    );

    // 7. Partner profile activate karo
    const activationResponse = await axios.patch(
      `${PARTNER_SERVICE_URL}/internal/partners/${partnerId}/activate`,
      {
        email: normalizedEmail,
        registrationToken,
      },
      options
    );

    if (activationResponse.data?.success !== true) {
      throw new Error("Partner profile activation failed");
    }

    // 8. Auth account activate karo
    const [result] = await authDb.query(
      `UPDATE partner_accounts
       SET status = 'active'
       WHERE partner_id = ? AND email = ?`,
      [partnerId, normalizedEmail]
    );

    if (result.affectedRows !== 1) {
      throw new Error("Partner auth account not found");
    }

    // Existing frontend response same rakha hai
    return res.status(201).json({
      success: true,
      message: "Partner created successfully",
    });
  } catch (error) {
    console.error("Partner registration failed:", {
  message: error.message,
  status: error.response?.status,
  details: error.response?.data,
  databaseCode: error.code,
});

    return res.status(500).json({
      success: false,
      message: "Partner registration could not be completed",
    });
  }
};

module.exports = { registerPartnerV2 };