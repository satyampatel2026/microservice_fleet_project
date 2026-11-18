const express = require("express");
const clientAuthMiddleware = require("../middlewares/clientAuthMiddleware");
const {getServiceRequestOptions,createServiceRequest,getMyServiceRequests,cancelServiceRequest} = require("../controllers/clientServiceRequestController");

const router = express.Router();

router.get( "/api/client/service-requests/options", clientAuthMiddleware, getServiceRequestOptions);
router.post("/api/client/service-requests",clientAuthMiddleware,createServiceRequest);
router.get( "/api/client/service-requests",clientAuthMiddleware,getMyServiceRequests);
router.patch( "/api/client/service-requests/:requestId/cancel",clientAuthMiddleware,cancelServiceRequest);

module.exports = router;