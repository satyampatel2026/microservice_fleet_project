const jwt = require("jsonwebtoken");

const adminAuthMiddleware = async (req, res, next) => {
  const token = req.cookies?.admin_token;

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

  const userId = Number(decoded.id);

  if (
    decoded.type !== "admin" ||
    !Number.isSafeInteger(userId) ||
    userId <= 0
  ) {
    return res.status(403).json({
      success: false,
      message: "Admin access required",
    });
  }

  try {
    const adminUrl =
      process.env.ADMIN_SERVICE_URL || "http://localhost:5002";

    // Database mein abhi user active hai? Kaunse roles hain?
    const response = await fetch(
      `${adminUrl}/internal/admin/users/${userId}/authorization`,
      {
        headers: {
          "x-internal-service-key": process.env.INTERNAL_SERVICE_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.status === 404) {
      return res.status(401).json({
        success: false,
        message: "Admin account not found",
      });
    }

    if (!response.ok) {
      throw new Error("Unable to check admin permission");
    }

    const account = await response.json();

    const roles = Array.isArray(account.roles) ? account.roles : [];

    const allowed = roles.includes("Admin") ||
      roles.includes("SUPER ADMIN") ||
      roles.includes("Manager");

    if (account.status !== "active" || !allowed) {
      return res.status(403).json({
        success: false,
        message: "You cannot access vehicle tracking",
      });
    }

    req.userId = userId;
    next();
  } catch (error) {
    console.error("Admin tracking authentication:", error.message);

    return res.status(503).json({
      success: false,
      message: "Admin permission check is unavailable",
    });
  }
};

module.exports = adminAuthMiddleware;