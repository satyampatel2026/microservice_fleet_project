const express = require("express");

const partnerKycRouter = express.Router();

const partnerAuthMiddleware = require(
  "../middlewares/partnerAuthMiddleware"
);
const {
  getPartnerDocument,
} = require("../controllers/kycDocumentController");
const upload = require(
  "../middlewares/uploadKyc"
);

const {
  submitKyc,
  getKycByPartnerId,
} = require(
  "../controllers/partnerKycController"
);


// ================= SUBMIT / UPDATE KYC =================

partnerKycRouter.post(
  "/api/partner/kyc",
  partnerAuthMiddleware,

  upload.fields([
    {
      name: "pan_document",
      maxCount: 1,
    },
    {
      name: "aadhaar_document",
      maxCount: 1,
    },
    {
      name: "gst_document",
      maxCount: 1,
    },
  ]),

  submitKyc
);


// ================= GET PARTNER KYC =================

partnerKycRouter.get(
  "/api/partner/kyc",
  partnerAuthMiddleware,
  getKycByPartnerId
);

// Authenticated Partner KYC Document
partnerKycRouter.get(
  "/api/partner/kyc/document/:documentType",
  partnerAuthMiddleware,
  getPartnerDocument
);

module.exports = partnerKycRouter;