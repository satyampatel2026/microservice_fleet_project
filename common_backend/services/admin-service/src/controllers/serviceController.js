const connection = require("../model/db");

// ================= GET SERVICES =================

const getServices = async (req, res) => {
  try {
    const [services] = await connection.query(`
      SELECT
        s.service_id,
        s.category_id,
        c.category_name,
        s.service_name,
        s.description,
        s.status,
        s.created_at,
        s.updated_at
      FROM category_services s
      INNER JOIN service_categories c
        ON c.category_id = s.category_id
      ORDER BY c.category_name ASC, s.service_name ASC
    `);

    return res.status(200).json({
      success: true,
      data: services,
    });
  } catch (error) {
    console.error("Get Services Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch services",
    });
  }
};

// ================= ADD SERVICE =================

const addService = async (req, res) => {
  try {
    const { category_id, service_name, description } = req.body || {};

    const categoryId = Number(category_id);

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Valid category ID is required",
      });
    }

    if (
      typeof service_name !== "string" ||
      !service_name.trim() ||
      service_name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid service name is required (max 100 characters)",
      });
    }

    if (
      description != null &&
      (typeof description !== "string" || description.length > 255)
    ) {
      return res.status(400).json({
        success: false,
        message: "Description must be a string (max 255 characters)",
      });
    }

    // Verify category exists and is active
    const [categories] = await connection.query(
      `SELECT category_id
       FROM service_categories
       WHERE category_id = ?
         AND status = 'active'
       LIMIT 1`,
      [categoryId]
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    const [result] = await connection.query(
      `INSERT INTO category_services
         (category_id, service_name, description)
       VALUES (?, ?, ?)`,
      [
        categoryId,
        service_name.trim(),
        description?.trim() || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Service added successfully",
      data: {
        service_id: result.insertId,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Service already exists in this category",
      });
    }

    if (error.code === "ER_NO_REFERENCED_ROW_2") {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    console.error("Add Service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add service",
    });
  }
};

// ================= UPDATE SERVICE =================

const updateService = async (req, res) => {
  try {
    const serviceId = Number(req.params.serviceId);
    const { category_id, service_name, description, status } = req.body || {};

    const categoryId = Number(category_id);

    if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID",
      });
    }

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (
      typeof service_name !== "string" ||
      !service_name.trim() ||
      service_name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid service name is required (max 100 characters)",
      });
    }

    if (
      description != null &&
      (typeof description !== "string" || description.length > 255)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid description",
      });
    }

    if (!["active", "inactive"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service status",
      });
    }

    // Verify category exists and is active
    const [categories] = await connection.query(
      `SELECT category_id
       FROM service_categories
       WHERE category_id = ?
         AND status = 'active'
       LIMIT 1`,
      [categoryId]
    );

    if (categories.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Category not found or inactive",
      });
    }

    const [result] = await connection.query(
      `UPDATE category_services
       SET category_id = ?,
           service_name = ?,
           description = ?,
           status = ?
       WHERE service_id = ?`,
      [
        categoryId,
        service_name.trim(),
        description?.trim() || null,
        status,
        serviceId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Service updated successfully",
    });

  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Service already exists in this category",
      });
    }

    console.error("Update Service Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update service",
    });
  }
};

module.exports = {
  getServices,
  addService,updateService
};