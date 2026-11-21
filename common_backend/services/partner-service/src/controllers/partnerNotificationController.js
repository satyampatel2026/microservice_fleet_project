const db = require("../model/db");
const {createPartnerNotification,} = require("../utils/partnerNotificationService");

async function createInternalNotification(req, res) {
  const partnerId = Number(req.params.partnerId);
  const { title, message, notification_type, request_id = null } =
    req.body || {};

  if (
    !Number.isSafeInteger(partnerId) ||
    partnerId <= 0 ||
    typeof title !== "string" ||
    !title.trim() ||
    typeof message !== "string" ||
    !message.trim() ||
    typeof notification_type !== "string"
  ) {
    return res.status(400).json({
      success: false,
      message: "Valid notification details are required",
    });
  }

  try {
    await createPartnerNotification({
      partnerId,
      title: title.trim(),
      message: message.trim(),
      notificationType: notification_type,
      requestId: request_id,
    });

    return res.status(201).json({
      success: true,
      message: "Partner notification created",
    });
  } catch (error) {
    console.error("Create partner notification:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to create notification",
    });
  }
}

async function getMyNotifications(req, res) {
  try {
    const [notifications] = await db.query(
      `SELECT notification_id, title, message, notification_type,
              request_id, is_read, created_at
       FROM partner_notifications
       WHERE partner_id = ?
       ORDER BY created_at DESC, notification_id DESC
       LIMIT 50`,
      [req.partnerId]
    );

    const [counts] = await db.query(
      `SELECT COUNT(*) AS unread_count
       FROM partner_notifications
       WHERE partner_id = ? AND is_read = 0`,
      [req.partnerId]
    );

    return res.json({
      success: true,
      data: {
        notifications,
        unread_count: Number(counts[0].unread_count),
      },
    });
  } catch (error) {
    console.error("Load partner notifications:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to load notifications",
    });
  }
}

async function markNotificationRead(req, res) {
  const notificationId = Number(req.params.notificationId);

  if (!Number.isSafeInteger(notificationId) || notificationId <= 0) {
    return res.status(400).json({
      success: false,
      message: "Invalid notification ID",
    });
  }

  try {
    const [result] = await db.query(
      `UPDATE partner_notifications
       SET is_read = 1
       WHERE notification_id = ? AND partner_id = ?`,
      [notificationId, req.partnerId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Mark partner notification read:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
}

async function savePushToken(req, res) {
  const token = req.body?.fcm_token;

  if (typeof token !== "string" || token.length < 20 || token.length > 512) {
    return res.status(400).json({
      success: false,
      message: "Valid Firebase token is required",
    });
  }

  try {
    await db.query(
      `INSERT INTO partner_push_tokens (partner_id, fcm_token)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE partner_id = VALUES(partner_id)`,
      [req.partnerId, token]
    );

    return res.status(201).json({ success: true });
  } catch (error) {
    console.error("Save partner push token:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to save push token",
    });
  }
}

module.exports = {createInternalNotification,getMyNotifications, markNotificationRead,savePushToken,};