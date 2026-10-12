const connection = require("../model/db");

const getPartnerProfile = async (req, res) => {
  try {
    const { partnerId } = req.params;

    if (!/^[1-9]\d*$/.test(partnerId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid partner ID",
      });
    }

    const [partners] = await connection.query(
      `SELECT
         partner_id,
         partner_name,
         email,
         mobile,
         status
       FROM partners
       WHERE partner_id = ?
       LIMIT 1`,
      [partnerId]
    );

    if (partners.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: partners[0],
    });
  } catch (error) {
    console.error("Internal Partner Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch partner profile",
    });
  }
};

const createPartnerProfile = async (req, res) => {
  try {
    const { partnername, email, mobile,registrationToken  } = req.body;

    if (
      typeof partnername !== "string" ||
      typeof email !== "string" ||
      typeof mobile !== "string" ||
      typeof registrationToken !== "string" ||
      !/^[a-f0-9]{64}$/.test(registrationToken) ||
      !partnername.trim() ||
      !email.trim() ||
      !/^[0-9]{10}$/.test(mobile)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid partner details",
      });
    }

    const [result] = await connection.query(
      `INSERT INTO partners
     (partner_name, email, mobile, status, registration_token)
     VALUES (UPPER(?), ?, ?, 'inactive', ?)`,
    [partnername.trim(), email.trim(), mobile, registrationToken]
   );

    return res.status(201).json({
      success: true,
      message: "Partner profile created",
      data: {
        partner_id: result.insertId,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Partner email or mobile already exists",
      });
    }

    console.error("Create Partner Profile Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create partner profile",
    });
  }
};

const rollbackPartnerProfile = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { email,registrationToken  } = req.body;

    if (
      !/^[1-9]\d*$/.test(partnerId) ||
      typeof registrationToken !== "string" ||
      !/^[a-f0-9]{64}$/.test(registrationToken) ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid rollback details",
      });
    }

    const [result] = await connection.query(
      `DELETE FROM partners
       WHERE partner_id = ?
         AND email = ?
        AND registration_token = ?
         AND status = 'inactive'
         AND NOT EXISTS (
           SELECT 1
           FROM partner_kyc
           WHERE partner_kyc.partner_id = partners.partner_id
         )`,
      [partnerId, email.trim(),registrationToken]
    );

    if (result.affectedRows !== 1) {
      return res.status(409).json({
        success: false,
        message: "Profile not eligible for rollback",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Incomplete partner profile rolled back",
    });
  } catch (error) {
    console.error("Partner Rollback Error:", error);

    return res.status(500).json({
      success: false,
      message: "Partner rollback failed",
    });
  }
};

const activatePartnerProfile = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const { email,registrationToken  } = req.body;

    if (
      !/^[1-9]\d*$/.test(partnerId) ||
      typeof registrationToken !== "string" ||
      !/^[a-f0-9]{64}$/.test(registrationToken) ||
      typeof email !== "string" ||
      !email.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid activation details",
      });
    }

    const [result] = await connection.query(
      `UPDATE partners
       SET status = 'active',
        registration_token = NULL
       WHERE partner_id = ?
         AND email = ?
         AND status = 'inactive'`,
      [partnerId, email.trim(),registrationToken]
    );

    if (result.affectedRows !== 1) {
      return res.status(409).json({
        success: false,
        message: "Partner profile not eligible for activation",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Partner profile activated",
    });
  } catch (error) {
    console.error("Partner Activation Error:", error);

    return res.status(500).json({
      success: false,
      message: "Partner activation failed",
    });
  }
};

 const getPartnerByRegistrationToken = async (req, res) => {
  try {
    const { registrationToken } = req.params;

    if (!/^[a-f0-9]{64}$/.test(registrationToken || "")) {
      return res.status(400).json({
        success: false,
        message: "Invalid registration token",
      });
    }

    const [partners] = await connection.query(
      `SELECT partner_id, email, status
       FROM partners
       WHERE registration_token = ?
       LIMIT 1`,
      [registrationToken]
    );

    if (partners.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Registration profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: partners[0],
    });
  } catch (error) {
    console.error("Registration Profile Lookup Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to find registration profile",
    });
  }
};
module.exports = { getPartnerProfile,createPartnerProfile,rollbackPartnerProfile,activatePartnerProfile,getPartnerByRegistrationToken };