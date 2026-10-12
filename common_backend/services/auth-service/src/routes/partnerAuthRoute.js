const express = require("express");

const partnerAuthRouter = express.Router();

const { logoutPartner } = require("../controllers/logoutController");
const {
  forgotPasswordV2,
  verifyOtpV2,
  resetPasswordV2,
} = require("../controllers/partnerPasswordResetV2Controller");
const {
  registerPartnerV2,
} = require("../controllers/partnerRegisterV2Controller");
const {
  loginPartnerV2,
} = require("../controllers/partnerAuthV2Controller");

const authMiddleware = require("../middlewares/authMiddleware");


// ================= PARTNER AUTH =================

// Register
partnerAuthRouter.post(
  "/api/partner/register",
  registerPartnerV2
);


// Login
partnerAuthRouter.post(
  "/api/partner/login",
  loginPartnerV2
);


// Forgot Password
partnerAuthRouter.post(
  "/api/partner/forgot-password",
  forgotPasswordV2
);


// Verify OTP
partnerAuthRouter.post(
  "/api/partner/verify-otp",
  verifyOtpV2
);


// Reset Password
partnerAuthRouter.post(
  "/api/partner/reset-password",
  resetPasswordV2
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