const express = require("express");

const internalAuthRouter = express.Router();

const internalServiceMiddleware = require("../middlewares/internalServiceMiddleware");

const {
  getUserAuthorization,
} = require("../controllers/internalAuthController");

internalAuthRouter.get(
  "/internal/admin/users/:userId/authorization",
  internalServiceMiddleware,
  getUserAuthorization
);

module.exports = internalAuthRouter;