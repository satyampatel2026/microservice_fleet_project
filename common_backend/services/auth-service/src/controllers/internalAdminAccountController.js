const crypto = require("node:crypto");
const authDb = require("../model/authDb");

const provisionAdminAccount = async (req, res) => {
  const { admin_id, email, password_hash, status } = req.body;

  if (
    !Number.isSafeInteger(Number(admin_id)) ||
    Number(admin_id) <= 0 ||
    typeof email !== "string" ||
    !email.trim() ||
    typeof password_hash !== "string" ||
    !/^\$2[aby]\$\d{2}\$/.test(password_hash) ||
    !["active", "inactive"].includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid account details",
    });
  }

  try {
    const [existing] = await authDb.query(
      `SELECT auth_id, admin_id, email
       FROM admin_accounts
       WHERE admin_id = ? OR email = ?`,
      [Number(admin_id), email.trim()]
    );

    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Account ID or email already exists",
      });
    }

    const [result] = await authDb.query(
      `INSERT INTO admin_accounts
       (admin_id, email, password_hash, status)
       VALUES (?, ?, ?, ?)`,
      [Number(admin_id), email.trim(), password_hash, status]
    );

    return res.status(201).json({
      success: true,
      auth_id: result.insertId,
      admin_id: Number(admin_id),
    });
  } catch (error) {
    console.error("Provision Admin Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Account provisioning failed",
    });
  }
};

const verifyInternalService = (req, res, next) => {
  const expected = process.env.INTERNAL_SERVICE_KEY;
  const received = req.get("x-internal-service-key");

  if (!expected || !received) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  const a = Buffer.from(expected);
  const b = Buffer.from(received);

  if (
    a.length !== b.length ||
    !crypto.timingSafeEqual(a, b)
  ) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  next();
};

const updateAdminAccount = async (req, res) => {
  const adminId = Number(req.params.adminId);
  const { email, status } = req.body;

  if (!Number.isSafeInteger(adminId) || adminId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid admin ID",
    });
  }

  if (
    typeof email !== "string" ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) ||
    !["active", "inactive"].includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid email and status required",
    });
  }

  try {
    const [result] = await authDb.query(
      `UPDATE admin_accounts
       SET email = ?, status = ?
       WHERE admin_id = ?`,
      [email.trim().toLowerCase(), status, adminId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Login account not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Login account updated successfully",
    });
  } catch (error) {
    console.error("Update Admin Account Error:", error);

    if (error.code === "ER_DUP_ENTRY") {
      return res.status(409).json({
        success: false,
        message: "Email already exists",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Unable to update login account",
    });
  }
};

const deleteAdminAccount = async (req, res) => {
  const adminId = Number(req.params.adminId);

  if (!Number.isSafeInteger(adminId) || adminId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid admin ID",
    });
  }

  try {
    const [result] = await authDb.query(
      "DELETE FROM admin_accounts WHERE admin_id = ?",
      [adminId]
    );

    return res.status(200).json({
      success: true,
      message: "Login account removed",
      deleted: result.affectedRows > 0,
    });
  } catch (error) {
    console.error("Delete Admin Account Error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to remove login account",
    });
  }
};

module.exports = {
  provisionAdminAccount,deleteAdminAccount,
  verifyInternalService,updateAdminAccount
};