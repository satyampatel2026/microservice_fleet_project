const crypto = require("crypto");
const authDb = require("../model/authDb");

const activatePartnerWithEvent = async (partnerId, email) => {
  const connection = await authDb.getConnection();

  try {
    await connection.beginTransaction();

    const [accounts] = await connection.query(
      `SELECT auth_id, status
       FROM partner_accounts
       WHERE partner_id = ? AND email = ?
       FOR UPDATE`,
      [partnerId, email]
    );

    if (accounts.length !== 1) {
      throw new Error("Partner auth account not found");
    }

    const account = accounts[0];

    if (account.status === "inactive") {
      await connection.query(
        `UPDATE partner_accounts
         SET status = 'active'
         WHERE auth_id = ?`,
        [account.auth_id]
      );

      const eventId = crypto.randomUUID();

      await connection.query(
        `INSERT INTO outbox_events
         (event_id, topic, event_key, event_type, payload)
         VALUES (?, ?, ?, ?, ?)`,
        [
          eventId,
          "fleet.partner.events",
          String(partnerId),
          "PartnerRegistered",
          JSON.stringify({
            partnerId,
            email,
            occurredAt: new Date().toISOString(),
          }),
        ]
      );
    }

    await connection.commit();

    return {
      success: true,
      partnerId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

module.exports = { activatePartnerWithEvent };