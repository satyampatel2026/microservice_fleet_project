const express = require("express");

const adminKycRouter = express.Router();

const adminAuthMiddleware = require(
  "../middlewares/adminAuthMiddleware"
);

const {
  getAdminDocument,
} = require("../controllers/kycDocumentController");

const {
  getKycList,
  getKycDetails,
  verifyKyc,
  rejectKyc,
} = require(
  "../controllers/adminKycController"
);


// ================= GET ALL KYC =================

adminKycRouter.get(
  "/api/admin/kyc",
  adminAuthMiddleware,
  getKycList
);


// ================= GET KYC DETAILS =================

adminKycRouter.get(
  "/api/admin/kyc/:kycId",
  adminAuthMiddleware,
  getKycDetails
);


// ================= VERIFY KYC =================

adminKycRouter.patch(
  "/api/admin/kyc/:kycId/verify",
  adminAuthMiddleware,
  verifyKyc
);


// ================= REJECT KYC =================

adminKycRouter.patch(
  "/api/admin/kyc/:kycId/reject",
  adminAuthMiddleware,
  rejectKyc
);

// Secure KYC document access for Admin / SUPER ADMIN / Manager
adminKycRouter.get(
  "/api/admin/kyc/:kycId/document/:documentType",
  adminAuthMiddleware,
  getAdminDocument
);

module.exports = adminKycRouter;