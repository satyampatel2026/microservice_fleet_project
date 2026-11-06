const crypto = require("crypto");
const TrackingSession = require("../models/TrackingSession");

const trackingTokenMiddleware = async (req, res, next) => {
  const { sessionId } = req.params;
  const authorization = req.headers.authorization || "";

  // Header ka format: Bearer TOKEN
  const token = authorization.startsWith("Bearer ")
    ? authorization.slice(7)
    : "";

  if (!/^[a-f0-9]{24}$/i.test(sessionId || "")) {
    return res.status(400).json({
      success: false,
      message: "Invalid tracking session ID",
    });
  }

  if (!/^[a-f0-9]{64}$/.test(token)) {
    return res.status(401).json({
      success: false,
      message: "Valid tracking token is required",
    });
  }

  try {
    const session = await TrackingSession.findById(
      sessionId
    ).select("+tokenHash");

    if (!session) {
      return res.status(404).json({
        success: false,
        message: "Tracking session not found",
      });
    }

    const receivedHash = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const receivedBuffer = Buffer.from(receivedHash, "hex");
    const savedBuffer = Buffer.from(session.tokenHash, "hex");

    if (
      receivedBuffer.length !== savedBuffer.length ||
      !crypto.timingSafeEqual(receivedBuffer, savedBuffer)
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid tracking token",
      });
    }

    if (session.expiresAt.getTime() <= Date.now()) {
      return res.status(410).json({
        success: false,
        message: "Tracking link has expired",
      });
    }

    if (session.status === "stopped") {
      return res.status(409).json({
        success: false,
        message: "This tracking session has stopped",
      });
    }

    req.trackingSession = session;

    res.setHeader("Cache-Control", "no-store");
    next();
  } catch (error) {
    console.error("Tracking token check:", error.message);

    return res.status(503).json({
      success: false,
      message: "Unable to verify tracking session",
    });
  }
};

module.exports = trackingTokenMiddleware;