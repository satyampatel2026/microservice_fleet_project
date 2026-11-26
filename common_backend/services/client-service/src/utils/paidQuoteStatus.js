async function getPaidQuotes(quoteIds, includeDetails = false) {
  const ids = [...new Set(quoteIds.filter((id) => id != null).map(Number))];
  const paid = new Map();
  const paymentUrl = process.env.PAYMENT_SERVICE_URL || "http://localhost:5006";

  for (let start = 0; start < ids.length; start += 200) {
    const response = await fetch(paymentUrl + "/internal/payments/paid-quotes", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
      },
      body: JSON.stringify({ quoteIds: ids.slice(start, start + 200) }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) throw new Error("Payment service returned " + response.status);

    const { paidQuotes } = await response.json();
    for (const quote of paidQuotes) paid.set(Number(quote.quoteId), includeDetails ? quote : quote.orderId);
  }

  return paid;
}

module.exports = { getPaidQuotes };

