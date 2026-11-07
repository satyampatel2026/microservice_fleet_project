const db = require("../model/db");

// Client ki trips.
const getMyTrips = async (req, res) => {
  try {
    const [trips] = await db.query(
      `SELECT
         t.trip_id,
         t.vehicle_id,
         t.driver_id,
         t.start_location,
         t.end_location,
         t.scheduled_start,
         t.scheduled_end,
         t.actual_start,
         t.actual_end,
         t.status,
         v.vehicle_number,
         d.name AS driver_name
       FROM trips t
       INNER JOIN vehicles v ON v.vehicle_id = t.vehicle_id
       INNER JOIN drivers d ON d.driver_id = t.driver_id
       WHERE t.client_id = ?
       ORDER BY t.trip_id DESC`,
      [req.clientId]
    );

    return res.json({
      success: true,
      data: trips,
    });
  } catch (error) {
    console.error("Get trips:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load trips",
    });
  }
};

// Trip form ke vehicle aur driver dropdowns.
const getTripOptions = async (req, res) => {
  try {
    const today = new Date(
      Date.now() + 330 * 60 * 1000
    ).toISOString().slice(0, 10);

    const [vehicles] = await db.query(
      `SELECT vehicle_id, vehicle_number, vehicle_type
       FROM vehicles
       WHERE client_id = ?
         AND status = 'active'
         AND approval_status = 'verified'
         AND expiry_date >= ?
       ORDER BY vehicle_number ASC`,
      [req.clientId, today]
    );

    const [drivers] = await db.query(
      `SELECT driver_id, name, mobile
       FROM drivers
       WHERE client_id = ?
         AND status = 'active'
         AND licence_expiry >= ?
       ORDER BY name ASC`,
      [req.clientId, today]
    );

    return res.json({
      success: true,
      data: {
        vehicles,
        drivers,
      },
    });
  } catch (error) {
    console.error("Get trip options:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load vehicles and drivers",
    });
  }
};

const createTrip = async (req, res) => {
  const body = req.body || {};
  const vehicleId = Number(body.vehicle_id);
  const driverId = Number(body.driver_id);
  const startLocation = typeof body.start_location === "string" ? body.start_location.trim() : "";
  const endLocation = typeof body.end_location === "string" ? body.end_location.trim() : "";
  const start = typeof body.scheduled_start === "string" ? body.scheduled_start : "";
  const end = typeof body.scheduled_end === "string" ? body.scheduled_end : "";

  if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0 || !Number.isSafeInteger(driverId) || driverId <= 0) {
    return res.status(400).json({ success: false, message: "Select a valid vehicle and driver" });
  }
  if (startLocation.length < 3 || startLocation.length > 255 || endLocation.length < 3 || endLocation.length > 255) {
    return res.status(400).json({ success: false, message: "Start and end locations must be 3 to 255 characters" });
  }

  // Frontend datetime-local format: YYYY-MM-DDTHH:mm. Dono times India time hain.
  const pattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  const startDate = new Date(`${start}:00+05:30`);
  const endDate = new Date(`${end}:00+05:30`);
  const validDates = pattern.test(start) && pattern.test(end) &&
    Number.isFinite(startDate.getTime()) && Number.isFinite(endDate.getTime()) &&
    new Date(startDate.getTime() + 330 * 60000).toISOString().slice(0, 16) === start &&
    new Date(endDate.getTime() + 330 * 60000).toISOString().slice(0, 16) === end;

  if (!validDates || startDate.getTime() <= Date.now() || endDate <= startDate) {
    return res.status(400).json({ success: false, message: "Choose a future start time and an end time after it (India time)" });
  }

  // MySQL DATETIME mein India wall-clock time save hoga.
  const sqlStart = start.replace("T", " ") + ":00";
  const sqlEnd = end.replace("T", " ") + ":00";
  const endDay = end.slice(0, 10);
  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    // Same vehicle ki concurrent booking ko queue mein rakho.
    const [vehicles] = await connection.query(
      `SELECT vehicle_id, status, approval_status,
              DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiry_date
       FROM vehicles WHERE vehicle_id = ? AND client_id = ? FOR UPDATE`,
      [vehicleId, req.clientId]
    );
    const vehicle = vehicles[0];
    if (!vehicle || vehicle.status !== "active" || vehicle.approval_status !== "verified" || !vehicle.expiry_date || vehicle.expiry_date < endDay) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Vehicle must be yours, active, verified and have valid RC through trip end" });
    }

    // Same driver kisi doosre vehicle ke saath bhi double book nahi hona chahiye.
    const [drivers] = await connection.query(
      `SELECT driver_id, status,
              DATE_FORMAT(licence_expiry, '%Y-%m-%d') AS licence_expiry
       FROM drivers WHERE driver_id = ? AND client_id = ? FOR UPDATE`,
      [driverId, req.clientId]
    );
    const driver = drivers[0];
    if (!driver || driver.status !== "active" || !driver.licence_expiry || driver.licence_expiry < endDay) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Driver must be yours, active and have valid licence through trip end" });
    }

    // Existing scheduled trip overlap kare, ya trip abhi ongoing ho, to reject.
    const [busyTrips] = await connection.query(
      `SELECT trip_id FROM trips
       WHERE client_id = ?
         AND (vehicle_id = ? OR driver_id = ?)
         AND (
           status = 'ongoing'
           OR (status = 'scheduled' AND scheduled_start < ? AND scheduled_end > ?)
         )
       LIMIT 1 FOR UPDATE`,
      [req.clientId, vehicleId, driverId, sqlEnd, sqlStart]
    );
    if (busyTrips.length > 0) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "Vehicle or driver has an overlapping booking or an ongoing trip" });
    }

    const [result] = await connection.query(
      `INSERT INTO trips
         (client_id, vehicle_id, driver_id, start_location, end_location,
          scheduled_start, scheduled_end)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [req.clientId, vehicleId, driverId, startLocation, endLocation, sqlStart, sqlEnd]
    );
    await connection.commit();
    return res.status(201).json({
      success: true,
      message: "Trip created successfully",
      data: { trip_id: result.insertId, status: "scheduled" },
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error("Create trip:", error.message);
    const retry = error.code === "ER_LOCK_DEADLOCK" || error.code === "ER_LOCK_WAIT_TIMEOUT";
    return res.status(retry ? 409 : 500).json({
      success: false,
      message: retry ? "Another booking is being processed. Please try again." : "Unable to create trip",
    });
  } finally {
    if (connection) connection.release();
  }
};

const updateTripStatus = async (req, res) => {
  const tripId = Number(req.params.tripId);
  const nextStatus = req.body?.status;
  if (!Number.isSafeInteger(tripId) || tripId <= 0 || !["ongoing", "completed", "cancelled"].includes(nextStatus)) {
    return res.status(400).json({ success: false, message: "Invalid trip ID or status" });
  }
  let connection;
  try {
    connection = await db.getConnection();
    await connection.beginTransaction();
    const [trips] = await connection.query(
      `SELECT trip_id, vehicle_id, driver_id, status,
              DATE_FORMAT(scheduled_start, '%Y-%m-%d %H:%i:%s') AS scheduled_start,
              DATE_FORMAT(scheduled_end, '%Y-%m-%d %H:%i:%s') AS scheduled_end
       FROM trips WHERE trip_id = ? AND client_id = ? FOR UPDATE`,
      [tripId, req.clientId]
    );
    const trip = trips[0];
    if (!trip) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: "Trip not found" });
    }

    const validChange =
      (trip.status === "scheduled" && ["ongoing", "cancelled"].includes(nextStatus)) ||
      (trip.status === "ongoing" && nextStatus === "completed");
    if (!validChange) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: "This trip status change is not allowed" });
    }

    // Create API ki tarah saare trip times India wall-clock time hain.
    const now = new Date(Date.now() + 330 * 60000).toISOString().slice(0, 19).replace("T", " ");
    const today = now.slice(0, 10);

    if (nextStatus === "ongoing") {
      if (now < trip.scheduled_start || now >= trip.scheduled_end) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: "Start the trip within its scheduled time window" });
      }

      const [vehicles] = await connection.query(
        `SELECT vehicle_id, status, approval_status,
                DATE_FORMAT(expiry_date, '%Y-%m-%d') AS expiry_date
         FROM vehicles WHERE vehicle_id = ? AND client_id = ? FOR UPDATE`,
        [trip.vehicle_id, req.clientId]
      );
      const [drivers] = await connection.query(
        `SELECT driver_id, status,
                DATE_FORMAT(licence_expiry, '%Y-%m-%d') AS licence_expiry
         FROM drivers WHERE driver_id = ? AND client_id = ? FOR UPDATE`,
        [trip.driver_id, req.clientId]
      );
      const vehicle = vehicles[0];
      const driver = drivers[0];
      const requiredDate = trip.scheduled_end.slice(0, 10);
      if (!vehicle || vehicle.status !== "active" || vehicle.approval_status !== "verified" || !vehicle.expiry_date || vehicle.expiry_date < requiredDate ||
          !driver || driver.status !== "active" || !driver.licence_expiry || driver.licence_expiry < requiredDate) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: "Vehicle or driver is unavailable, or documents expire before trip end" });
      }

      const [busy] = await connection.query(
        `SELECT trip_id FROM trips
         WHERE client_id = ? AND trip_id <> ? AND status = 'ongoing'
           AND (vehicle_id = ? OR driver_id = ?)
         LIMIT 1 FOR UPDATE`,
        [req.clientId, tripId, trip.vehicle_id, trip.driver_id]
      );
      if (busy.length > 0) {
        await connection.rollback();
        return res.status(409).json({ success: false, message: "Vehicle or driver is already on an ongoing trip" });
      }

      await connection.query(
        "UPDATE trips SET status = 'ongoing', actual_start = ? WHERE trip_id = ? AND client_id = ?",
        [now, tripId, req.clientId]
      );
    } else if (nextStatus === "completed") {
      await connection.query(
        "UPDATE trips SET status = 'completed', actual_end = ? WHERE trip_id = ? AND client_id = ?",
        [now, tripId, req.clientId]
      );
    } else {
      await connection.query(
        "UPDATE trips SET status = 'cancelled' WHERE trip_id = ? AND client_id = ?",
        [tripId, req.clientId]
      );
    }

    await connection.commit();
    return res.json({ success: true, message: "Trip status updated successfully", data: { trip_id: tripId, status: nextStatus } });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error("Update trip status:", error.message);
    const retry = ["ER_LOCK_DEADLOCK", "ER_LOCK_WAIT_TIMEOUT"].includes(error.code);
    return res.status(retry ? 409 : 500).json({ success: false, message: retry ? "Another trip update is being processed. Please try again." : "Unable to update trip status" });
  } finally {
    if (connection) connection.release();
  }
};

module.exports = {getMyTrips, getTripOptions,createTrip,updateTripStatus};