const express = require("express");
const crypto = require("crypto");
const { updateClientAccountStatus } = require("../controllers/internalClientAccountController");
const internalCLientRouter = express.Router();

// Internal endpoint public gateway par expose nahi karna.
// Isi file mein key check rakha hai; alag middleware file nahi chahiye.
const verifyInternalKey = (req, res, next) => {
  const expected = process.env.INTERNAL_SERVICE_KEY;
  const received = req.headers["x-internal-service-key"];
  if (!expected) return res.status(500).json({ success: false, message: "Internal key is not configured" });
  if (typeof received !== "string" || Buffer.byteLength(received) !== Buffer.byteLength(expected) ||
      !crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected))) {
    return res.status(403).json({ success: false, message: "Forbidden" });
  }
  next();
};

internalCLientRouter.patch("/internal/auth/client-accounts/:clientId/status", verifyInternalKey, updateClientAccountStatus);
module.exports = internalCLientRouter;
