const express = require("express");

const categoryRouter = express.Router();

const {
  getCategories,
  addCategory,updateCategory,getPublicServiceCatalog
} = require("../controllers/categoryController");

const adminAuthMiddleware = require(
  "../middlewares/adminAuthMiddleware"
);

const requireAdminRole = require(
  "../middlewares/requireAdminRole"
);

// Get all categories
categoryRouter.get(
  "/api/admin/categories",
  adminAuthMiddleware,
  getCategories
);

// Add new category — Admin only
categoryRouter.post(
  "/api/admin/categories",
  adminAuthMiddleware,
  requireAdminRole,
  addCategory
);

categoryRouter.put(
  "/api/admin/categories/:categoryId",
  adminAuthMiddleware,
  requireAdminRole,
  updateCategory
);

categoryRouter.get(
  "/api/partner/service-catalog",
  getPublicServiceCatalog
);

module.exports = categoryRouter;