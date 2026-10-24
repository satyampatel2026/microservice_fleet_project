const express = require("express");

const roleRouter = express.Router();

const {
  postRole,
  getRole,
  updateRole,
  deleteRole,
  getUserRole,
  postUserRole,
  deleteUserRole,
} = require("../controllers/roleController");

const adminAuthMiddleware = require(
  "../middlewares/adminAuthMiddleware"
);
const requireAdminRole = require("../middlewares/requireAdminRole");

// ================= ROLES =================

// Get all roles
roleRouter.get(
  "/api/admin/roles",adminAuthMiddleware,
  getRole
);


// Add role
roleRouter.post(
  "/api/admin/roles",adminAuthMiddleware,requireAdminRole,
  postRole
);


// Update role
roleRouter.put(
  "/api/admin/roles",adminAuthMiddleware,requireAdminRole,
  updateRole
);


// Delete role
roleRouter.delete(
  "/api/admin/roles",adminAuthMiddleware,requireAdminRole,
  deleteRole
);


// ================= USER ROLE ASSIGNMENT =================

// Get roles assigned to a user
roleRouter.get(
  "/api/admin/user-roles",adminAuthMiddleware,
  getUserRole
);


// Assign role to user
roleRouter.post(
  "/api/admin/user-roles",adminAuthMiddleware,requireAdminRole,
  postUserRole
);


// Remove role from user
roleRouter.delete(
  "/api/admin/user-roles",adminAuthMiddleware,requireAdminRole,
  deleteUserRole
);


module.exports = roleRouter;