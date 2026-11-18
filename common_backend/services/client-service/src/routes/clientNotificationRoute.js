const express = require("express");
const router = express.Router();
const clientAuthMiddleware = require("../middlewares/clientAuthMiddleware");
const {getMyNotifications,markNotificationRead,} = require("../controllers/clientNotificationController");

router.get( "/api/client/notifications",clientAuthMiddleware, getMyNotifications);
router.patch("/api/client/notifications/:notificationId/read",clientAuthMiddleware,markNotificationRead);

module.exports = router;