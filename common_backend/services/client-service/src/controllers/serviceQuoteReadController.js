const db = require("../model/db");
const { getQuotePreview } = require("./serviceQuotePricing");

async function getClientServiceQuote(req, res) {
  const requestId = Number(req.params.requestId);

  if (!Number.isSafeInteger(requestId) || requestId <= 0) {
    return res.status(400).json({ message: "Invalid request ID" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT
         r.request_id,
         q.id AS quote_id,
         q.service_amount,
         q.work_details,
         q.accepted_platform_fee,
         q.accepted_subtotal,
         q.status AS quote_status
       FROM vehicle_service_requests r
       LEFT JOIN service_quotes q
         ON q.request_id = r.request_id
         AND q.partner_id = r.assigned_partner_id
         AND q.status IN ('pending', 'accepted')
         AND r.status = 'assigned'
       WHERE r.request_id = ?
         AND r.client_id = ?
       ORDER BY q.id DESC
       LIMIT 1`,
      [requestId, req.clientId]
    );

    const row = rows[0];

    if (!row) {
      return res.status(404).json({ message: "Service request not found" });
    }

    const quote = row.quote_id == null
      ? null : {
          id: row.quote_id,
          serviceAmount: row.service_amount,
          workDetails: row.work_details,
          status: row.quote_status,
        };

    if (!quote) {return res.json({ success: true, quote: null, preview: null });}
    if (quote.status === "accepted") {
    return res.json({
    success: true,
    quote: {
      id: quote.id,
      workDetails: quote.workDetails,
      status: quote.status,
    },
    preview: {
      serviceAmount: Number(quote.serviceAmount),
      platformFee: Number(row.accepted_platform_fee),
      subtotal: Number(row.accepted_subtotal),
    },
  });
}

try {
  const preview = await getQuotePreview(quote.serviceAmount);
  return res.json({ success: true, quote:{id: quote.id,workDetails: quote.workDetails,status: quote.status,}, preview });
} catch (error) {
  console.error("Load quote preview:", error.message);
  return res.status(503).json({ message: "Price preview is temporarily unavailable" });
}
  } catch (error) {
    console.error("Load client quote:", error.message);
    return res.status(500).json({ message: "Unable to load quote" });
  }
}

async function getAcceptedQuoteForPayment(req, res) {
  const quoteId = Number(req.params.quoteId);
  const clientId = Number(req.params.clientId);

  if (
    !Number.isSafeInteger(quoteId) || quoteId <= 0 ||
    !Number.isSafeInteger(clientId) || clientId <= 0
  ) {
    return res.status(400).json({ message: "Invalid quote or client ID" });
  }

  try {
    const [rows] = await db.execute(
      `SELECT
         q.id AS quote_id,
         r.request_id,
         r.request_code,
         r.client_id,
         q.partner_id,
         q.accepted_subtotal
       FROM service_quotes q
       JOIN vehicle_service_requests r ON r.request_id = q.request_id
       WHERE q.id = ?
         AND r.client_id = ?
         AND q.status = 'accepted'
         AND (
           ? = 1 OR (
             q.partner_id = r.assigned_partner_id
             AND (r.status = 'assigned' OR (? = 1 AND r.status IN ('in_progress', 'completed')))
           )
         )
       LIMIT 1`,
      [quoteId, clientId, req.query.receipt === "1" ? 1 : 0, req.query.dropOff === "1" ? 1 : 0]
    );

    const quote = rows[0];

    if (!quote) {
      return res.status(404).json({
        message: "Accepted quote is not available for payment",
      });
    }

    const amountPaise = Math.round(Number(quote.accepted_subtotal) * 100);

    if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
      return res.status(409).json({ message: "Quote has no valid approved amount" });
    }

    return res.json({
      quoteId: quote.quote_id,
      requestId: quote.request_id,
      requestCode: quote.request_code,
      clientId: quote.client_id,
      partnerId: quote.partner_id,
      amountPaise,
      currency: "INR",
    });
  } catch (error) {
    console.error("Load quote for payment:", error.message);
    return res.status(500).json({ message: "Unable to load quote for payment" });
  }
}

module.exports={getClientServiceQuote,getAcceptedQuoteForPayment};