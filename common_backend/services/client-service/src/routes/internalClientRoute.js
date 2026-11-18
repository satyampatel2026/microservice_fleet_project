const express = require("express");
const internalClientRouter = express.Router();
const internalServiceMiddleware = require( "../middlewares/internalServiceMiddleware");
const {getVehiclesForAdminTracking,} = require("../controllers/clientVehicleController");
const {createClient,getClientProfile,activateClient,getClients,getClientDetails,updateClientStatus} = require("../controllers/internalClientController");
const {getServiceRequestsForAdmin,getServiceRequestForAdmin ,assignServiceRequestToPartner,cancelServiceRequestByAdmin,
}=require("../controllers/adminServiceRequestController")
const {getAssignedServiceRequestsForPartner,declinePartnerJob,updatePartnerJobStatus}=require("../controllers/partnerServiceRequestController");
const {createWelcomeNotificationForClient,sendAdminNotificationToClient,createBroadcastNotificationForAllClients
} = require("../controllers/internalClientNotificationController");


internalClientRouter.post("/internal/clients",internalServiceMiddleware,createClient );
internalClientRouter.get("/internal/clients/:clientId/profile",internalServiceMiddleware, getClientProfile);
internalClientRouter.patch("/internal/clients/:clientId/activate",internalServiceMiddleware,activateClient);
internalClientRouter.get("/internal/clients",internalServiceMiddleware,getClients);
internalClientRouter.get("/internal/clients/:clientId/details",internalServiceMiddleware,getClientDetails);
internalClientRouter.patch("/internal/clients/:clientId/status",internalServiceMiddleware,updateClientStatus);
internalClientRouter.get("/internal/tracking/vehicles",internalServiceMiddleware,getVehiclesForAdminTracking);

//admin ke liye assign jobs or decline
internalClientRouter.get("/internal/service-requests",internalServiceMiddleware,getServiceRequestsForAdmin);
internalClientRouter.get("/internal/service-requests/:requestId",internalServiceMiddleware,getServiceRequestForAdmin);
internalClientRouter.patch("/internal/service-requests/:requestId/assign",internalServiceMiddleware,assignServiceRequestToPartner);
internalClientRouter.patch("/internal/service-requests/:requestId/cancel",internalServiceMiddleware,cancelServiceRequestByAdmin);

//partner ke liye assign jobs or decline
internalClientRouter.get("/internal/partners/:partnerId/service-requests",internalServiceMiddleware,getAssignedServiceRequestsForPartner);
internalClientRouter.patch( "/internal/partners/:partnerId/service-requests/:requestId/decline",internalServiceMiddleware,declinePartnerJob);
internalClientRouter.patch("/internal/partners/:partnerId/service-requests/:requestId/status",internalServiceMiddleware,updatePartnerJobStatus);

// create notification
internalClientRouter.post("/internal/clients/:clientId/notifications",internalServiceMiddleware,createWelcomeNotificationForClient);
internalClientRouter.post("/internal/clients/:clientId/admin-notifications",internalServiceMiddleware,sendAdminNotificationToClient);
internalClientRouter.post("/internal/notifications/broadcast",internalServiceMiddleware,createBroadcastNotificationForAllClients);

module.exports = internalClientRouter;