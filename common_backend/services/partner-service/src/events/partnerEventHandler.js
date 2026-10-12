const crypto = require("crypto");
const db = require("../model/db");

const handlePartnerEvent = async (event) => {
  if (
    !event ||
    typeof event.eventId !== "string" ||
    !crypto.randomUUID ||
    typeof event.eventType !== "string"
  ) {
    throw new Error("Invalid Kafka event");
  }

  // Filhaal sirf registered event handle hoga
  if (event.eventType !== "PartnerRegistered") {
    console.log("Ignoring unsupported event:", event.eventType);
    return;
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT event_id
       FROM processed_events
       WHERE event_id = ?
       LIMIT 1`,
      [event.eventId]
    );

    if (existing.length > 0) {
      await connection.rollback();
      console.log("Duplicate Kafka event skipped:", event.eventId);
      return;
    }

    // Registration profile pehle REST se create ho chuki hogi.
    // Kafka event sirf uski confirmation process karega.
    if (!Number.isSafeInteger(event.partnerId) || event.partnerId <= 0) {
      throw new Error("Invalid partner ID");
    }

    const [partners] = await connection.query(
      `SELECT partner_id, status
       FROM partners
       WHERE partner_id = ?
       LIMIT 1`,
      [event.partnerId]
    );

    if (partners.length === 0 || partners[0].status !== "active") {
      throw new Error("Partner profile not active or not found");
    }

    await connection.query(
      `INSERT INTO processed_events (event_id, event_type)
       VALUES (?, ?)`,
      [event.eventId, event.eventType]
    );

    await connection.commit();

    console.log("PartnerRegistered event processed:", event.partnerId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { handlePartnerEvent };