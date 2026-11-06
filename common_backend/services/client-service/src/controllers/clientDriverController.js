const db = require("../model/db");

// Login wale client ke drivers.
const getMyDrivers = async (req, res) => {
  try {
    const [drivers] = await db.query(
      `SELECT driver_id, name, mobile, licence_number,
              licence_expiry, status, created_at
       FROM drivers
       WHERE client_id = ?
       ORDER BY driver_id DESC`,
      [req.clientId]
    );

    return res.json({
      success: true,
      data: drivers,
    });
  } catch (error) {
    console.error("Get drivers:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load drivers",
    });
  }
};

// Naya driver add karo.
const addDriver = async (req, res) => {
  const body = req.body || {};

  const name =
    typeof body.name === "string" ? body.name.trim() : "";

  const mobile =
    typeof body.mobile === "string" ? body.mobile.trim() : "";

  const licenceNumber =
    typeof body.licence_number === "string"
      ? body.licence_number.trim().toUpperCase()
      : "";

  const licenceExpiry =
    typeof body.licence_expiry === "string"
      ? body.licence_expiry
      : "";

  if (name.length < 3 || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Name must be 3 to 100 characters",
    });
  }

  if (!/^[6-9][0-9]{9}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid 10 digit mobile number",
    });
  }

  // Basic format check; licence ki government verification nahi hai.
  if (!/^[A-Z0-9 -]{5,30}$/.test(licenceNumber)) {
    return res.status(400).json({
      success: false,
      message: "Licence number must be 5 to 30 characters",
    });
  }

  const expiryDate = new Date(`${licenceExpiry}T00:00:00Z`);

  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(licenceExpiry) &&
    Number.isFinite(expiryDate.getTime()) &&
    expiryDate.toISOString().slice(0, 10) === licenceExpiry;

  // India ki current date.
  const today = new Date(
    Date.now() + 330 * 60 * 1000
  ).toISOString().slice(0, 10);

  if (!validDate || licenceExpiry < today) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid licence expiry date, today or later",
    });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO drivers
         (client_id, name, mobile, licence_number, licence_expiry)
       VALUES (?, ?, ?, ?, ?)`,
      [
        req.clientId,
        name,
        mobile,
        licenceNumber,
        licenceExpiry,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Driver added successfully",
      data: {
        driver_id: result.insertId,
        name,
        mobile,
        licence_number: licenceNumber,
        licence_expiry: licenceExpiry,
        status: "active",
      },
    });
  } catch (error) {
    console.error("Add driver:", error.message);

    return res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      success: false,
      message:
        error.code === "ER_DUP_ENTRY"
          ? "Driver mobile or licence already exists"
          : "Unable to add driver",
    });
  }
};

const updateDriverStatus = async (req, res) => {
  const driverId = Number(req.params.driverId);
  const status = req.body?.status;

  if (!Number.isSafeInteger(driverId) || driverId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid driver ID",
    });
  }

  if (!["active", "inactive"].includes(status)) {
    return res.status(400).json({
      success: false,
      message: "Invalid driver status",
    });
  }

  try {
    // Driver isi client ka hona chahiye.
    const [drivers] = await db.query(
      `SELECT driver_id
       FROM drivers
       WHERE driver_id = ? AND client_id = ?
       LIMIT 1`,
      [driverId, req.clientId]
    );

    if (drivers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    await db.query(
      `UPDATE drivers
       SET status = ?
       WHERE driver_id = ? AND client_id = ?`,
      [status, driverId, req.clientId]
    );

    return res.json({
      success: true,
      message: "Driver status updated successfully",
      data: {
        driver_id: driverId,
        status,
      },
    });
  } catch (error) {
    console.error("Update driver status:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to update driver status",
    });
  }
};

const updateDriver = async (req, res) => {
  const driverId = Number(req.params.driverId);
  const body = req.body || {};

  const name =
    typeof body.name === "string" ? body.name.trim() : "";

  const mobile =
    typeof body.mobile === "string" ? body.mobile.trim() : "";

  const licenceNumber =
    typeof body.licence_number === "string"
      ? body.licence_number.trim().toUpperCase()
      : "";

  const licenceExpiry =
    typeof body.licence_expiry === "string"
      ? body.licence_expiry
      : "";

  if (!Number.isSafeInteger(driverId) || driverId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid driver ID",
    });
  }

  if (name.length < 3 || name.length > 100) {
    return res.status(400).json({
      success: false,
      message: "Name must be 3 to 100 characters",
    });
  }

  if (!/^[6-9][0-9]{9}$/.test(mobile)) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid 10 digit mobile number",
    });
  }

  if (!/^[A-Z0-9 -]{5,30}$/.test(licenceNumber)) {
    return res.status(400).json({
      success: false,
      message: "Licence number must be 5 to 30 characters",
    });
  }

  const expiryDate = new Date(`${licenceExpiry}T00:00:00Z`);

  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(licenceExpiry) &&
    Number.isFinite(expiryDate.getTime()) &&
    expiryDate.toISOString().slice(0, 10) === licenceExpiry;

  const today = new Date(
    Date.now() + 330 * 60 * 1000
  ).toISOString().slice(0, 10);

  if (!validDate || licenceExpiry < today) {
    return res.status(400).json({
      success: false,
      message: "Enter a valid licence expiry date, today or later",
    });
  }

  try {
    const [drivers] = await db.query(
      `SELECT driver_id
       FROM drivers
       WHERE driver_id = ? AND client_id = ?
       LIMIT 1`,
      [driverId, req.clientId]
    );

    if (drivers.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Driver not found",
      });
    }

    await db.query(
      `UPDATE drivers
       SET name = ?, mobile = ?,
           licence_number = ?, licence_expiry = ?
       WHERE driver_id = ? AND client_id = ?`,
      [
        name,
        mobile,
        licenceNumber,
        licenceExpiry,
        driverId,
        req.clientId,
      ]
    );

    return res.json({
      success: true,
      message: "Driver updated successfully",
      data: {
        driver_id: driverId,
        name,
        mobile,
        licence_number: licenceNumber,
        licence_expiry: licenceExpiry,
      },
    });
  } catch (error) {
    console.error("Update driver:", error.message);

    return res.status(error.code === "ER_DUP_ENTRY" ? 409 : 500).json({
      success: false,
      message:
        error.code === "ER_DUP_ENTRY"
          ? "Driver mobile or licence already exists"
          : "Unable to update driver",
    });
  }
};

module.exports = {getMyDrivers,addDriver,updateDriverStatus,updateDriver};