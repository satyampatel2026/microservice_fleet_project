const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const clientAuthMiddleware = require("../middlewares/clientAuthMiddleware");
const internalServiceMiddleware = require("../middlewares/internalServiceMiddleware");
const { getPaidQuoteStatuses } = require("../controllers/paidQuoteStatusController");
const { downloadPaymentReceipt } = require("../controllers/paymentReceiptController");
const { createPaymentOrder } = require("../controllers/paymentOrderController");
const { verifyPayment } = require("../controllers/paymentVerificationController");
const { getPaidOrderWorkshop } = require("../controllers/paymentWorkshopController");
const { recordPartnerPayout } = require("../controllers/recordPartnerPayout");

const createOrderRateLimiter = rateLimit({
  windowMs: 60_000,
  limit: 10,
  keyGenerator: (req) => `client:${req.clientId}`,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many payment requests. Try again in a minute.",
  },
});

router.post("/api/client/payments/orders",clientAuthMiddleware,createOrderRateLimiter,createPaymentOrder);
router.post("/api/client/payments/orders/:orderId/verify",clientAuthMiddleware,verifyPayment);
router.get("/api/client/payments/orders/:orderId/workshop",clientAuthMiddleware,getPaidOrderWorkshop);

router.post("/internal/payments/paid-quotes", internalServiceMiddleware, getPaidQuoteStatuses);
router.get("/api/client/payments/orders/:orderId/receipt", clientAuthMiddleware, downloadPaymentReceipt);

router.post("/internal/partner-payouts/:quoteId",internalServiceMiddleware,recordPartnerPayout);

module.exports = router;