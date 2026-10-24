const express = require("express");
const clientAuthrouter = express.Router();
const {registerClient,} = require("../controllers/clientRegisterController");
const {loginClient,} = require("../controllers/clientLoginController");
const {checkClientAuth,logoutClient} = require("../controllers/clientSessionController");
const {forgotClientPassword,verifyClientOtp,resetClientPassword} = require("../controllers/clientPasswordController");
const clientAuthMiddleware = require("../middlewares/clientAuthMiddleware");


clientAuthrouter.post("/api/client/register", registerClient);
clientAuthrouter.post("/api/client/login", loginClient);
clientAuthrouter.get( "/api/client/auth", clientAuthMiddleware,checkClientAuth);
clientAuthrouter.post("/api/client/logout", logoutClient);
clientAuthrouter.post("/api/client/forgot-password", forgotClientPassword);
clientAuthrouter.post("/api/client/verify-otp", verifyClientOtp);
clientAuthrouter.post("/api/client/reset-password", resetClientPassword);

module.exports = clientAuthrouter;
