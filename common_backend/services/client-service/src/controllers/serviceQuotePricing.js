async function getQuotePreview(serviceAmount) {
  const adminUrl = process.env.ADMIN_SERVICE_URL || "http://localhost:5002";

  const response = await fetch(`${adminUrl}/internal/finance/commission`, {
    headers: {
      "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
    },
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`Admin finance returned ${response.status}`);
  }

  const { commissionPercent } = await response.json();

  if (
    typeof commissionPercent !== "number" ||
    !Number.isFinite(commissionPercent) ||
    commissionPercent < 0 ||
    commissionPercent > 100
  ) {
    throw new Error("Invalid commission setting");
  }

  const servicePaise = Math.round(Number(serviceAmount) * 100);
  const commissionBps = Math.round(commissionPercent * 100);
  const platformFeePaise = Math.round(servicePaise * commissionBps / 10000);

  return {
    serviceAmount: servicePaise / 100,
    platformFee: platformFeePaise / 100,
    subtotal: (servicePaise + platformFeePaise) / 100,
  };
}

module.exports={getQuotePreview};