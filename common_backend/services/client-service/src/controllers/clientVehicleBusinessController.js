const db = require("../model/db");
const { cloudinary } = require("../config/cloudinary");

// =====================================================
// 1. ADMIN KE LIYE VEHICLES KI LIST
// =====================================================
const getVehicles = async (req, res) => {
  const status = req.query.status || "pending";
  const clientId = req.query.clientId === undefined || req.query.clientId === "" ? null : Number(req.query.clientId);
  if (clientId !== null && (!Number.isSafeInteger(clientId) || clientId <= 0)) {
    return res.status(400).json({ success: false, message: "Invalid client ID" });
  }
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  let page = Number(req.query.page || 1);
  const limit = 10;

  if (!["all", "pending", "verified", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid approval status" });
  }
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || search.length > 100) {
    return res.status(400).json({ success: false, message: "Invalid search or page" });
  }

  const conditions = [];
  const values = [];
  // Both count and list queries use this owner filter.
  if (clientId !== null) {
    conditions.push("v.client_id = ?");
    values.push(clientId);
  }
  if (status !== "all") {
    conditions.push("v.approval_status = ?");
    values.push(status);
  }
  if (search) {
    const text = "%" + search.replace(/[!%_]/g, "!$&") + "%";
    conditions.push("(v.vehicle_number LIKE ? ESCAPE '!' OR c.name LIKE ? ESCAPE '!' OR c.email LIKE ? ESCAPE '!')");
    values.push(text, text, text);
  }
  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";

  try {
    const [counts] = await db.query(
      `SELECT COUNT(*) AS total FROM vehicles v
       JOIN clients c ON c.client_id = v.client_id ${where}`, values
    );
    const total = Number(counts[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    page = Math.min(page, totalPages);
    const offset = (page - 1) * limit;

    const [vehicles] = await db.query(
      `SELECT v.vehicle_id, v.vehicle_number, v.vehicle_type, v.brand, v.model,
         v.status, v.approval_status, v.rejection_reason,
         DATE_FORMAT(v.registration_date, '%Y-%m-%d') AS registration_date,
         DATE_FORMAT(v.expiry_date, '%Y-%m-%d') AS expiry_date,
         (v.rc_public_id IS NOT NULL) AS has_rc,
         v.rc_public_id, v.rc_resource_type, v.rc_format,
         c.client_id, c.name, c.email
       FROM vehicles v
       JOIN clients c ON c.client_id = v.client_id
       ${where}
       ORDER BY v.vehicle_id DESC LIMIT ? OFFSET ?`,
      [...values, limit, offset]
    );
    for (const vehicle of vehicles) {
      vehicle.rc_url = null;
      if (vehicle.rc_public_id) {
        vehicle.rc_url = cloudinary.utils.private_download_url(vehicle.rc_public_id, vehicle.rc_format || "", {
          resource_type: vehicle.rc_resource_type,
          type: "authenticated",
          expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
          attachment: false,
        });
      }
      delete vehicle.rc_public_id;
      delete vehicle.rc_resource_type;
      delete vehicle.rc_format;
    }
    res.setHeader("Cache-Control", "private, no-store");
    return res.json({ success: true, data: vehicles, pagination: { page, limit, total, totalPages } });
  } catch (error) {
    console.error("Admin vehicle list:", error.message);
    return res.status(500).json({ success: false, message: "Unable to load vehicles" });
  }
};

// =====================================================
// 2. VEHICLE VERIFY / REJECT
// =====================================================
const reviewVehicle = async (req, res) => {
  const vehicleId = Number(req.params.id);
  const adminId = Number(req.body?.adminId);
  const status = req.body?.status;
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";

  if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0 || !Number.isSafeInteger(adminId) || adminId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid vehicle or admin ID" });
  }
  if (!["verified", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Select verified or rejected" });
  }
  if (status === "rejected" && (reason.length < 3 || reason.length > 500)) {
    return res.status(400).json({ success: false, message: "Rejection reason must be 3 to 500 characters" });
  }

  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Row lock: client edit aur admin review ek hi record ko conflict mein save na karein.
    const [vehicles] = await connection.query(
      `SELECT approval_status, rc_public_id,
         (registration_date IS NOT NULL AND expiry_date IS NOT NULL
          AND registration_date <= CURDATE() AND expiry_date > registration_date
          AND expiry_date >= CURDATE()) AS dates_valid
       FROM vehicles WHERE vehicle_id = ? FOR UPDATE`, [vehicleId]
    );
    if (!vehicles.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Vehicle not found" });
    }
    const vehicle = vehicles[0];
    if (vehicle.approval_status !== "pending") {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Vehicle already reviewed. Refresh the list." });
    }
    if (status === "verified" && (!vehicle.rc_public_id || !vehicle.dates_valid)) {
      await connection.rollback();
      return res.status(400).json({ success: false, message: "RC and valid registration/expiry dates are required" });
    }

    // Verify par reason clear; Reject par admin ka reason save.
    const rejectionReason = status === "rejected" ? reason : null;
    await connection.query(
      `UPDATE vehicles SET approval_status = ?, rejection_reason = ?,
       reviewed_by = ?, reviewed_at = NOW() WHERE vehicle_id = ?`,
      [status, rejectionReason, adminId, vehicleId]
    );
    await connection.commit();
    return res.json({ success: true, message: status === "verified" ? "Vehicle verified" : "Vehicle rejected with reason" });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    return res.status(500).json({ success: false, message: "Unable to review vehicle" });
  } finally {
    if (connection) connection.release();
  }
};

// 4. CLIENT BUSINESS KI REVIEW LIST
// =====================================================
const getBusinesses = async (req, res) => {
  const status = req.query.status || "pending";
  const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
  let page = Number(req.query.page || 1);
  const limit = 10;
  if (!["all", "pending", "verified", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Invalid business status" });
  }
  if (!Number.isSafeInteger(page) || page < 1 || page > 100000 || search.length > 100) {
    return res.status(400).json({ success: false, message: "Invalid search or page" });
  }
  const conditions = [];
  const values = [];
  if (status !== "all") {
    conditions.push("business_verification_status = ?");
    values.push(status);
  }
  if (search) {
    const text = "%" + search.replace(/[!%_]/g, "!$&") + "%";
    conditions.push("(name LIKE ? ESCAPE '!' OR company_name LIKE ? ESCAPE '!' OR email LIKE ? ESCAPE '!')");
    values.push(text, text, text);
  }
  const where = conditions.length ? "WHERE " + conditions.join(" AND ") : "";
  try {
    const [counts] = await db.query(`SELECT COUNT(*) AS total FROM clients ${where}`, values);
    const total = Number(counts[0].total);
    const totalPages = Math.max(1, Math.ceil(total / limit));
    page = Math.min(page, totalPages);
    const offset = (page - 1) * limit;
    const [businesses] = await db.query(
      `SELECT client_id, name, email, company_name, business_type, gstin, pan_number, aadhaar_last4,
         business_verification_status AS approval_status,
         business_rejection_reason AS rejection_reason
       FROM clients ${where} ORDER BY client_id DESC LIMIT ? OFFSET ?`, [...values, limit, offset]
    );
    return res.json({ success: true, data: businesses, pagination: { page, limit, total, totalPages } });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Unable to load client businesses" });
  }
};

// =====================================================
// 5. CLIENT BUSINESS VERIFY / REJECT
// =====================================================
const reviewBusiness = async (req, res) => {
  const clientId = Number(req.params.id);
  const adminId = Number(req.body?.adminId);
  const status = req.body?.status;
  const reason = typeof req.body?.reason === "string" ? req.body.reason.trim() : "";
  if (!Number.isSafeInteger(clientId) || clientId <= 0 || !Number.isSafeInteger(adminId) || adminId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid client or admin ID" });
  }
  if (!["verified", "rejected"].includes(status)) {
    return res.status(400).json({ success: false, message: "Select verified or rejected" });
  }
  if (status === "rejected" && (reason.length < 3 || reason.length > 500)) {
    return res.status(400).json({ success: false, message: "Rejection reason must be 3 to 500 characters" });
  }
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [clients] = await connection.query(
      `SELECT company_name, business_type, gstin, pan_number,
       aadhaar_hash, business_verification_status
       FROM clients WHERE client_id = ? FOR UPDATE`, [clientId]
    );
    if (!clients.length) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Client not found" });
    }
    const client = clients[0];
    if (client.business_verification_status !== "pending") {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Business already reviewed. Refresh the list." });
    }
    if (status === "verified") {
      if (!client.company_name || !client.business_type || (!client.gstin && !client.pan_number) || !client.aadhaar_hash) {
        await connection.rollback();
        return res.status(400).json({ success: false, message: "Company, business type, GSTIN/PAN and Aadhaar are required" });
      }
    }
    const rejectionReason = status === "rejected" ? reason : null;
    await connection.query(
      `UPDATE clients SET business_verification_status = ?, business_rejection_reason = ?,
       business_reviewed_by = ?, business_reviewed_at = NOW() WHERE client_id = ?`,
      [status, rejectionReason, adminId, clientId]
    );
    await connection.commit();
    return res.json({ success: true, message: status === "verified" ? "Client business verified" : "Client business rejected with reason" });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    return res.status(500).json({ success: false, message: "Unable to review client business" });
  } finally {
    if (connection) connection.release();
  }
};
module.exports = { getVehicles, reviewVehicle, getBusinesses, reviewBusiness };
