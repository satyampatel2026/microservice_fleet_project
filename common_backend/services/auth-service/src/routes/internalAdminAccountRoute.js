const express = require("express");

const {
  provisionAdminAccount,deleteAdminAccount,
  verifyInternalService,updateAdminAccount
} = require("../controllers/internalAdminAccountController");

const router = express.Router();

router.post(
  "/internal/auth/admin-accounts",
  verifyInternalService,
  provisionAdminAccount
);

router.patch(
  "/internal/auth/admin-accounts/:adminId",
  verifyInternalService,
  updateAdminAccount
);

router.delete(
  "/internal/auth/admin-accounts/:adminId",
  verifyInternalService,
  deleteAdminAccount
);
module.exports = router;