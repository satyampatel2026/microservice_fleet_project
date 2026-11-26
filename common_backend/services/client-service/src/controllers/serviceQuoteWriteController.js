const db=require("../model/db");
const { getQuotePreview } = require("./serviceQuotePricing");

async function createServiceQuote(req, res) {
  const requestId = Number(req.params.requestId);
  const partnerId = Number(req.params.partnerId);
  const amount = req.body?.serviceAmount;
  const details = req.body?.workDetails;

  if (
    !Number.isSafeInteger(requestId) ||
    requestId <= 0 ||
    !Number.isSafeInteger(partnerId) ||
    partnerId <= 0
  ) {
    return res.status(400).json({ message: "Invalid request or partner ID" });
  }

  if (
    typeof amount !== "number" ||
    !/^\d{1,8}(\.\d{1,2})?$/.test(String(amount)) ||
    amount <= 0 ||
    typeof details !== "string" ||
    !details.trim() ||
    details.trim().length > 1000
  ) {
    return res.status(400).json({ message: "Enter a valid amount and work details" });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [requests] = await connection.execute(
      `SELECT request_id
       FROM vehicle_service_requests
       WHERE request_id = ? AND assigned_partner_id = ? AND status = 'assigned'
       FOR UPDATE`,
      [requestId, partnerId]
    );

    if (!requests.length) {
      await connection.rollback();
      return res.status(409).json({
        message: "You can only quote a job currently assigned to you",
      });
    }

    const [quotes] = await connection.execute(
      `SELECT id FROM service_quotes
       WHERE request_id = ? AND partner_id = ?
         AND status IN ('pending', 'accepted')
       LIMIT 1`,
      [requestId, partnerId]
    );

    if (quotes.length) {
      await connection.rollback();
      return res.status(409).json({ message: "This job already has an active quote" });
    }

    const [result] = await connection.execute(
      `INSERT INTO service_quotes
         (request_id, partner_id, service_amount, work_details)
       VALUES (?, ?, ?, ?)`,
      [requestId, partnerId, amount, details.trim()]
    );

    await connection.commit();

    return res.status(201).json({
      success: true,
      data: { quoteId: result.insertId, status: "pending" },
    });
  } catch (error) {
    if (connection) {
      await connection.rollback().catch(() => {});
    }

    console.error("Create service quote:", error.message);
    return res.status(500).json({ message: "Unable to save quote" });
  } finally {
    connection?.release();
  }
}

async function decideClientServiceQuote(req, res) {
  const requestId = Number(req.params.requestId);
  const quoteId = Number(req.params.quoteId);
  const { decision, shownSubtotal } = req.body || {};

  if (
    !Number.isSafeInteger(requestId) || requestId <= 0 ||
    !Number.isSafeInteger(quoteId) || quoteId <= 0 ||
    !["accept", "decline"].includes(decision)
  ) {
    return res.status(400).json({ message: "Invalid quote decision" });
  }

  if (
    decision === "accept" &&
    (typeof shownSubtotal !== "number" ||
      !Number.isFinite(shownSubtotal) ||
      shownSubtotal <= 0)
  ) {
    return res.status(400).json({ message: "Send the subtotal shown to the client" });
  }

  let connection;

  try {
    connection = await db.getConnection();
    await connection.beginTransaction();

    const [requests] = await connection.execute(
      `SELECT status, assigned_partner_id
       FROM vehicle_service_requests
       WHERE request_id = ? AND client_id = ?
       FOR UPDATE`,
      [requestId, req.clientId]
    );

    const request = requests[0];

    if (!request) {
      await connection.rollback();
      return res.status(404).json({ message: "Service request not found" });
    }

    const [quotes] = await connection.execute(
      `SELECT service_amount
       FROM service_quotes
       WHERE id = ? AND request_id = ? AND partner_id = ?
         AND status = 'pending'
       FOR UPDATE`,
      [quoteId, requestId, request.assigned_partner_id]
    );

    if (request.status !== "assigned" || !quotes.length) {
      await connection.rollback();
      return res.status(409).json({ message: "This quote is no longer available" });
    }

    if (decision === "decline") {
      await connection.execute(
        "UPDATE service_quotes SET status = 'declined' WHERE id = ?",
        [quoteId]
      );

      await connection.execute(
        `UPDATE vehicle_service_requests
         SET status = 'pending',
             assigned_partner_id = NULL,
             assigned_by = NULL,
             assigned_at = NULL
         WHERE request_id = ?`,
        [requestId]
      );

      await connection.commit();
      return res.json({ success: true, quoteStatus: "declined" });
    }

    let preview;

    try {
      preview = await getQuotePreview(quotes[0].service_amount);
    } catch (error) {
      await connection.rollback();
      console.error("Confirm quote price:", error.message);
      return res.status(503).json({ message: "Price is temporarily unavailable" });
    }

    if (preview.subtotal !== shownSubtotal) {
      await connection.rollback();
      return res.status(409).json({
        message: "The price changed. Open the quote again before accepting.",
      });
    }

    await connection.execute(
      `UPDATE service_quotes
       SET status = 'accepted',
           accepted_platform_fee = ?,
           accepted_subtotal = ?
       WHERE id = ?`,
      [preview.platformFee, preview.subtotal, quoteId]
    );

    await connection.commit();

    return res.json({
      success: true,
      quoteStatus: "accepted",
      subtotal: preview.subtotal,
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error("Save quote decision:", error.message);
    return res.status(500).json({ message: "Unable to save quote decision" });
  } finally {
    connection?.release();
  }
}

module.exports={createServiceQuote,decideClientServiceQuote};