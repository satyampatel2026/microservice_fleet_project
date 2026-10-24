const express = require("express");

const serviceRouter = express.Router();

const {
  getServices,
  addService,updateService
} = require("../controllers/serviceController");

const adminAuthMiddleware = require(
  "../middlewares/adminAuthMiddleware"
);

const requireAdminRole = require(
  "../middlewares/requireAdminRole"
);

// Get all services — authenticated admin/employee
serviceRouter.get(
  "/api/admin/services",
  adminAuthMiddleware,
  getServices
);

// Add new service — Admin only
serviceRouter.post(
  "/api/admin/services",
  adminAuthMiddleware,
  requireAdminRole,
  addService
);

// Update service — Admin only
serviceRouter.put(
  "/api/admin/services/:serviceId",
  adminAuthMiddleware,
  requireAdminRole,
  updateService
);

module.exports = serviceRouter;