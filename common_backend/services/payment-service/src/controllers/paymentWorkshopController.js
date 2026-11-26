const db = require("../model/db");

async function getPaidOrderWorkshop(req, res) {
  const { orderId } = req.params;

  try {
    const [rows] = await db.execute(
      `SELECT quote_id, razorpay_payment_id
       FROM service_payments
       WHERE razorpay_order_id = ?`,
      [orderId]
    );

    const order = rows[0];

    if (!order) {
      return res.status(404).json({ message: "Payment order not found" });
    }

    const clientUrl = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
    const partnerUrl = process.env.PARTNER_SERVICE_URL || "http://localhost:5003";
    const options = {
      headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
    };

    const quoteResponse = await fetch(
      `${clientUrl}/internal/clients/${req.clientId}/payment-quotes/${order.quote_id}?dropOff=1`,
      { ...options, signal: AbortSignal.timeout(5000) }
    );

    if (quoteResponse.status === 404) {
      return res.status(404).json({ message: "Payment order not found" });
    }

    if (!quoteResponse.ok) {
      throw new Error("Unable to check quote ownership");
    }

    if (!order.razorpay_payment_id) {
      return res.status(409).json({
        message: "Workshop details are available after payment confirmation",
      });
    }

    const { partnerId } = await quoteResponse.json();

    const workshopResponse = await fetch(
      `${partnerUrl}/internal/partners/${partnerId}/workshop`,
      { ...options, signal: AbortSignal.timeout(5000) }
    );

    if (workshopResponse.status === 404) {
      return res.status(404).json({ message: "Workshop details are unavailable" });
    }

    if (!workshopResponse.ok) {
      throw new Error("Unable to load workshop from Partner service");
    }

    const { workshop } = await workshopResponse.json();
    return res.json({ success: true, workshop });
  } catch (error) {
    console.error("Load paid order workshop:", error.message);
    return res.status(503).json({ message: "Unable to load workshop details" });
  }
}

module.exports = { getPaidOrderWorkshop };