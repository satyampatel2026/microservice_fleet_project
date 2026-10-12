const jwt = require("jsonwebtoken");

const adminAuthMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    if (decoded.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    const userId = Number(decoded.id);

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid user session",
      });
    }

    // Current status aur roles Admin Service se verify karo
    const response = await fetch(
      `http://localhost:5002/internal/admin/users/${userId}/authorization`,
      {
        headers: {
          "x-internal-service-key":
            process.env.INTERNAL_SERVICE_KEY,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.status === 404) {
      return res.status(401).json({
        success: false,
        message: "User account not found",
      });
    }

    if (!response.ok) {
      return res.status(503).json({
        success: false,
        message: "Authorization service unavailable",
      });
    }

    const authorization = await response.json();

    if (authorization.status !== "active") {
      res.clearCookie("admin_token", {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
      });

      return res.status(403).json({
        success: false,
        message: "Your account is inactive",
      });
    }

    const roles = authorization.roles || [];

    if (!roles.length) {
      return res.status(403).json({
        success: false,
        message: "No role assigned",
      });
    }

    req.user = decoded;
    req.userId = userId;
    req.userRole = roles.includes("SUPER ADMIN")
      ? "SUPER ADMIN"
      : roles.includes("Admin")
        ? "Admin"
        : roles[0];

    req.userRoles = roles;

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token",
      });
    }

    console.error("Admin Auth Middleware Error:", error);

    return res.status(503).json({
      success: false,
      message: "Authentication service temporarily unavailable",
    });
  }
};

module.exports = adminAuthMiddleware;