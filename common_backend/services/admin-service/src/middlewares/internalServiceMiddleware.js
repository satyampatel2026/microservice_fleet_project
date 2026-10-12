const crypto = require("crypto");

const internalServiceMiddleware = (req, res, next) => {
  const expectedKey = process.env.INTERNAL_SERVICE_KEY;
  const receivedKey = req.headers["x-internal-service-key"];

  if (!expectedKey) {
    console.error("INTERNAL_SERVICE_KEY is not configured");

    return res.status(500).json({
      success: false,
      message: "Internal service authentication is not configured",
    });
  }

  if (
    typeof receivedKey !== "string" ||
    Buffer.byteLength(receivedKey) !== Buffer.byteLength(expectedKey) ||
    !crypto.timingSafeEqual(
      Buffer.from(receivedKey),
      Buffer.from(expectedKey)
    )
  ) {
    return res.status(403).json({
      success: false,
      message: "Forbidden",
    });
  }

  next();
};

module.exports = internalServiceMiddleware;