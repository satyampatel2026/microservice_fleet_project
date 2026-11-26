const { createHmac, timingSafeEqual } = require("node:crypto");
const db = require("../model/db");
const { fetchRazorpayPayment } = require("../services/razorpayService");

async function verifyPayment(req, res) {
  const { orderId } = req.params;
  const { paymentId, signature } = req.body || {};

  if (
    !/^order_[a-zA-Z0-9]+$/.test(orderId || "") ||
    typeof paymentId !== "string" ||
    !/^pay_[a-zA-Z0-9]+$/.test(paymentId) ||
    typeof signature !== "string" ||
    !/^[a-fA-F0-9]{64}$/.test(signature)
  ) {
    return res.status(400).json({ message: "Invalid payment details" });
  }

  try {
    const [[order]] = await db.execute(
      `SELECT quote_id, amount_paise, razorpay_payment_id
       FROM service_payments
       WHERE razorpay_order_id = ?`,
      [orderId]
    );

    if (!order) {
      return res.status(404).json({ message: "Payment order not found" });
    }

    const clientUrl = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
    const quoteResponse = await fetch(
      `${clientUrl}/internal/clients/${req.clientId}/payment-quotes/${order.quote_id}`,
      {
        headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (quoteResponse.status === 404) {
      return res.status(404).json({ message: "Payment order not found" });
    }
    if (!quoteResponse.ok) {
      throw new Error("Unable to verify quote ownership");
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId?.startsWith("rzp_test_") || !secret) {
      throw new Error("Razorpay Test Mode keys are required");
    }

    const expectedSignature = createHmac("sha256", secret)
      .update(`${orderId}|${paymentId}`)
      .digest();

    if (!timingSafeEqual(expectedSignature, Buffer.from(signature, "hex"))) {
      return res.status(400).json({ message: "Invalid payment signature" });
    }

    if (order.razorpay_payment_id) {
      if (order.razorpay_payment_id !== paymentId) {
        return res.status(409).json({ message: "Order already has a verified payment" });
      }
      return res.json({ success: true, status: "paid" });
    }

    const payment = await fetchRazorpayPayment(paymentId);

    if (
      payment.id !== paymentId ||
      payment.order_id !== orderId ||
      payment.amount !== Number(order.amount_paise) ||
      payment.currency !== "INR"
    ) {
      return res.status(409).json({ message: "Payment does not match the order" });
    }

    if (payment.status !== "captured") {
      return res.json({ success: true, status: "pending" });
    }

    await db.execute(
      `UPDATE service_payments
       SET razorpay_payment_id = ?
       WHERE razorpay_order_id = ? AND razorpay_payment_id IS NULL`,
      [paymentId, orderId]
    );

    const [[saved]] = await db.execute(
      "SELECT razorpay_payment_id FROM service_payments WHERE razorpay_order_id = ?",
      [orderId]
    );

    if (saved?.razorpay_payment_id !== paymentId) {
      return res.status(409).json({ message: "Payment could not be matched to the order" });
    }

    return res.json({ success: true, status: "paid" });
  } catch (error) {
    console.error("Verify Razorpay payment:", error.message);
    return res.status(503).json({ message: "Unable to verify payment right now" });
  }
}

module.exports = { verifyPayment };