const clientAuthMiddleware = async (req, res, next) => {
  const token = req.cookies?.client_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please login first",
    });
  }

  try {
    const authUrl =
      process.env.AUTH_SERVICE_URL || "http://localhost:5001";

    const response = await fetch(`${authUrl}/api/client/auth`, {
      headers: {
        Cookie: `client_token=${encodeURIComponent(token)}`,
      },
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 401 || response.status === 403) {
      return res.status(response.status).json({
        success: false,
        message: "Invalid or unavailable client login",
      });
    }

    if (!response.ok) {
      return res.status(503).json({
        success: false,
        message: "Login verification is unavailable",
      });
    }

    const result = await response.json();
    const clientId = result.client?.id;

    if (
      result.success !== true ||
      !Number.isSafeInteger(clientId) ||
      clientId <= 0
    ) {
      return res.status(503).json({
        success: false,
        message: "Unable to verify client login",
      });
    }

    req.clientId = clientId;
    next();
  } catch (error) {
    console.error("Tracking authentication:", error.message);

    return res.status(503).json({
      success: false,
      message: "Login verification is unavailable",
    });
  }
};

module.exports = clientAuthMiddleware;