const express = require("express");

const internalCatalogRouter = express.Router();

const internalServiceMiddleware = require(
  "../middlewares/internalServiceMiddleware"
);

const {
  validateSelectedServices,
} = require("../controllers/internalCatalogController");

// Internal API - Validate partner selected services
internalCatalogRouter.post(
  "/internal/catalog/validate-services",
  internalServiceMiddleware,
  validateSelectedServices
);

module.exports = internalCatalogRouter;