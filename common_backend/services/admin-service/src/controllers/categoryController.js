const connection = require("../model/db");

// ================= GET ALL CATEGORIES =================

const getCategories = async (req, res) => {
  try {
    const [categories] = await connection.query(
      `SELECT
         category_id,
         category_name,
         description,
         status,
         created_at,
         updated_at
       FROM service_categories
       ORDER BY category_name ASC`
    );

    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error("Get Categories Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch categories",
    });
  }
};

// ================= ADD CATEGORY =================

const addCategory = async (req, res) => {
  try {
    const { category_name, description } = req.body || {};

    if (
      typeof category_name !== "string" ||
      !category_name.trim() ||
      category_name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid category name is required (max 100 characters)",
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

    const [result] = await connection.query(
      `INSERT INTO service_categories
         (category_name, description)
       VALUES (?, ?)`,
      [
        category_name.trim(),
        description?.trim() || null,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Category added successfully",
      data: {
        category_id: result.insertId,
      },
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    console.error("Add Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to add category",
    });
  }
};

// ================= UPDATE CATEGORY =================

const updateCategory = async (req, res) => {
  try {
    const categoryId = Number(req.params.categoryId);
    const { category_name, description, status } = req.body || {};

    if (!Number.isSafeInteger(categoryId) || categoryId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid category ID",
      });
    }

    if (
      typeof category_name !== "string" ||
      !category_name.trim() ||
      category_name.trim().length > 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid category name is required",
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
        message: "Invalid category status",
      });
    }

    const [result] = await connection.query(
      `UPDATE service_categories
       SET category_name = ?,
           description = ?,
           status = ?
       WHERE category_id = ?`,
      [
        category_name.trim(),
        description?.trim() || null,
        status,
        categoryId,
      ]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Category already exists",
      });
    }

    console.error("Update Category Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update category",
    });
  }
};

// ================= PUBLIC SERVICE CATALOG =================

const getPublicServiceCatalog = async (req, res) => {
  try {
    const [rows] = await connection.query(`
      SELECT
        c.category_id,
        c.category_name,
        c.description AS category_description,
        s.service_id,
        s.service_name,
        s.description AS service_description
      FROM service_categories c
      INNER JOIN category_services s
        ON s.category_id = c.category_id
        AND s.status = 'active'
      WHERE c.status = 'active'
      ORDER BY c.category_name ASC, s.service_name ASC
    `);

    const categoryMap = new Map();

    for (const row of rows) {
      if (!categoryMap.has(row.category_id)) {
        categoryMap.set(row.category_id, {
          category_id: row.category_id,
          category_name: row.category_name,
          description: row.category_description,
          services: [],
        });
      }

      categoryMap.get(row.category_id).services.push({
        service_id: row.service_id,
        service_name: row.service_name,
        description: row.service_description,
      });
    }

    return res.status(200).json({
      success: true,
      data: Array.from(categoryMap.values()),
    });

  } catch (error) {
    console.error("Public Service Catalog Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch service catalog",
    });
  }
};

module.exports = {
  getCategories,
  addCategory,updateCategory,getPublicServiceCatalog
};