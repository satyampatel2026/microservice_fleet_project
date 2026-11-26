const express = require("express");
const partnerServicesRouter = express.Router();
const partnerAuthMiddleware = require("../middlewares/partnerAuthMiddleware");

const {getMyServices,updateMyServices,} = require("../controllers/partnerServicesController");
const { getMyAssignedJobs,updateMyJobStatus,declineMyJob,sendJobQuote} = require("../controllers/partnerJobController");

// GET assigned services
partnerServicesRouter.get("/api/partner/my-services",partnerAuthMiddleware,getMyServices);
// UPDATE assigned services
partnerServicesRouter.put("/api/partner/my-services",partnerAuthMiddleware,updateMyServices);
partnerServicesRouter.get("/api/partner/jobs",partnerAuthMiddleware,getMyAssignedJobs);
partnerServicesRouter.patch( "/api/partner/jobs/:requestId/status", partnerAuthMiddleware,updateMyJobStatus);
partnerServicesRouter.patch( "/api/partner/jobs/:requestId/decline",partnerAuthMiddleware,declineMyJob);

partnerServicesRouter.post("/api/partner/jobs/:requestId/quotes",partnerAuthMiddleware,sendJobQuote);
module.exports = partnerServicesRouter;