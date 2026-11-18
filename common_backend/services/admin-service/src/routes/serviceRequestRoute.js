const express = require("express");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");
const requireAdminRole = require("../middlewares/requireAdminRole");
const {getPendingServiceRequests, assignServiceRequest,cancelServiceRequest} = require("../controllers/serviceRequestController");

const router = express.Router();
router.get( "/api/admin/service-requests",adminAuthMiddleware,requireAdminRole,getPendingServiceRequests);
router.patch("/api/admin/service-requests/:requestId/assign",adminAuthMiddleware,requireAdminRole,assignServiceRequest);
router.patch("/api/admin/service-requests/:requestId/cancel",adminAuthMiddleware,requireAdminRole,cancelServiceRequest);

module.exports = router;    