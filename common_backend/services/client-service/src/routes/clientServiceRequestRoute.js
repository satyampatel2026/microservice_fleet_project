const express = require("express");
const clientAuthMiddleware = require("../middlewares/clientAuthMiddleware");
const {getServiceRequestOptions,createServiceRequest,getMyServiceRequests} = require("../controllers/clientServiceRequestController");

const router = express.Router();

router.get( "/api/client/service-requests/options", clientAuthMiddleware, getServiceRequestOptions);
router.post("/api/client/service-requests",clientAuthMiddleware,createServiceRequest);
router.get( "/api/client/service-requests",clientAuthMiddleware,getMyServiceRequests)

module.exports = router;