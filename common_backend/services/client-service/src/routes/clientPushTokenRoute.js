const express = require("express");
const router = express.Router();
const clientAuthMiddleware = require("../middlewares/clientAuthMiddleware");
const {saveMyPushToken,} = require("../controllers/clientPushTokenController");

router.post("/api/client/push-token",clientAuthMiddleware,saveMyPushToken);

module.exports = router;