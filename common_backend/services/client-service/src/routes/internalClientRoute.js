const express = require("express");
const internalClientRouter = express.Router();
const internalServiceMiddleware = require( "../middlewares/internalServiceMiddleware");
const {getVehiclesForAdminTracking,} = require("../controllers/clientVehicleController");
const {
  createClient,getClientProfile,activateClient,getClients,getClientDetails,updateClientStatus
} = require("../controllers/internalClientController");


internalClientRouter.post("/internal/clients",internalServiceMiddleware,createClient );
internalClientRouter.get("/internal/clients/:clientId/profile",internalServiceMiddleware, getClientProfile);
internalClientRouter.patch("/internal/clients/:clientId/activate",internalServiceMiddleware,activateClient);
internalClientRouter.get("/internal/clients",internalServiceMiddleware,getClients);
internalClientRouter.get("/internal/clients/:clientId/details",internalServiceMiddleware,getClientDetails);
internalClientRouter.patch("/internal/clients/:clientId/status",internalServiceMiddleware,updateClientStatus);
internalClientRouter.get("/internal/tracking/vehicles",internalServiceMiddleware,getVehiclesForAdminTracking);

module.exports = internalClientRouter;