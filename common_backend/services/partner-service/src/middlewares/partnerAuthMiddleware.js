const jwt = require("jsonwebtoken");

const partnerAuthMiddleware = (req, res, next) => {
  try {
    const token = req.cookies.partner_token;

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

    // Valid JWT hai, lekin Partner ka nahi
    if (decoded.type !== "partner") {
      return res.status(403).json({
        success: false,
        message: "Partner access required",
      });
    }

    req.user = decoded;
    req.partnerId = decoded.id;
    req.partnerEmail = decoded.email;

    next();

  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = partnerAuthMiddleware;