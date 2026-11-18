const axios = require("axios");

const CLIENT_SERVICE_URL =process.env.CLIENT_SERVICE_URL || "http://localhost:5004";

const getMyAssignedJobs = async (req, res) => {
  const partnerId = Number(req.partnerId);
  const key = process.env.INTERNAL_SERVICE_KEY;

  if (!Number.isSafeInteger(partnerId) || partnerId <= 0) {
    return res.status(401).json({
      success: false,
      message: "Partner login is required",
    });
  }

  if (!key) {
    console.error("INTERNAL_SERVICE_KEY is missing");
    return res.status(500).json({
      success: false,
      message: "Partner service is not configured",
    });
  }

  try {
    const response = await axios.get(
      `${CLIENT_SERVICE_URL}/internal/partners/${partnerId}/service-requests`,
      {
        headers: {
          "x-internal-service-key": key,
        },
        timeout: 5000,
      }
    );

    if (
      response.data?.success !== true ||
      !Array.isArray(response.data.data)
    ) {
      throw new Error("Invalid Client Service response");
    }

    return res.json(response.data);
  } catch (error) {
    console.error("Load partner jobs:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to load your jobs",
    });
  }
};

const updateMyJobStatus = async (req, res) => {
  const requestId = Number(req.params.requestId);
  const partnerId = Number(req.partnerId);
  const status = req.body?.status;
  const key = process.env.INTERNAL_SERVICE_KEY;

  if (
    !Number.isSafeInteger(requestId) || requestId <= 0 ||
    !Number.isSafeInteger(partnerId) || partnerId <= 0 ||
    !["in_progress", "completed"].includes(status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid job status update",
    });
  }

  try {
    const response = await axios.patch(
      `${CLIENT_SERVICE_URL}/internal/partners/${partnerId}/service-requests/${requestId}/status`,
      { status },
      {
        headers: { "x-internal-service-key": key },
        timeout: 5000,
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    const statusCode = [400, 404, 409].includes(error.response?.status)
      ? error.response.status
      : 503;

    return res.status(statusCode).json({
      success: false,
      message: error.response?.data?.message || "Unable to update job",
    });
  }
};

const declineMyJob = async (req, res) => {
  const partnerId = Number(req.partnerId);
  const requestId = Number(req.params.requestId);
  const reason = String(req.body?.reason || "").trim();
  const key = process.env.INTERNAL_SERVICE_KEY;

  if (
    !Number.isSafeInteger(partnerId) || partnerId <= 0 ||
    !Number.isSafeInteger(requestId) || requestId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Invalid partner or request ID",
    });
  }

  if (!reason || reason.length > 500) {
    return res.status(400).json({
      success: false,
      message: "A decline reason is required",
    });
  }

  try {
    const response = await axios.patch(
      `${CLIENT_SERVICE_URL}/internal/partners/${partnerId}/service-requests/${requestId}/decline`,
      { reason },
      {
        headers: { "x-internal-service-key": key },
        timeout: 5000,
      }
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    const statusCode = [400, 404, 409].includes(error.response?.status)
      ? error.response.status
      : 503;

    return res.status(statusCode).json({
      success: false,
      message: error.response?.data?.message || "Unable to decline this job",
    });
  }
};

module.exports = { getMyAssignedJobs,updateMyJobStatus,declineMyJob};