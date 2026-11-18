const express = require("express");
const router = express.Router();
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");
const requireAdminRole = require("../middlewares/requireAdminRole");
const {sendClientNotification,sendBroadcastNotification} = require("../controllers/adminNotificationController");

router.post("/api/admin/clients/:clientId/notifications",adminAuthMiddleware,requireAdminRole,sendClientNotification);
router.post("/api/admin/notifications/broadcast",adminAuthMiddleware,requireAdminRole,sendBroadcastNotification);

module.exports = router;