const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    const adminToken = req.cookies?.admin_token;
    const partnerToken = req.cookies?.partner_token;

    const isAdminRoute = req.originalUrl.startsWith("/api/admin/");
    const isPartnerRoute = req.originalUrl.startsWith("/api/partner/");

    if (!isAdminRoute && !isPartnerRoute) {
      return res.status(403).json({
        success: false,
        message: "Unsupported authentication route",
      });
    }

    const token = isAdminRoute ? adminToken : partnerToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (
      (isAdminRoute && decoded.type !== "admin") ||
      (isPartnerRoute && decoded.type !== "partner")
    ) {
      return res.status(403).json({
        success: false,
        message: "Access denied",
      });
    }

    req.user = decoded;

    if (isAdminRoute) {
      req.userId = decoded.id;
      req.userRole = decoded.role;
    } else {
      req.partnerId = decoded.id;
      req.partnerEmail = decoded.email;
    }

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = authMiddleware;