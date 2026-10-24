const express = require("express");

const internalPartnerRouter = express.Router();

const internalServiceMiddleware = require(
  "../middlewares/internalServiceMiddleware"
);

const {
  getPartnerProfile,createPartnerProfile,activatePartnerProfile,getPartnerByRegistrationToken
} = require("../controllers/internalPartnerController");

internalPartnerRouter.get(
  "/internal/partners/:partnerId/profile",
  internalServiceMiddleware,
  getPartnerProfile
);

internalPartnerRouter.post(
  "/internal/partners",
  internalServiceMiddleware,
  createPartnerProfile
);

internalPartnerRouter.patch(
  "/internal/partners/:partnerId/activate",
  internalServiceMiddleware,
  activatePartnerProfile
);

// Internal registration recovery lookup
internalPartnerRouter.get(
  "/internal/partners/registration/:registrationToken",
  internalServiceMiddleware,
  getPartnerByRegistrationToken
);

module.exports = internalPartnerRouter;