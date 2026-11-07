const db = require("../model/db");

// Service-request form ke dropdowns.
const getServiceRequestOptions = async (req, res) => {
  try {
    const today = new Date(
      Date.now() + 330 * 60 * 1000
    ).toISOString().slice(0, 10);

    // Sirf login wale client ke eligible vehicles.
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

    // Active services Admin Service se lo.
    const adminUrl =
      process.env.ADMIN_SERVICE_URL || "http://localhost:5002";

    const response = await fetch(
      `${adminUrl}/internal/catalog/services`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      throw new Error("Service catalog is unavailable");
    }

    const result = await response.json();

    if (result.success !== true || !Array.isArray(result.data)) {
      throw new Error("Invalid service catalog response");
    }

    return res.json({
      success: true,
      data: {
        vehicles,
        services: result.data,
      },
    });
  } catch (error) {
    console.error("Service request options:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to load vehicles and services",
    });
  }
};

const createServiceRequest = async (req, res) => {
  const body = req.body || {};

  const vehicleId = Number(body.vehicle_id);
  const serviceId = Number(body.service_id);
  const description =
    typeof body.problem_description === "string"
      ? body.problem_description.trim()
      : "";
  const priority = body.priority || "normal";
  const preferredDate = body.preferred_date || "";

  if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Select a valid vehicle",
    });
  }

  if (!Number.isSafeInteger(serviceId) || serviceId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Select a valid service",
    });
  }

  if (description.length < 10 || description.length > 2000) {
    return res.status(400).json({
      success: false,
      message: "Problem description must be 10 to 2000 characters",
    });
  }

  if (!["low", "normal", "high", "urgent"].includes(priority)) {
    return res.status(400).json({
      success: false,
      message: "Select a valid priority",
    });
  }

  const date = new Date(`${preferredDate}T00:00:00Z`);
  const validDate =
    /^\d{4}-\d{2}-\d{2}$/.test(preferredDate) &&
    Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === preferredDate;

  const today = new Date(
    Date.now() + 330 * 60 * 1000
  ).toISOString().slice(0, 10);

  if (!validDate || preferredDate < today) {
    return res.status(400).json({
      success: false,
      message: "Choose a valid date today or later",
    });
  }

  try {
    // Vehicle isi client ka, active, verified aur RC valid hona chahiye.
    const [vehicles] = await db.query(
      `SELECT vehicle_id
       FROM vehicles
       WHERE vehicle_id = ?
         AND client_id = ?
         AND status = 'active'
         AND approval_status = 'verified'
         AND expiry_date >= ?
       LIMIT 1`,
      [vehicleId, req.clientId, preferredDate]
    );

    if (vehicles.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Selected vehicle is unavailable or its RC expires before service date",
      });
    }

    // Admin Service se selected service ka current active naam lo.
    const adminUrl =
      process.env.ADMIN_SERVICE_URL || "http://localhost:5002";

    const response = await fetch(
      `${adminUrl}/internal/catalog/services`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (!response.ok) {
      throw new Error("Service catalog is unavailable");
    }

    const result = await response.json();

    if (result.success !== true || !Array.isArray(result.data)) {
      throw new Error("Invalid service catalog response");
    }

    const service = result.data.find(
      item => item.service_id === serviceId
    );

    if (!service) {
      return res.status(400).json({
        success: false,
        message: "Selected service is no longer active",
      });
    }

    const [saved] = await db.query(
      `INSERT INTO vehicle_service_requests
         (client_id, vehicle_id, service_id, service_name,
          problem_description, priority, preferred_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.clientId,
        vehicleId,
        service.service_id,
        service.service_name,
        description,
        priority,
        preferredDate,
      ]
    );

    return res.status(201).json({
      success: true,
      message: "Service request submitted",
      data: {
        request_id: saved.insertId,
        status: "pending",
        service_name: service.service_name,
      },
    });
  } catch (error) {
    console.error("Create service request:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to submit service request",
    });
  }
};

const getMyServiceRequests = async (req, res) => {
  try {
    const [requests] = await db.query(
      `SELECT
         request_id,
         vehicle_id,
         service_id,
         service_name,
         problem_description,
         priority,
         preferred_date,
         status,
         assigned_partner_id,
         assigned_at,
         rejection_reason,
         created_at,
         updated_at
       FROM vehicle_service_requests
       WHERE client_id = ?
       ORDER BY request_id DESC`,
      [req.clientId]
    );

    return res.json({
      success: true,
      data: requests,
    });
  } catch (error) {
    console.error("Get service requests:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to load service requests",
    });
  }
};

module.exports = {getServiceRequestOptions,createServiceRequest,getMyServiceRequests};