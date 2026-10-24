const express = require("express");
const router = express.Router();
const internalServiceMiddleware = require(
  "../middlewares/internalServiceMiddleware"
);

const {
  createClient,getClientProfile,activateClient
} = require("../controllers/internalClientController");


router.post("/internal/clients",internalServiceMiddleware,createClient );
router.get("/internal/clients/:clientId/profile",internalServiceMiddleware, getClientProfile);
router.patch("/internal/clients/:clientId/activate",internalServiceMiddleware,activateClient);

module.exports = router;