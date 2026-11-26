const db = require("../model/db");
const { createRazorpayOrder } = require("./razorpayService");

async function getOrCreateRazorpayOrder(quoteId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [rows] = await connection.execute(
      `SELECT gateway_order_id, provider_order_id, amount_paise, status
       FROM service_payments
       WHERE quote_id = ?
       FOR UPDATE`,
      [quoteId]
    );

    const payment = rows[0];

    if (!payment || payment.status !== "pending") {
      throw new Error("Payment order is no longer pending");
    }

    let razorpayOrderId = payment.provider_order_id;

    if (!razorpayOrderId) {
      const razorpayOrder = await createRazorpayOrder({
        amountPaise: Number(payment.amount_paise),
        receipt: payment.gateway_order_id,
      });

      razorpayOrderId = razorpayOrder.id;

      await connection.execute(
        `UPDATE service_payments
         SET provider_order_id = ?
         WHERE quote_id = ?`,
        [razorpayOrderId, quoteId]
      );
    }

    await connection.commit();
    return razorpayOrderId;
  } catch (error) {
    await connection.rollback().catch(() => {});
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = { getOrCreateRazorpayOrder };