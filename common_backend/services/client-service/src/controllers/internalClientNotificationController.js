const {createClientNotification: saveNotification,createBroadcastNotification:saveBroadcastNotification,} = require("../utils/notificationService");

const createWelcomeNotificationForClient = async (req, res) => {
  const clientId = Number(req.params.clientId);
  const { title, message, notification_type } = req.body || {};

  if (!Number.isSafeInteger(clientId) || clientId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid client ID",
    });
  }

  if (
    typeof title !== "string" ||
    !title.trim() ||
    typeof message !== "string" ||
    !message.trim() ||
    notification_type !== "welcome"
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid welcome notification details are required",
    });
  }

  try {
    await saveNotification({
      clientId,
      title: title.trim(),
      message: message.trim(),
      notificationType: "welcome",
    });

    return res.status(201).json({
      success: true,
      message: "Welcome notification created",
    });
  } catch (error) {
    console.error("Create welcome notification:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to create welcome notification",
    });
  }
};

const sendAdminNotificationToClient = async (req, res) => {
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
    await saveNotification({
      clientId,
      title: title.trim(),
      message: message.trim(),
      notificationType: "admin_message",
    });

    return res.status(201).json({
      success: true,
      message: "Notification sent to client",
    });
  } catch (error) {
    console.error("Admin notification:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send notification",
    });
  }
};

const createBroadcastNotificationForAllClients = async (req, res) => {
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
    const result = await saveBroadcastNotification({
      title: title.trim(),
      message: message.trim(),
    });

    return res.status(201).json({
      success: true,
      message: "Broadcast notification processed",
      data: result,
    });
  } catch (error) {
    console.error("Broadcast notification:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to send broadcast notification",
    });
  }
};

module.exports = { createWelcomeNotificationForClient,sendAdminNotificationToClient,createBroadcastNotificationForAllClients };