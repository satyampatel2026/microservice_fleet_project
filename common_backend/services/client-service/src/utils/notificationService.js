const db = require("../model/db");
const messaging = require("../config/firebaseAdmin");

async function createClientNotification({clientId,title,message,notificationType,requestId = null,}) {
  const [saved] = await db.query(
    `INSERT INTO client_notifications
       (client_id, title, message, notification_type, request_id)
     VALUES (?, ?, ?, ?, ?)`,
    [clientId, title, message, notificationType, requestId]
  );

  const notificationId = saved.insertId;

  try {
    const [tokenRows] = await db.query(
      `SELECT fcm_token
       FROM client_push_tokens
       WHERE client_id = ?`,
      [clientId]
    );

    const tokens = tokenRows.map((row) => row.fcm_token);

    // Token abhi register na ho to notification MySQL me phir bhi saved rahegi.
    if (tokens.length > 0) {
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title,
          body: message,
        },
        data: {
          notificationId: String(notificationId),
          type: notificationType,
          requestId: requestId ? String(requestId) : "",
        },
        webpush: {
          headers: {
            TTL: "2419200",
          },
        },
      });
    }
  } catch (error) {
    // Push fail ho tab bhi MySQL me saved notification client ko baad me dikhegi.
    console.error("Send client push notification:", error.message);
  }

  return notificationId;
}

async function createBroadcastNotification({ title, message }) {
  const [clients] = await db.query(
    "SELECT client_id FROM clients"
  );

  let savedCount = 0;
  let failedCount = 0;
  const batchSize = 20;

  // 20 clients ka batch process karke database par load limit rakho.
  for (let i = 0; i < clients.length; i += batchSize) {
    const batch = clients.slice(i, i + batchSize);

    const results = await Promise.allSettled(
      batch.map((client) =>
        createClientNotification({
          clientId: client.client_id,
          title,
          message,
          notificationType: "admin_broadcast",
        })
      )
    );

    for (const result of results) {
      if (result.status === "fulfilled") {
        savedCount++;
      } else {
        failedCount++;
        console.error(
          "Save broadcast notification:",
          result.reason?.message
        );
      }
    }
  }

  return {
    totalClients: clients.length,
    savedCount,
    failedCount,
  };
}
module.exports = { createClientNotification,createBroadcastNotification };