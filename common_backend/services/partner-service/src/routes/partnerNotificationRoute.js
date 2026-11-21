const express = require("express");
const router = express.Router();
const partnerAuthMiddleware = require("../middlewares/partnerAuthMiddleware");
const internalServiceMiddleware = require("../middlewares/internalServiceMiddleware");
const {createInternalNotification,getMyNotifications, markNotificationRead,savePushToken,} = require("../controllers/partnerNotificationController");

router.post("/internal/partners/:partnerId/notifications",internalServiceMiddleware,createInternalNotification);
router.get("/api/partner/notifications",partnerAuthMiddleware,getMyNotifications);
router.patch("/api/partner/notifications/:notificationId/read",partnerAuthMiddleware,markNotificationRead);
router.post("/api/partner/push-token",partnerAuthMiddleware,savePushToken);

module.exports = router;