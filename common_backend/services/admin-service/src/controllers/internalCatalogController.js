const connection = require("../model/db");

// ================= VALIDATE SELECTED SERVICES =================

const validateSelectedServices = async (req, res) => {
  try {
    const { service_ids } = req.body || {};

    // STEP 1: Check service_ids array

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

    // STEP 2: Check IDs and duplicates

    const checkedIds = [];

    for (const id of service_ids) {

      // ID must be a positive integer
      if (!Number.isSafeInteger(id) || id <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid service ID",
        });
      }

      // Duplicate ID check
      if (checkedIds.includes(id)) {
        return res.status(400).json({
          success: false,
          message: "Duplicate service ID",
        });
      }

      checkedIds.push(id);
    }

    // STEP 3: Prepare SQL placeholders

    const placeholders = [];

    for (const id of service_ids) {
      placeholders.push("?");
    }

    const questionMarks = placeholders.join(",");

    // STEP 4: Get active services from database

    const [rows] = await connection.query(
      `SELECT s.service_id
       FROM category_services s
       INNER JOIN service_categories c
         ON s.category_id = c.category_id
       WHERE s.service_id IN (${questionMarks})
         AND s.status = 'active'
         AND c.status = 'active'`,
      service_ids
    );

    // STEP 5: Check every selected service

    const invalidIds = [];

    for (const id of service_ids) {
      let found = false;

      for (const row of rows) {
        if (row.service_id === id) {
          found = true;
          break;
        }
      }

      if (!found) {
        invalidIds.push(id);
      }
    }

    // STEP 6: Reject invalid or inactive services

    if (invalidIds.length > 0) {
      return res.status(422).json({
        success: false,
        message: "Some selected services are unavailable",
        invalid_service_ids: invalidIds,
      });
    }

    // STEP 7: All services valid

    return res.status(200).json({
      success: true,
      message: "All selected services are valid",
      data: {
        service_ids: service_ids,
      },
    });

  } catch (error) {
    console.error("Validate Services Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to validate selected services",
    });
  }
};

module.exports = {
  validateSelectedServices,
};