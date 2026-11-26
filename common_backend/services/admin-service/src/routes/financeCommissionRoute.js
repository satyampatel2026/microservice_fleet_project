const express = require("express");
const router = express.Router();
const adminAuth = require("../middlewares/adminAuthMiddleware");
const requireAdminRole = require("../middlewares/requireAdminRole");
const internalAuth = require("../middlewares/internalServiceMiddleware");
const {getCommission,saveCommission,getInternalCommission,} = require("../controllers/commissionController");
const {listPayouts,recordTransfer,} = require("../controllers/payoutController");

router.get("/api/admin/finance/commission",adminAuth, requireAdminRole, getCommission);
router.put("/api/admin/finance/commission",adminAuth, requireAdminRole, saveCommission);
router.get("/api/admin/finance/payouts", adminAuth, requireAdminRole,listPayouts);
router.post("/api/admin/finance/payouts/:quoteId",adminAuth, requireAdminRole, recordTransfer);

router.get("/internal/finance/commission", internalAuth, getInternalCommission);

module.exports = router;