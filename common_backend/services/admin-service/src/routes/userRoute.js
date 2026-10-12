const express = require("express");

const userRouter = express.Router();

const {
  totalUsers,
  postUser,
  getUser,
  updateUser,
  deleteUser,updateUserStatus
} = require("../controllers/userController");
const requireAdminRole = require(
  "../middlewares/requireAdminRole"
);
const adminAuthMiddleware = require(
  "../middlewares/adminAuthMiddleware"
);


// Total users
userRouter.get(
  "/api/admin/users/total",
  adminAuthMiddleware,requireAdminRole,
  totalUsers
);


// Add user
userRouter.post(
  "/api/admin/users",
  adminAuthMiddleware,requireAdminRole,
  postUser
);


// Get users
userRouter.get(
  "/api/admin/users",
  adminAuthMiddleware,requireAdminRole,
  getUser
);


// Update user
userRouter.put(
  "/api/admin/users",
  adminAuthMiddleware,requireAdminRole,
  updateUser
);


// Delete user
userRouter.delete(
  "/api/admin/users",
  adminAuthMiddleware,requireAdminRole,
  deleteUser
);

userRouter.patch(
  "/api/admin/users/:userId/status",
  adminAuthMiddleware,requireAdminRole,
  updateUserStatus
);

module.exports = userRouter;