const express = require("express");

const clientAuthMiddleware = require( "../middlewares/clientAuthMiddleware");
const trackingTokenMiddleware = require("../middlewares/trackingTokenMiddleware");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");
const {createTrackingLink,startTracking,updateLocation,stopTracking,
    getClientTracking,getAdminTracking,getClientVehicleHistory} = require("../controllers/trackingController");

const router = express.Router();

router.post("/api/client/vehicles/:vehicleId/tracking-link",clientAuthMiddleware,createTrackingLink);
// Mobile tracking token se session start hoga.
router.post("/api/tracking/sessions/:sessionId/start",trackingTokenMiddleware,startTracking);
router.post( "/api/tracking/sessions/:sessionId/location", trackingTokenMiddleware, updateLocation);
router.post( "/api/tracking/sessions/:sessionId/stop",trackingTokenMiddleware,stopTracking);
router.get("/api/tracking/client/vehicles", clientAuthMiddleware, getClientTracking);
router.get("/api/tracking/admin/vehicles",adminAuthMiddleware,getAdminTracking);
router.get("/api/tracking/client/vehicles/:vehicleId/history",clientAuthMiddleware,getClientVehicleHistory);

module.exports = router;