// Auth Service se cookie verify karvao. Client Service auth database nahi padhegi.
const clientAuthMiddleware = async (req, res, next) => {
  const token = req.cookies?.client_token;

  if (!token) {
    return res.status(401).json({ success: false, message: "Please login first" });
  }

  try {
    const authUrl = process.env.AUTH_SERVICE_URL || "http://localhost:5001";
    const response = await fetch(`${authUrl}/api/client/auth`, {
      headers: { Cookie: `client_token=${encodeURIComponent(token)}` },
      signal: AbortSignal.timeout(5000),
    });

    if (response.status === 401 || response.status === 403) {
      return res.status(response.status).json({ success: false, message: "Invalid or unavailable client login" });
    }
    if (!response.ok) {
      return res.status(503).json({ success: false, message: "Login verification is unavailable" });
    }

    const data = await response.json();
    if (data.success !== true || !Number.isSafeInteger(data.client?.id) || data.client.id <= 0) {
      return res.status(503).json({ success: false, message: "Unable to verify client login" });
    }

    req.clientId = data.client.id;
    req.clientEmail = data.client.email;
    next();
  } catch (error) {
    console.error("Client profile authentication:", error.message);
    return res.status(503).json({ success: false, message: "Login verification is unavailable" });
  }
};

module.exports = clientAuthMiddleware;
