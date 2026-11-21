const axios = require("axios");

const CLIENT_URL =
  process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
const PARTNER_URL =
  process.env.PARTNER_SERVICE_URL || "http://localhost:5003";

// Internal requests ke liye shared secret bhejo.
function internalConfig() {
  const key = process.env.INTERNAL_SERVICE_KEY;

  if (!key) {
    throw new Error("INTERNAL_SERVICE_KEY is missing");
  }

  return {
    headers: { "x-internal-service-key": key },
    timeout: 5000,
  };
}

// Admin screen ke liye pending requests lao.
async function getPendingServiceRequests(req, res) {
  try {
    const response = await axios.get(
      `${CLIENT_URL}/internal/service-requests`,
      {
        ...internalConfig(),
        params: {
          status: req.query.status || "all",
          search: req.query.search || "",
          page: req.query.page || 1,
          limit: req.query.limit || 10,
        },
      }
    );

    return res.json(response.data);
  } catch (error) {
    console.error("Load service requests:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to load service requests",
    });
  }
}

// Ek pending request ko eligible partner ko assign karo.
async function assignServiceRequest(req, res) {
  const requestId = Number(req.params.requestId);
  const partnerId = Number(req.body?.partner_id);

  if (
    !Number.isSafeInteger(requestId) ||
    requestId <= 0 ||
    !Number.isSafeInteger(partnerId) ||
    partnerId <= 0
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid request ID and partner ID are required",
    });
  }

  try {
    const config = internalConfig();

    // Is ID wali ek request ki details Client Service se lo.
    const requestResponse = await axios.get(
      `${CLIENT_URL}/internal/service-requests/${requestId}`,
      config
    );

    const serviceRequest = requestResponse.data?.data;

    if (!serviceRequest) {
      return res.status(404).json({
        success: false,
        message: "Service request not found",
      });
    }

    if (!["pending", "assigned", "in_progress"].includes(serviceRequest.status)) {
     return res.status(409).json({
    success: false,
    message: "Only active requests can be assigned or reassigned",
    });
    }

    // Check karo ki partner is request wali service ke liye eligible hai.
    const eligibilityResponse = await axios.get(
      `${PARTNER_URL}/internal/partners/${partnerId}/services/${serviceRequest.service_id}/eligibility`,
      config
    );

    if (eligibilityResponse.data?.data?.eligible !== true) {
      return res.status(409).json({
        success: false,
        message: "Partner is not eligible for this service",
      });
    }

    // Eligible partner ko request assign karo.
    const assignResponse = await axios.patch(
      `${CLIENT_URL}/internal/service-requests/${requestId}/assign`,
      { partner_id: partnerId },
      config
    );
    if (assignResponse.data?.success === true) {
  try {
    await axios.post(
      `${PARTNER_URL}/internal/partners/${partnerId}/notifications`,
      {
        title: "New service assigned",
        message: `You have been assigned service request #${requestId}.`,
        notification_type: "job_assigned",
        request_id: requestId,
      },
      config
    );
  } catch (notificationError) {
    // Assignment successful rahega; push/notification failure alag log hogi.
    console.error(
      "Partner assignment notification:",
      notificationError.message
    );
  }
}
    return res.status(assignResponse.status).json(assignResponse.data);
  } catch (error) {
    console.error("Assign service request:", error.message);

    const status = [400, 404, 409].includes(error.response?.status)
      ? error.response.status
      : 503;

    return res.status(status).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Unable to assign service request",
    });
  }
}

async function cancelServiceRequest(req, res) {
  const requestId = Number(req.params.requestId);
  const reason = String(req.body?.cancellation_reason || "").trim();

  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid service request ID",
    });
  }

  if (!reason || reason.length > 500) {
    return res.status(400).json({
      success: false,
      message: "Cancellation reason is required and must be under 500 characters",
    });
  }

  try {
    const response = await axios.patch(
      `${CLIENT_URL}/internal/service-requests/${requestId}/cancel`,
      { cancellation_reason: reason },
      internalConfig()
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Cancel service request:", error.message);

    const status = [400, 404, 409].includes(error.response?.status)
      ? error.response.status
      : 503;

    return res.status(status).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Unable to cancel service request",
    });
  }
}

module.exports = { getPendingServiceRequests, assignServiceRequest,cancelServiceRequest};