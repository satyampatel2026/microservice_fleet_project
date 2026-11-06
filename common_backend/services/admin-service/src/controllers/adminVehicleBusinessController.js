const axios = require("axios");
const CLIENT_SERVICE_URL = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";

// Client Service ka error frontend ko samajhne layak response mein bhejo.
function sendError(res, error) {
  return res.status(error.response?.status || 503).json({
    success: false,
    message: error.response?.data?.message || "Client Service is unavailable",
  });
}

// 1. Admin ko vehicles ki list dena.
const getVehicles = async (req, res) => {
  try {
    const response = await axios.get(`${CLIENT_SERVICE_URL}/internal/verification/vehicles`, {
      params: { search: req.query.search || "", status: req.query.status || "pending", page: req.query.page || 1, clientId: req.query.clientId || "" },
      headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
      timeout: 8000,
    });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(response.data);
  } catch (error) { return sendError(res, error); }
};

// 2. Vehicle Verify / Reject decision Client Service tak bhejna.
const reviewVehicle = async (req, res) => {
  const vehicleId = Number(req.params.id);
  if (!Number.isSafeInteger(vehicleId) || vehicleId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid vehicle ID" });
  }
  try {
    const response = await axios.patch(`${CLIENT_SERVICE_URL}/internal/verification/vehicles/${vehicleId}`, {
      status: req.body?.status,
      reason: req.body?.reason,
      adminId: req.userId, // Login middleware ki verified ID, frontend ki ID nahi.
    }, {
      headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
      timeout: 8000,
    });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(response.data);
  } catch (error) { return sendError(res, error); }
};

// 4. Admin ko clients ki company/business list dena.
const getBusinesses = async (req, res) => {
  try {
    const response = await axios.get(`${CLIENT_SERVICE_URL}/internal/verification/businesses`, {
      params: { search: req.query.search || "", status: req.query.status || "pending", page: req.query.page || 1 },
      headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
      timeout: 8000,
    });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(response.data);
  } catch (error) { return sendError(res, error); }
};

// 5. Client business Verify / Reject decision bhejna.
const reviewBusiness = async (req, res) => {
  const clientId = Number(req.params.id);
  if (!Number.isSafeInteger(clientId) || clientId <= 0) {
    return res.status(400).json({ success: false, message: "Invalid client ID" });
  }
  try {
    const response = await axios.patch(`${CLIENT_SERVICE_URL}/internal/verification/businesses/${clientId}`, {
      status: req.body?.status,
      reason: req.body?.reason,
      adminId: req.userId,
    }, {
      headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
      timeout: 8000,
    });
    res.setHeader("Cache-Control", "private, no-store");
    return res.status(200).json(response.data);
  } catch (error) { return sendError(res, error); }
};
module.exports = { getVehicles, reviewVehicle, getBusinesses, reviewBusiness };
