async function createRazorpayOrder({ amountPaise, receipt }) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId?.startsWith("rzp_test_") || !keySecret) {
    throw new Error("Razorpay Test Mode keys are required");
  }

  const credentials = Buffer.from(`${keyId}:${keySecret}`).toString("base64");

  const response = await fetch("https://api.razorpay.com/v1/orders", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount: amountPaise,
      currency: "INR",
      receipt,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok || !data.id) {
    const message = data.error?.description || `HTTP ${response.status}`;
    throw new Error(`Razorpay order failed: ${message}`);
  }

  return data;
}

async function fetchRazorpayPayment(paymentId) {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId?.startsWith("rzp_test_") || !secret) {
    throw new Error("Razorpay Test Mode keys are required");
  }

  const credentials = Buffer.from(keyId + ":" + secret).toString("base64");
  const response = await fetch("https://api.razorpay.com/v1/payments/" + encodeURIComponent(paymentId), {
    headers: { Authorization: "Basic " + credentials },
    signal: AbortSignal.timeout(5000),
  });
  if (!response.ok) throw new Error("Razorpay payment lookup failed (" + response.status + ")");
  return response.json();
}

module.exports = { createRazorpayOrder, fetchRazorpayPayment };