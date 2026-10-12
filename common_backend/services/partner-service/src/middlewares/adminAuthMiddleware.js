const jwt = require("jsonwebtoken");

const adminAuthMiddleware = (req, res, next) => {
  try {
   const token = req.cookies.admin_token;

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

    // Token valid hai but Admin ka nahi hai
    if (decoded.type !== "admin") {
      return res.status(403).json({
        success: false,
        message: "Admin access required",
      });
    }

    req.user = decoded;
    req.userId = decoded.id;
    req.userRole = decoded.role;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = adminAuthMiddleware;