const db = require("../model/db");

async function getPayoutQuote(req, res) {
  const quoteId = Number(req.params.quoteId);

  if (!Number.isSafeInteger(quoteId) || quoteId < 1) {
    return res.status(400).json({ message: "Invalid quote ID" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT
         q.id AS quoteId,
         q.partner_id AS partnerId,
         q.service_amount AS partnerAmount,
         r.request_code AS requestCode
       FROM service_quotes q
       JOIN vehicle_service_requests r ON r.request_id = q.request_id
       WHERE q.id = ?
         AND q.status = 'accepted'
         AND r.status = 'completed'
         AND r.assigned_partner_id = q.partner_id`,
      [quoteId]
    );

    const quote = rows[0];

    if (!quote) {
      return res.status(404).json({
        message: "No completed job with this accepted partner quote",
      });
    }

    const amountPaise = Math.round(Number(quote.partnerAmount) * 100);

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return res.status(409).json({ message: "Invalid partner amount" });
    }

    return res.json({
      quoteId: quote.quoteId,
      partnerId: quote.partnerId,
      requestCode: quote.requestCode,
      amountPaise,
    });
  } catch (error) {
    console.error("Load partner payout quote:", error.message);
    return res.status(500).json({ message: "Unable to load payout quote" });
  }
}

const { getPaidQuotes } = require("../utils/paidQuoteStatus");

async function listPayouts(req, res) {
  try {
    const [quotes] = await db.query(
      `SELECT q.id AS quoteId, q.partner_id AS partnerId, q.service_amount AS amount,
              r.request_code AS job, r.service_name AS service, v.vehicle_number AS vehicle
       FROM service_quotes q
       JOIN vehicle_service_requests r ON r.request_id = q.request_id AND r.assigned_partner_id = q.partner_id
       LEFT JOIN vehicles v ON v.vehicle_id = r.vehicle_id
       WHERE q.status = 'accepted' AND r.status = 'completed'
       ORDER BY r.request_id DESC`
    );
    const payments = await getPaidQuotes(quotes.map(q => q.quoteId), true);
    const rows = [];
    for (const quote of quotes) {
      const payment = payments.get(Number(quote.quoteId));
      if (payment) rows.push({ ...quote, reference: payment.reference, transferredAt: payment.transferredAt });
    }
    res.set("Cache-Control", "private, no-store");
    return res.json({ data: rows });
  } catch (error) {
    console.error("List payouts:", error.message);
    return res.status(503).json({ message: "Unable to verify payouts" });
  }
}
module.exports = { getPayoutQuote, listPayouts };
