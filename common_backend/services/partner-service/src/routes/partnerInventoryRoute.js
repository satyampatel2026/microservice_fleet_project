const express = require("express");
const partnerAuth = require("../middlewares/partnerAuthMiddleware");

const {
  getInventory,
  createItem,
  addStock,
} = require("../controllers/partnerInventoryController");

const { useJobPart } = require("../controllers/jobPartController");

const router = express.Router();

router.use(partnerAuth);

router.get("/", getInventory);
router.post("/", createItem);
router.post("/:id/stock", addStock);
router.post("/jobs/:requestId/use-part", useJobPart);

module.exports = router;