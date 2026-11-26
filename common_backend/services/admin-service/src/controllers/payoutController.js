async function recordTransfer(req, res) {
  const quoteId = Number(req.params.quoteId);

  if (!Number.isSafeInteger(quoteId) || quoteId < 1) {
    return res.status(400).json({ message: "Invalid quote ID" });
  }

  const paymentUrl = process.env.PAYMENT_SERVICE_URL || "http://localhost:5006";
  const key = process.env.INTERNAL_SERVICE_KEY;

  if (!key) {
    return res.status(503).json({ message: "Finance service is not configured" });
  }

  try {
    const response = await fetch(
      `${paymentUrl}/internal/partner-payouts/${quoteId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-service-key": key,
        },
        body: JSON.stringify({
          transferReference: req.body?.transferReference,
          transferredAt: req.body?.transferredAt,
          recordedBy: Number(req.userId),
        }),
        signal: AbortSignal.timeout(10000),
      }
    );

    const result = await response.json();
    return res.status(response.status).json(result);
  } catch (error) {
    console.error("Record transfer:", error.message);
    return res.status(503).json({
      message: "Transfer entry could not be confirmed. Retry with the same details.",
    });
  }
}

async function listPayouts(req, res) {
  try {
    const base = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
    const response = await fetch(base + "/internal/finance/payouts", {
      headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error("Payout lookup failed");
    res.set("Cache-Control", "private, no-store");
    return res.json(await response.json());
  } catch (error) {
    return res.status(503).json({ message: "Unable to load partner payouts" });
  }
}
module.exports = { recordTransfer, listPayouts };
