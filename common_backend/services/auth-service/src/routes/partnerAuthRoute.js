const express = require("express");

const partnerAuthRouter = express.Router();

const {
  registerPartner,
  loginPartner,
  forgotPassword,
  verifyOtp,
  resetPassword,
  logoutPartner,
} = require("../controllers/partnerAuthController");

const {
  loginPartnerV2,
} = require("../controllers/partnerAuthV2Controller");

const authMiddleware = require("../middlewares/authMiddleware");


// ================= PARTNER AUTH =================

// Register
partnerAuthRouter.post(
  "/api/partner/register",
  registerPartner
);


// Login
partnerAuthRouter.post(
  "/api/partner/login",
  loginPartnerV2
);

// Partner Login V2 - auth_db based
// partnerAuthRouter.post(
//   "/api/partner/login-v2",
//   loginPartnerV2
// );


// Forgot Password
partnerAuthRouter.post(
  "/api/partner/forgot-password",
  forgotPassword
);


// Verify OTP
partnerAuthRouter.post(
  "/api/partner/verify-otp",
  verifyOtp
);


// Reset Password
partnerAuthRouter.post(
  "/api/partner/reset-password",
  resetPassword
);


// Logout
partnerAuthRouter.post(
  "/api/partner/logout",
  logoutPartner
);


// ================= VERIFY PARTNER TOKEN =================

partnerAuthRouter.get(
  "/api/partner/auth/verify",
  authMiddleware,
  (req, res) => {

    // Admin token ko partner endpoint use nahi karne dena
    if (req.user.type !== "partner") {
      return res.status(403).json({
        success: false,
        message: "Partner access required",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Partner authenticated",
      partner: {
        id: req.partnerId,
        email: req.partnerEmail,
      },
    });
  }
);


module.exports = partnerAuthRouter;