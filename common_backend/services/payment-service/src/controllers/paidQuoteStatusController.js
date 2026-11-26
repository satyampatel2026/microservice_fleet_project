const db = require("../model/db");

async function getPaidQuoteStatuses(req, res) {
  const { quoteIds } = req.body || {};

  if (!Array.isArray(quoteIds) || quoteIds.length > 200 ||
      !quoteIds.every((id) => Number.isSafeInteger(id) && id > 0)) {
    return res.status(400).json({ message: "Invalid quote IDs" });
  }

  if (quoteIds.length === 0) return res.json({ paidQuotes: [] });

  try {
    const [paidQuotes] = await db.query( `SELECT s.quote_id AS quoteId, s.razorpay_order_id AS orderId,
           p.transfer_reference AS reference, p.amount_paise AS transferredPaise,
           DATE_FORMAT(p.transferred_at, '%Y-%m-%dT%H:%i:%sZ') AS transferredAt
    FROM service_payments s LEFT JOIN partner_payouts p ON p.quote_id = s.quote_id
           WHERE s.quote_id IN (?) AND s.razorpay_payment_id IS NOT NULL`, [quoteIds]
    );
    return res.json({ paidQuotes });
  } catch (error) {
    console.error("Read paid quotes:", error.message);
    return res.status(503).json({ message: "Payment status unavailable" });
  }
}

module.exports = { getPaidQuoteStatuses };

