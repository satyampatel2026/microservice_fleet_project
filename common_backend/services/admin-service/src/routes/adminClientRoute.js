const express = require("express");
const adminAuthMiddleware = require("../middlewares/adminAuthMiddleware");
const requireAdminRole = require("../middlewares/requireAdminRole");
const { getClients, getClientDetails, updateClientStatus } = require("../controllers/adminClientController");

const adminClientRouter = express.Router();
adminClientRouter.get("/api/admin/clients", adminAuthMiddleware, requireAdminRole, getClients);
adminClientRouter.get("/api/admin/clients/:clientId", adminAuthMiddleware, requireAdminRole, getClientDetails);
adminClientRouter.patch("/api/admin/clients/:clientId/status", adminAuthMiddleware, requireAdminRole, updateClientStatus);

module.exports = adminClientRouter;

