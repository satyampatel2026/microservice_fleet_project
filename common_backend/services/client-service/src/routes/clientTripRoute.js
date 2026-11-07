const express = require("express");
const clientAuthMiddleware = require("../middlewares/clientAuthMiddleware");
const {getMyTrips,getTripOptions,createTrip,updateTripStatus} = require("../controllers/clientTripController");

const router = express.Router();

router.get("/api/client/trips/options",clientAuthMiddleware,getTripOptions);
router.get( "/api/client/trips", clientAuthMiddleware, getMyTrips);
router.post("/api/client/trips",clientAuthMiddleware,createTrip);
router.patch("/api/client/trips/:tripId/status",clientAuthMiddleware,updateTripStatus);

module.exports = router;