const jwt = require("jsonwebtoken");
const authDb = require("../model/authDb");

const clientAuthMiddleware = async (req, res, next) => {
  const token = req.cookies?.client_token;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Please login first",
    });
  }

  let decoded;

  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired login",
    });
  }

  if (
    decoded.type !== "client" ||
    !Number.isSafeInteger(decoded.id) ||
    decoded.id <= 0
  ) {
    return res.status(403).json({
      success: false,
      message: "Client access required",
    });
  }

  try {
    // Account abhi bhi active hona chahiye
    const [accounts] = await authDb.query(
      `SELECT client_id, email
       FROM client_accounts
       WHERE client_id = ? AND status = 'active'
       LIMIT 1`,
      [decoded.id]
    );

    if (accounts.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Client account is unavailable",
      });
    }

    req.clientId = accounts[0].client_id;
    req.clientEmail = accounts[0].email;

    next();
  } catch (error) {
    console.error("Client auth error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to check login",
    });
  }
};

module.exports = clientAuthMiddleware;