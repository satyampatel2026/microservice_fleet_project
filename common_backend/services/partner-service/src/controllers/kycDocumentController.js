const path = require("path");
const fs = require("fs");
const connection = require("../model/db");

const documentColumns = {
  pan: "pan_document",
  aadhaar: "aadhaar_document",
  gst: "gst_document",
};

const getPartnerDocument = async (req, res) => {
  try {
    const partnerId = req.partnerId;
    const column = documentColumns[req.params.documentType];

    if (!column) {
      return res.status(400).json({
        success: false,
        message: "Invalid document type",
      });
    }

    const [rows] = await connection.query(
      `SELECT ${column} AS documentPath
       FROM partner_kyc
       WHERE partner_id = ?`,
      [partnerId]
    );

    if (!rows.length || !rows[0].documentPath) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const relativePath = rows[0].documentPath;

    const uploadRoot = path.resolve(__dirname, "../../myfiles");
    const filePath = path.resolve(
      uploadRoot,
      relativePath.replace(/^\/myfiles\//, "")
    );

    if (
      !relativePath.startsWith("/myfiles/") ||
      !filePath.startsWith(uploadRoot + path.sep)
    ) {
      return res.status(403).json({
        success: false,
        message: "Invalid document path",
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Document file not found",
      });
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath);
  } catch (error) {
    console.error("KYC Document Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load document",
    });
  }
};

const getAdminDocument = async (req, res) => {
  try {
    const kycId = Number(req.params.kycId);
    const column = documentColumns[req.params.documentType];

    if (!Number.isSafeInteger(kycId) || kycId <= 0 || !column) {
      return res.status(400).json({
        success: false,
        message: "Invalid KYC ID or document type",
      });
    }

    // Admin Service se current roles aur status check
    const authResponse = await fetch(
      `${process.env.ADMIN_SERVICE_URL || "http://localhost:5002"}/internal/admin/users/${req.userId}/authorization`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!authResponse.ok) {
      return res.status(403).json({
        success: false,
        message: "Admin authorization failed",
      });
    }

    const authorization = await authResponse.json();

    const allowedRoles = ["Admin", "SUPER ADMIN", "Manager"];

    if (
      authorization.success !== true ||
      String(authorization.status).toLowerCase() !== "active" ||
      !Array.isArray(authorization.roles) ||
      !authorization.roles.some((role) => allowedRoles.includes(role))
    ) {
      return res.status(403).json({
        success: false,
        message: "KYC document access denied",
      });
    }

    const [rows] = await connection.query(
      `SELECT ${column} AS documentPath
       FROM partner_kyc
       WHERE kyc_id = ?`,
      [kycId]
    );

    if (!rows.length || !rows[0].documentPath) {
      return res.status(404).json({
        success: false,
        message: "Document not found",
      });
    }

    const relativePath = rows[0].documentPath;
    const uploadRoot = path.resolve(__dirname, "../../myfiles");

    if (!relativePath.startsWith("/myfiles/")) {
      return res.status(403).json({
        success: false,
        message: "Invalid document path",
      });
    }

    const filePath = path.resolve(
      uploadRoot,
      relativePath.slice("/myfiles/".length)
    );

    if (!filePath.startsWith(uploadRoot + path.sep)) {
      return res.status(403).json({
        success: false,
        message: "Invalid document path",
      });
    }

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: "Document file not found",
      });
    }

    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("X-Content-Type-Options", "nosniff");

    return res.sendFile(filePath);
  } catch (error) {
    console.error("Admin KYC Document Error:", error);

    return res.status(503).json({
      success: false,
      message: "Document authorization unavailable",
    });
  }
};

module.exports = {
  getPartnerDocument,getAdminDocument
};
