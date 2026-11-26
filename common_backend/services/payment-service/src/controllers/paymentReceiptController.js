const PDFKit = require("pdfkit");
const PDFDocument = PDFKit.PDFDocument || PDFKit;
const db = require("../model/db");
const { fetchRazorpayPayment } = require("../services/razorpayService");

async function downloadPaymentReceipt(req, res) {
  const { orderId } = req.params;
  if (!/^order_[a-zA-Z0-9]+$/.test(orderId)) {
    return res.status(400).json({ message: "Invalid order ID" });
  }

  try {
    const [rows] = await db.execute(
      "SELECT quote_id, amount_paise, razorpay_payment_id FROM service_payments WHERE razorpay_order_id = ?",
      [orderId]
    );
    const order = rows[0];
    if (!order) return res.status(404).json({ message: "Payment order not found" });

    const clientUrl = process.env.CLIENT_SERVICE_URL || "http://localhost:5004";
    const quotePath = "/internal/clients/" + req.clientId + "/payment-quotes/" + order.quote_id;
    const quoteResponse = await fetch(clientUrl + quotePath + "?receipt=1", {
      headers: { "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY },
      signal: AbortSignal.timeout(5000),
    });

    if (quoteResponse.status === 404) {
      return res.status(404).json({ message: "Payment order not found" });
    }
    if (!quoteResponse.ok) throw new Error("Unable to confirm quote ownership");
    if (!order.razorpay_payment_id) {
      return res.status(409).json({ message: "Receipt is available after payment confirmation" });
    }

    const quote = await quoteResponse.json();
    const payment = await fetchRazorpayPayment(order.razorpay_payment_id);
    const paidAmount = Number(order.amount_paise);

    if (payment.order_id !== orderId || payment.amount !== paidAmount ||
        payment.currency !== "INR" || !Number.isFinite(payment.created_at)) {
      throw new Error("Receipt transaction details do not match");
    }
    if (req.query.format === "json") {
     const paymentDate = new Date(payment.created_at * 1000);
    res.set("Cache-Control", "private, no-store");
    return res.json({
    amountPaise: paidAmount,
    paymentDate: paymentDate.toISOString(),
  });
}
    const date = new Date(payment.created_at * 1000).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Kolkata",
    });
    const amount = (paidAmount / 100).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    const receipt = new PDFDocument({
      size: "A4",
      margin: 52,
      info: { Title: "FleetRova Payment Receipt" },
    });

    const fileName = "FleetRova-Receipt-" + orderId + ".pdf";
    res.type("application/pdf").attachment(fileName);
    res.set("Cache-Control", "private, no-store");
    receipt.on("error", (error) => res.destroy(error));
    receipt.pipe(res);

    const left = 52;
const width = receipt.page.width - left * 2;
const right = left + width;

// FleetRova header
receipt.roundedRect(left, 52, width, 120, 12).fill("#102F34");

receipt.fillColor("#A7F3D0").font("Helvetica-Bold").fontSize(12)
  .text("FLEETROVA", left + 24, 74);

receipt.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(28)
  .text("Payment Receipt", left + 24, 98);

receipt.fillColor("#CBD5E1").font("Helvetica").fontSize(10)
  .text("Vehicle service payment", left + 24, 139);

// Amount paid
receipt.roundedRect(left, 194, width, 88, 10).fill("#ECFDF5");

receipt.fillColor("#166534").font("Helvetica").fontSize(11)
  .text("Amount paid", left + 20, 212);

receipt.fillColor("#14532D").font("Helvetica-Bold").fontSize(26)
  .text(`INR ${amount}`, left + 20, 232);

receipt.roundedRect(right - 78, 215, 58, 23, 6).fill("#166534");

receipt.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(9)
  .text("PAID", right - 78, 223, { width: 58, align: "center" });

// Transaction details
receipt.fillColor("#0F172A").font("Helvetica-Bold").fontSize(15)
  .text("Transaction details", left, 313);

const details = [
  ["Service request", quote.requestCode || String(quote.requestId)],
  ["Transaction date (IST)", date],
  ["Razorpay order ID", orderId],
  ["Payment reference", order.razorpay_payment_id],
];

let rowY = 344;

for (const [label, value] of details) {
  receipt.fillColor("#475569").font("Helvetica").fontSize(10)
    .text(label, left, rowY, { width: 165 });

  receipt.fillColor("#0F172A").font("Helvetica-Bold").fontSize(11)
    .text(value, left + 170, rowY, { width: width - 170 });

  receipt.moveTo(left, rowY + 23).lineTo(right, rowY + 23)
    .lineWidth(0.6).stroke("#E2E8F0");

  rowY += 36;
}

// Test mode and receipt note
receipt.roundedRect(left, 510, width, 55, 8).fill("#FFF7ED");

receipt.fillColor("#9A3412").font("Helvetica-Bold").fontSize(10)
  .text("RAZORPAY TEST MODE", left + 16, 523);

receipt.fillColor("#7C2D12").font("Helvetica").fontSize(10)
  .text("This is a simulated payment. No real money was collected.", left + 16, 541);

receipt.fillColor("#64748B").font("Helvetica").fontSize(9)
  .text("This payment receipt is not a GST tax invoice.", left, 589, {
    width,
    align: "center",
  });

receipt.end();
  } catch (error) {
    console.error("Download payment receipt:", error.message);
    if (res.headersSent) return res.destroy(error);
    return res.status(503).json({ message: "Unable to download payment receipt" });
  }
}

module.exports = { downloadPaymentReceipt };
