const express = require("express");
const clientAuthMiddleware = require("../middlewares/clientAuthMiddleware");
const {getMyDrivers,addDriver,updateDriverStatus,updateDriver} = require("../controllers/clientDriverController");

const router = express.Router();

router.get("/api/client/drivers",clientAuthMiddleware,getMyDrivers);

router.post("/api/client/drivers",clientAuthMiddleware,addDriver);
router.patch( "/api/client/drivers/:driverId/status", clientAuthMiddleware, updateDriverStatus);
router.put("/api/client/drivers/:driverId",clientAuthMiddleware,updateDriver);

module.exports = router;