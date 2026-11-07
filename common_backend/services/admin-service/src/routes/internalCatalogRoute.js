const express = require("express");

const internalCatalogRouter = express.Router();

const internalServiceMiddleware = require("../middlewares/internalServiceMiddleware");

const {validateSelectedServices,getActiveServices} = require("../controllers/internalCatalogController");

// Internal API - Validate partner selected services
internalCatalogRouter.post("/internal/catalog/validate-services",internalServiceMiddleware,validateSelectedServices);
internalCatalogRouter.get("/internal/catalog/services",internalServiceMiddleware,getActiveServices);

module.exports = internalCatalogRouter;