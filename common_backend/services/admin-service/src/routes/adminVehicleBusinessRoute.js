const express = require("express");
const adminAuth = require("../middlewares/adminAuthMiddleware");
const requireAdminRole = require("../middlewares/requireAdminRole");
const {
  getVehicles,
  reviewVehicle,
  getBusinesses,
  reviewBusiness,
} = require("../controllers/adminVehicleBusinessController");

const router = express.Router();
router.use("/api/admin/verification", adminAuth, requireAdminRole);

// Vehicle list, decision aur document.
router.get("/api/admin/verification/vehicles", getVehicles);
router.patch("/api/admin/verification/vehicles/:id", reviewVehicle);

// Client company/business list aur decision.
router.get("/api/admin/verification/businesses", getBusinesses);
router.patch("/api/admin/verification/businesses/:id", reviewBusiness);
module.exports = router;
