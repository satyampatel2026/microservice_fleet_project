const db = require("../model/db");

async function saveMyPushToken(req, res) {
  const token =
    typeof req.body?.fcm_token === "string"
      ? req.body.fcm_token.trim()
      : "";

  if (!token || token.length > 512) {
    return res.status(400).json({
      success: false,
      message: "Valid notification token is required",
    });
  }

  try {
    await db.query(
      `INSERT INTO client_push_tokens (client_id, fcm_token)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE client_id = VALUES(client_id)`,
      [req.clientId, token]
    );

    return res.json({
      success: true,
      message: "Notification token saved",
    });
  } catch (error) {
    console.error("Save push token:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to save notification token",
    });
  }
}

module.exports = { saveMyPushToken };