const connection = require("../model/db");
const axios = require("axios");

const getMyServices = async (req, res) => {
  try {
    const partnerId = req.partnerId;

    const [services] = await connection.query(
      `SELECT service_id
       FROM partner_services
       WHERE partner_id = ?
       ORDER BY service_id ASC`,
      [partnerId]
    );

    return res.status(200).json({
      success: true,
      message: "Partner services fetched successfully",
      data: {
        service_ids: services.map((service) => service.service_id),
      },
    });
  } catch (error) {
    console.error("Get partner services error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch partner services",
    });
  }
};

const updateMyServices = async (req, res) => {
  const partnerId = req.partnerId;
  const { service_ids } = req.body;

  if (
    !Array.isArray(service_ids) ||
    service_ids.length > 100 ||
    !service_ids.every(
      (id) => Number.isSafeInteger(id) && id > 0
    ) ||
    new Set(service_ids).size !== service_ids.length
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid service IDs",
    });
  }

  let transactionConnection;

  try {
    // Validate selected services with Admin Service
    if (service_ids.length > 0) {
      const validationResponse = await axios.post(
        `${process.env.ADMIN_SERVICE_URL}/internal/catalog/validate-services`,
        { service_ids },
        {
          headers: {
            "x-internal-service-key":
              process.env.INTERNAL_SERVICE_KEY,
          },
          timeout: 5000,
        }
      );

      if (validationResponse.data.success !== true) {
        return res.status(400).json({
          success: false,
          message: "Invalid or inactive services selected",
        });
      }
    }

    transactionConnection = await connection.getConnection();
    await transactionConnection.beginTransaction();

    // Partner exists?
    const [partners] = await transactionConnection.query(
      "SELECT partner_id FROM partners WHERE partner_id = ?",
      [partnerId]
    );

    if (!partners.length) {
      await transactionConnection.rollback();

      return res.status(404).json({
        success: false,
        message: "Partner not found",
      });
    }

    // Replace existing assignments
    await transactionConnection.query(
      "DELETE FROM partner_services WHERE partner_id = ?",
      [partnerId]
    );

    for (const serviceId of service_ids) {
      await transactionConnection.query(
        `INSERT INTO partner_services (partner_id, service_id)
         VALUES (?, ?)`,
        [partnerId, serviceId]
      );
    }

    await transactionConnection.commit();

    return res.status(200).json({
      success: true,
      message: "Services updated successfully",
      data: {
        service_ids,
      },
    });
    } catch (error) {
    if (transactionConnection) {
      await transactionConnection.rollback().catch(() => {});
    }

    console.error(
      "Update partner services error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message: "Failed to update partner services",
    });
  } finally {
    if (transactionConnection) {
      transactionConnection.release();
    }
  }
};

module.exports = {
  getMyServices,updateMyServices
};