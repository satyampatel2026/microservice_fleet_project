const db = require("../model/db");
const {
  cloudinary,
  uploadFile
} = require("../config/cloudinary");
const columns = `vehicle_id, vehicle_number, vehicle_type, brand, model, status,
  DATE_FORMAT(registration_date, '%Y-%m-%d') AS registration_date,
  DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiry_date,
  approval_status, rejection_reason, (rc_public_id IS NOT NULL) AS has_rc,
  rc_public_id, rc_resource_type, rc_format, created_at`;
  
const getTodayDate = () => new Date(Date.now() + 330 * 60000).toISOString().slice(0, 10);
function isValidDate(date) {
  if (typeof date !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) return false;
  return parsedDate.toISOString().slice(0, 10) === date;
}

// Add aur Edit dono ki registration save yahan hoti hai.
async function saveVehicleRegistration(req, res) {
  const vehicleId = req.params.vehicleId === undefined ? null : Number(req.params.vehicleId);
  if (vehicleId !== null && (!Number.isSafeInteger(vehicleId) || vehicleId <= 0)) {
    return res.status(400).json({
      success: false,
      message: "Invalid vehicle ID"
    });
  }
  const body = req.body || {};
  const text = key => typeof body[key] === "string" ? body[key].trim() : "";
  const vehicleNumber = text("vehicle_number").replace(/\s+/g, "").toUpperCase();
  const vehicleType = text("vehicle_type"),
    brand = text("brand"),
    model = text("model");
  const registrationDate = text("registration_date"),
    expiryDate = text("expiry_date");
  if (!/^[A-Z0-9]{4,20}$/.test(vehicleNumber) || !["Car", "Bus", "Van", "Truck"].includes(vehicleType)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid vehicle number and type"
    });
  }
  if (brand.length > 100 || model.length > 100 || !isValidDate(registrationDate) || !isValidDate(expiryDate) || registrationDate > getTodayDate() || expiryDate <= registrationDate || expiryDate < getTodayDate()) {
    return res.status(400).json({
      success: false,
      message: "Enter valid registration/expiry dates. RC cannot be expired."
    });
  }
  if (vehicleId === null && !req.file) return res.status(400).json({
    success: false,
    message: "Upload RC (JPEG/PDF, max 200 KB)"
  });
  let connection, uploaded, oldRc;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [clients] = await connection.query("SELECT status FROM clients WHERE client_id = ? FOR UPDATE", [req.clientId]);
    if (!clients.length || clients[0].status !== "active") {
      await connection.rollback();
      return res.status(403).json({
        success: false,
        message: "Client account is unavailable"
      });
    }
    let old = {};
    if (vehicleId !== null) {
      const [rows] = await connection.query("SELECT * FROM vehicles WHERE vehicle_id = ? AND client_id = ? FOR UPDATE", [vehicleId, req.clientId]);
      if (!rows.length) {
        await connection.rollback();
        return res.status(404).json({
          success: false,
          message: "Vehicle not found"
        });
      }
      old = rows[0];
    }
    if (!req.file && !old.rc_public_id) {
      await connection.rollback();
      return res.status(400).json({
        success: false,
        message: "RC upload is required"
      });
    }
    let rc = {
      public_id: old.rc_public_id,
      resource_type: old.rc_resource_type,
      format: old.rc_format
    };
    if (req.file) {
      uploaded = await uploadFile(req.file.buffer, `fleetrova/clients/${req.clientId}/vehicle-rc`, true);
      rc = uploaded;
      if (old.rc_public_id) oldRc = {
        public_id: old.rc_public_id,
        resource_type: old.rc_resource_type
      };
    }
    const values = [vehicleNumber, vehicleType, brand || null, model || null, registrationDate, expiryDate, rc.public_id, rc.resource_type, rc.format || ""];
    let id = vehicleId;
    if (vehicleId === null) {
      const [result] = await connection.query(`INSERT INTO vehicles
        (vehicle_number, vehicle_type, brand, model, registration_date, expiry_date, rc_public_id, rc_resource_type, rc_format, client_id, approval_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`, [...values, req.clientId]);
      id = result.insertId;
    } else {
      // Every registration edit requires fresh admin verification. Ownership/status cannot be changed here.
      await connection.query(`UPDATE vehicles SET vehicle_number=?, vehicle_type=?, brand=?, model=?, registration_date=?, expiry_date=?,
        rc_public_id=?, rc_resource_type=?, rc_format=?, approval_status='pending', rejection_reason=NULL, reviewed_by=NULL, reviewed_at=NULL
        WHERE vehicle_id=? AND client_id=?`, [...values, vehicleId, req.clientId]);
    }
    // RC upload Add/Edit request mein hi hua; uska view URL bhi same response mein.
    const rcUrl = cloudinary.utils.private_download_url(rc.public_id, rc.format || "", {
      resource_type: rc.resource_type,
      type: "authenticated",
      expires_at: Math.floor(Date.now() / 1000) + 15 * 60,
      attachment: false,
    });
    await connection.commit();
    if (oldRc) await cloudinary.uploader.destroy(oldRc.public_id, {
      resource_type: oldRc.resource_type,
      type: "authenticated"
    }).catch(() => {});
    return res.status(vehicleId === null ? 201 : 200).json({
      success: true,
      message: "Vehicle submitted for admin verification",
      data: {
        vehicle_id: id,
        approval_status: "pending",
        rc_url: rcUrl
      }
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    if (uploaded) await cloudinary.uploader.destroy(uploaded.public_id, {
      resource_type: uploaded.resource_type,
      type: "authenticated"
    }).catch(() => {});
    console.error("Save vehicle:", error.code || error.message);
    return res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      success: false,
      message: error.code === "ER_DUP_ENTRY" ? "Vehicle number already registered" : "Unable to save vehicle"
    });
  } finally {
    if (connection) connection.release();
  }
}
const addVehicle = (req, res) => saveVehicleRegistration(req, res);
const updateVehicle = (req, res) => saveVehicleRegistration(req, res);
const getMyVehicles = async (req, res) => {
  try {
    const [rows] = await db.query(`SELECT ${columns} FROM vehicles WHERE client_id=? ORDER BY vehicle_id DESC`, [req.clientId]);
    // Client already authenticated hai aur query owner-scoped hai.
    // List ke saath signed URL bhejo; separate RC-view API call nahi chahiye.
    for (const vehicle of rows) {
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
    return res.json({
      success: true,
      data: rows
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to load vehicles"
    });
  }
};
const updateVehicleStatus = async (req, res) => {
  const id = Number(req.params.vehicleId),
    status = req.body?.status;
  if (!Number.isSafeInteger(id) || id <= 0 || !["active", "inactive"].includes(status)) return res.status(400).json({
    success: false,
    message: "Invalid vehicle or status"
  });
  try {
    // Deactivation always allowed. Reactivation only after verification with unexpired RC.
    const [result] = await db.query(`UPDATE vehicles SET status=? WHERE vehicle_id=? AND client_id=?
      AND (?='inactive' OR (approval_status='verified' AND expiry_date >= ?))`, [status, id, req.clientId, status, getTodayDate()]);
    if (!result.affectedRows) return res.status(409).json({
      success: false,
      message: "Vehicle unavailable, unverified or RC expired"
    });
    return res.json({
      success: true,
      message: `Vehicle ${status}`
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to update vehicle status"
    });
  }
};
const getVehicleForTracking = async (req, res) => {
  const id = Number(req.params.vehicleId);
  if (!Number.isSafeInteger(id) || id <= 0) return res.status(400).json({
    success: false,
    message: "Invalid vehicle ID"
  });
  try {
    const [rows] = await db.query(`SELECT v.vehicle_id, v.client_id, v.vehicle_number, v.approval_status,
      DATE_FORMAT(v.expiry_date, '%Y-%m-%d') AS expiry_date,
      CASE WHEN v.approval_status='verified' AND v.expiry_date >= ? THEN v.status ELSE 'inactive' END AS status,
      c.status AS client_status FROM vehicles v JOIN clients c ON c.client_id=v.client_id WHERE v.vehicle_id=? LIMIT 1`, [getTodayDate(), id]);
    if (!rows.length) return res.status(404).json({
      success: false,
      message: "Vehicle not found"
    });
    return res.json({
      success: true,
      data: rows[0]
    });
  } catch {
    return res.status(500).json({
      success: false,
      message: "Unable to verify vehicle"
    });
  }
};

// Admin tracking ke liye sabhi clients ke verified vehicles.
const getVehiclesForAdminTracking = async (req, res) => {
  try {
    const [vehicles] = await db.query(
      `SELECT
         v.vehicle_id,
         v.client_id,
         v.vehicle_number,
         v.vehicle_type,
         v.status,
         v.expiry_date,
         c.name AS client_name
       FROM vehicles v
       INNER JOIN clients c ON c.client_id = v.client_id
       WHERE v.approval_status = 'verified'
         AND c.status = 'active'
       ORDER BY c.name ASC, v.vehicle_number ASC`
    );

    return res.json({
      success: true,
      data: vehicles,
    });
  } catch (error) {
    console.error("Admin tracking vehicles:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load vehicles",
    });
  }
};
module.exports = {
  addVehicle,
  updateVehicle,
  getMyVehicles,
  updateVehicleStatus,
  getVehicleForTracking,getVehiclesForAdminTracking
};
