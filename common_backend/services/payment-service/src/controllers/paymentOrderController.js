const db = require("../model/db");
const { createRazorpayOrder } = require("../services/razorpayService");

async function createPaymentOrder(req, res) {
  const quoteId = Number(req.body?.quoteId);

  if (!Number.isSafeInteger(quoteId) || quoteId <= 0) {
    return res.status(400).json({ message: "Valid quote ID is required" });
  }

  let connection;

  try {
    const clientUrl = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
    const quoteResponse = await fetch(
      `${clientUrl}/internal/clients/${req.clientId}/payment-quotes/${quoteId}`,
      {
        headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (quoteResponse.status === 404) {
      return res.status(404).json({ message: "Accepted quote not found" });
    }

    if (!quoteResponse.ok) {
      throw new Error("Unable to verify accepted quote");
    }

    const { amountPaise } = await quoteResponse.json();

    if (!Number.isSafeInteger(amountPaise) || amountPaise < 100) {
      return res.status(409).json({ message: "Approved amount must be at least ₹1" });
    }

    connection = await db.getConnection();
    await connection.beginTransaction();

    await connection.execute(
      `INSERT INTO service_payments (quote_id, amount_paise)
       VALUES (?, ?)
       ON DUPLICATE KEY UPDATE quote_id = quote_id`,
      [quoteId, amountPaise]
    );

    const [[payment]] = await connection.execute(
      `SELECT amount_paise, razorpay_order_id, razorpay_payment_id
       FROM service_payments WHERE quote_id = ?
       FOR UPDATE`,
      [quoteId]
    );

    if (Number(payment.amount_paise) !== amountPaise) {
      await connection.rollback();
      return res.status(409).json({ message: "Approved amount changed" });
    }

    let razorpayOrderId = payment.razorpay_order_id;

    if (!razorpayOrderId) {
      const order = await createRazorpayOrder({
        amountPaise,
        receipt: `FLEETQUOTE${quoteId}`,
      });

      razorpayOrderId = order.id;

      await connection.execute(
        "UPDATE service_payments SET razorpay_order_id = ? WHERE quote_id = ?",
        [razorpayOrderId, quoteId]
      );
    }

    await connection.commit();

    return res.json({
      success: true,
      order: {
        amountPaise,
        currency: "INR",
        status: payment.razorpay_payment_id ? "paid" : "pending",
      },
      checkout: {
        keyId: process.env.RAZORPAY_KEY_ID,
        razorpayOrderId,
      },
    });
  } catch (error) {
    if (connection) await connection.rollback().catch(() => {});
    console.error("Create payment order:", error.message);
    return res.status(503).json({ message: "Unable to create payment order" });
  } finally {
    connection?.release();
  }
}

module.exports = { createPaymentOrder };