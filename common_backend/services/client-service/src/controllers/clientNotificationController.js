const db = require("../model/db");

async function getMyNotifications(req, res) {
  try {
    const [notifications] = await db.query(
      `SELECT
         notification_id,
         title,
         message,
         notification_type,
         request_id,
         is_read,
         created_at
       FROM client_notifications
       WHERE client_id = ?
       ORDER BY created_at DESC, notification_id DESC
       LIMIT 50`,
      [req.clientId]
    );

    const [counts] = await db.query(
      `SELECT COUNT(*) AS unread_count
       FROM client_notifications
       WHERE client_id = ? AND is_read = 0`,
      [req.clientId]
    );

    return res.json({
      success: true,
      data: {
        notifications,
        unread_count: counts[0].unread_count,
      },
    });
  } catch (error) {
    console.error("Load client notifications:", error.message);
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
      `UPDATE client_notifications
       SET is_read = 1
       WHERE notification_id = ? AND client_id = ?`,
      [notificationId, req.clientId]
    );

    if (result.affectedRows === 0) {
      const [rows] = await db.query(
        `SELECT notification_id FROM client_notifications
         WHERE notification_id = ? AND client_id = ?
         LIMIT 1`,
        [notificationId, req.clientId]
      );

      if (rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: "Notification not found",
        });
      }
    }

    return res.json({
      success: true,
      message: "Notification marked as read",
    });
  } catch (error) {
    console.error("Mark notification read:", error.message);
    return res.status(500).json({
      success: false,
      message: "Unable to update notification",
    });
  }
}

module.exports = { getMyNotifications, markNotificationRead };