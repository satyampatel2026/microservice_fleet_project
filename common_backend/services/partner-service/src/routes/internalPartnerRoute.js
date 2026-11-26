const express = require("express");
const internalPartnerRouter = express.Router();
const internalServiceMiddleware = require( "../middlewares/internalServiceMiddleware");
const { getPartnerProfile,createPartnerProfile,activatePartnerProfile, checkPartnerServiceEligibility} = require("../controllers/internalPartnerController");
const { getWorkshopDetails } = require("../controllers/partnerWorkshopController");

internalPartnerRouter.get("/internal/partners/:partnerId/profile",internalServiceMiddleware,getPartnerProfile);
internalPartnerRouter.post("/internal/partners",internalServiceMiddleware,createPartnerProfile);
internalPartnerRouter.patch("/internal/partners/:partnerId/activate",internalServiceMiddleware, activatePartnerProfile);
internalPartnerRouter.get("/internal/partners/:partnerId/services/:serviceId/eligibility",internalServiceMiddleware,checkPartnerServiceEligibility);

internalPartnerRouter.get("/internal/partners/:partnerId/workshop",internalServiceMiddleware,getWorkshopDetails);

module.exports = internalPartnerRouter;