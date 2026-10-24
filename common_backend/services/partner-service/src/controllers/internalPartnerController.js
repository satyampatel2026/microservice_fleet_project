const connection = require("../model/db");
const axios = require("axios");

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
  const {
    partnername,
    email,
    mobile,
    registrationToken,
    service_ids,
  } = req.body || {};

  // 1. Partner details validate karo
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

  // 2. Selected service IDs validate karo
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

  // 3. Admin Service se selected services verify karo
  try {
    const adminServiceUrl = process.env.ADMIN_SERVICE_URL;

    if (!adminServiceUrl || !process.env.INTERNAL_SERVICE_KEY) {
      throw new Error("Internal service configuration missing");
    }

    const validationResponse = await axios.post(
      `${adminServiceUrl}/internal/catalog/validate-services`,
      { service_ids },
      {
        headers: {
          "x-internal-service-key":
            process.env.INTERNAL_SERVICE_KEY,
        },
        timeout: 5000,
      }
    );

    if (validationResponse.data?.success !== true) {
      throw new Error("Service validation failed");
    }
  } catch (error) {
    if (error.response?.status === 400 ||
        error.response?.status === 422) {
      return res.status(422).json({
        success: false,
        message: "Invalid or unavailable selected services",
      });
    }

    console.error("Catalog Validation Error:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to validate services right now",
    });
  }

  // 4. Database transaction start karo
  let dbConnection;

  try {
    dbConnection = await connection.getConnection();

    await dbConnection.beginTransaction();

    // 5. Partner profile insert karo
    const [result] = await dbConnection.query(
      `INSERT INTO partners
         (partner_name, email, mobile, status, registration_token)
       VALUES (UPPER(?), ?, ?, 'inactive', ?)`,
      [
        partnername.trim(),
        email.trim(),
        mobile,
        registrationToken,
      ]
    );

    const partnerId = result.insertId;

    // 6. Selected services insert karo
    for (const serviceId of service_ids) {
      await dbConnection.query(
        `INSERT INTO partner_services
           (partner_id, service_id)
         VALUES (?, ?)`,
        [partnerId, serviceId]
      );
    }

    // 7. Dono inserts successful: commit
    await dbConnection.commit();

    return res.status(201).json({
      success: true,
      message: "Partner profile created",
      data: {
        partner_id: partnerId,
      },
    });

  } catch (error) {
    if (dbConnection) {
      try {
        await dbConnection.rollback();
      } catch (rollbackError) {
        console.error(
          "Partner Transaction Rollback Error:",
          rollbackError
        );
      }
    }

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

  } finally {
    if (dbConnection) {
      dbConnection.release();
    }
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
         AND registration_token = ?
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
module.exports = { getPartnerProfile,createPartnerProfile,activatePartnerProfile,getPartnerByRegistrationToken };