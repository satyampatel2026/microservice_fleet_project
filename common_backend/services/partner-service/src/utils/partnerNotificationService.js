const db = require("../model/db");
const messaging = require("../config/firebaseAdmin");

async function createPartnerNotification({
  partnerId,
  title,
  message,
  notificationType,
  requestId = null,
}) {
  const [saved] = await db.query(
    `INSERT INTO partner_notifications
      (partner_id, title, message, notification_type, request_id)
     VALUES (?, ?, ?, ?, ?)`,
    [partnerId, title, message, notificationType, requestId]
  );

  const notificationId = saved.insertId;

  try {
    const [rows] = await db.query(
      "SELECT fcm_token FROM partner_push_tokens WHERE partner_id = ?",
      [partnerId]
    );

    const tokens = rows.map((row) => row.fcm_token);

    if (tokens.length > 0) {
      await messaging.sendEachForMulticast({
        tokens,
        notification: { title, body: message },
        data: {
          notificationId: String(notificationId),
          type: notificationType,
          requestId: requestId ? String(requestId) : "",
        },
      });
    }
  } catch (error) {
    // Push fail ho sakti hai; notification DB mein saved rahegi.
    console.error("Send partner push notification:", error.message);
  }

  return notificationId;
}

module.exports = { createPartnerNotification };