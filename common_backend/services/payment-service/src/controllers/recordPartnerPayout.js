const db = require("../model/db");

async function recordPartnerPayout(req, res) {
  const quoteId = Number(req.params.quoteId);
  const { transferReference, transferredAt, recordedBy } = req.body || {};
  if (!Number.isSafeInteger(quoteId) || quoteId < 1 ||
      !Number.isSafeInteger(recordedBy) || recordedBy < 1 ||
      typeof transferReference !== "string" || !transferReference.trim() ||
      transferReference.trim().length > 100) {
    return res.status(400).json({ message: "Invalid quote, admin or transfer reference" });
  }

  // Frontend sends a UTC timestamp using Date.toISOString().
  const date = new Date(transferredAt);
  if (typeof transferredAt !== "string" || !Number.isFinite(date.getTime()) ||
      date.toISOString() !== transferredAt || date.getTime() > Date.now()) {
    return res.status(400).json({ message: "Enter a valid transfer date and time" });
  }
  const utcTime = date.toISOString().slice(0, 19).replace("T", " ");
  const reference = transferReference.trim();

  async function readExisting() {
    const [rows] = await db.execute(
      `SELECT payout_id, transfer_reference, DATE_FORMAT(transferred_at, '%Y-%m-%d %H:%i:%s') AS utcTime
       FROM partner_payouts WHERE quote_id = ?`, [quoteId]
    );
    return rows[0];
  }

  function existingResponse(row) {
    if (row.transfer_reference === reference && row.utcTime === utcTime) {
      return res.json({ success: true, payoutId: row.payout_id, status: "transferred" });
    }
    return res.status(409).json({ message: "A different transfer is already recorded for this quote" });
  }

  try {
    const existing = await readExisting();
    if (existing) return existingResponse(existing);
    const key = process.env.INTERNAL_SERVICE_KEY;
    if (!key) throw new Error("Missing internal key");
    const base = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
    const response = await fetch(base + "/internal/payout-quotes/" + quoteId, {
      headers: { "x-internal-service-key": key }, signal: AbortSignal.timeout(5000),
    });
    if (response.status === 404) return res.status(409).json({ message: "An accepted quote and completed job are required" });
    if (!response.ok) throw new Error("Could not verify payout quote");
    const quote = await response.json();
    if (Number(quote.quoteId) !== quoteId || !Number.isSafeInteger(quote.amountPaise) || quote.amountPaise <= 0 ||
        !Number.isSafeInteger(Number(quote.partnerId)) || Number(quote.partnerId) < 1) throw new Error("Invalid payout quote");

    try {
      const [result] = await db.execute(
        `INSERT INTO partner_payouts
           (quote_id, partner_id, amount_paise, transfer_reference, transferred_at, recorded_by)
         SELECT quote_id, ?, ?, ?, ?, ? FROM service_payments
         WHERE quote_id = ? AND razorpay_payment_id IS NOT NULL LIMIT 1`,
        [quote.partnerId, quote.amountPaise, reference, utcTime, recordedBy, quoteId]
      );
      if (!result.affectedRows) return res.status(409).json({ message: "Verified customer payment required" });
      return res.status(201).json({ success: true, payoutId: result.insertId, status: "transferred" });
    } catch (error) {
      if (error.code !== "ER_DUP_ENTRY") throw error;
      const saved = await readExisting();
      if (!saved) throw error;
      return existingResponse(saved);
    }
  } catch (error) {
    console.error("Record partner payout:", error.message);
    return res.status(503).json({ message: "Unable to confirm transfer entry. Retry with the same details." });
  }
}

module.exports = { recordPartnerPayout };
