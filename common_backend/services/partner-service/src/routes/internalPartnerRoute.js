const express = require("express");

const internalPartnerRouter = express.Router();

const internalServiceMiddleware = require(
  "../middlewares/internalServiceMiddleware"
);

const {
  getPartnerProfile,createPartnerProfile,activatePartnerProfile
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



module.exports = internalPartnerRouter;