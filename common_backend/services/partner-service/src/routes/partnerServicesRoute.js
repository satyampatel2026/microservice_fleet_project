const express = require("express");

const partnerServicesRouter = express.Router();

const partnerAuthMiddleware = require(
  "../middlewares/partnerAuthMiddleware"
);

const {
  getMyServices,
  updateMyServices,
} = require("../controllers/partnerServicesController");

// GET assigned services
partnerServicesRouter.get(
  "/api/partner/my-services",
  partnerAuthMiddleware,
  getMyServices
);

// UPDATE assigned services
partnerServicesRouter.put(
  "/api/partner/my-services",
  partnerAuthMiddleware,
  updateMyServices
);

module.exports = partnerServicesRouter;