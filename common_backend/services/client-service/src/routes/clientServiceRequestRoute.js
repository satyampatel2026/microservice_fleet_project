const express = require("express");
const clientAuthMiddleware = require("../middlewares/clientAuthMiddleware");
const {getServiceRequestOptions,createServiceRequest,getMyServiceRequests,cancelServiceRequest} = require("../controllers/clientServiceRequestController");
const { getClientServiceQuote} = require("../controllers/serviceQuoteReadController");
const {decideClientServiceQuote}=require("../controllers/serviceQuoteWriteController");

const router = express.Router();

router.get( "/api/client/service-requests/options", clientAuthMiddleware, getServiceRequestOptions);
router.post("/api/client/service-requests",clientAuthMiddleware,createServiceRequest);
router.get( "/api/client/service-requests",clientAuthMiddleware,getMyServiceRequests);
router.patch( "/api/client/service-requests/:requestId/cancel",clientAuthMiddleware,cancelServiceRequest);

router.get("/api/client/service-requests/:requestId/quote",clientAuthMiddleware,getClientServiceQuote);
router.patch("/api/client/service-requests/:requestId/quotes/:quoteId/decision",clientAuthMiddleware,decideClientServiceQuote);

module.exports = router;