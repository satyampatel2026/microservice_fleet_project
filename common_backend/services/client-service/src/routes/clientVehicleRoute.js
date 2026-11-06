const express = require("express");
const multer = require("multer");
const clientAuth = require("../middlewares/clientAuthMiddleware");
const internalAuth = require("../middlewares/internalServiceMiddleware");
const vehicle = require("../controllers/clientVehicleController");
const review = require("../controllers/clientVehicleBusinessController");
const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 200 * 1024,
    files: 1,
    fields: 6,
    fieldSize: 1000
  },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "application/pdf"].includes(file.mimetype)) return callback(new Error("Only JPEG/PDF RC is allowed"));
    callback(null, true);
  }
}).single("rc_document");
const uploadRc = (req, res, next) => upload(req, res, error => {
  if (error) return res.status(400).json({
    success: false,
    message: error.code === "LIMIT_FILE_SIZE" ? "RC must be 200 KB or smaller" : "Invalid RC upload"
  });
  if (req.file) {
    const file = req.file;
    const pdf = file.buffer.subarray(0, 5).toString() === "%PDF-";
    const jpeg = file.buffer[0] === 0xff && file.buffer[1] === 0xd8 && file.buffer[2] === 0xff;
    if (!(file.mimetype === "application/pdf" && pdf || file.mimetype === "image/jpeg" && jpeg)) {
      return res.status(400).json({
        success: false,
        message: "Upload a valid JPEG or PDF RC"
      });
    }
  }
  next();
});
router.get("/api/client/vehicles", clientAuth, vehicle.getMyVehicles);
router.post("/api/client/vehicles", clientAuth, uploadRc, vehicle.addVehicle);
router.put("/api/client/vehicles/:vehicleId", clientAuth, uploadRc, vehicle.updateVehicle);
router.patch("/api/client/vehicles/:vehicleId/status", clientAuth, vehicle.updateVehicleStatus);
router.get("/internal/vehicles/:vehicleId/tracking", internalAuth, vehicle.getVehicleForTracking);
router.get("/internal/verification/vehicles", internalAuth, review.getVehicles);
router.patch("/internal/verification/vehicles/:id", internalAuth, review.reviewVehicle);
router.get("/internal/verification/businesses", internalAuth, review.getBusinesses);
router.patch("/internal/verification/businesses/:id", internalAuth, review.reviewBusiness);

module.exports = router;
