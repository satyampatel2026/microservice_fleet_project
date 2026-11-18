const axios = require("axios");

const CLIENT_SERVICE_URL = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";

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

async function sendClientNotification(req, res) {
  const clientId = Number(req.params.clientId);
  const { title, message } = req.body || {};

  if (!Number.isSafeInteger(clientId) || clientId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid client ID",
    });
  }

  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 150 ||
    typeof message !== "string" ||
    !message.trim() ||
    message.trim().length > 1000
  ) {
    return res.status(400).json({
      success: false,
      message: "Title and message are required",
    });
  }

  try {
    const response = await axios.post(
      `${CLIENT_SERVICE_URL}/internal/clients/${clientId}/admin-notifications`,
      {
        title: title.trim(),
        message: message.trim(),
      },
      internalConfig()
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Send client notification:", error.message);

    const status = [400, 404].includes(error.response?.status)
      ? error.response.status
      : 503;

    return res.status(status).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Unable to send notification",
    });
  }
}

async function sendBroadcastNotification(req, res) {
  const { title, message } = req.body || {};

  if (
    typeof title !== "string" ||
    !title.trim() ||
    title.trim().length > 150 ||
    typeof message !== "string" ||
    !message.trim() ||
    message.trim().length > 1000
  ) {
    return res.status(400).json({
      success: false,
      message: "Title and message are required",
    });
  }

  try {
    const response = await axios.post(
      `${CLIENT_SERVICE_URL}/internal/notifications/broadcast`,
      {
        title: title.trim(),
        message: message.trim(),
      },
      internalConfig()
    );

    return res.status(response.status).json(response.data);
  } catch (error) {
    console.error("Broadcast notification:", error.message);

    return res.status(503).json({
      success: false,
      message:
        error.response?.data?.message ||
        "Unable to send broadcast notification",
    });
  }
}

module.exports = { sendClientNotification,sendBroadcastNotification};