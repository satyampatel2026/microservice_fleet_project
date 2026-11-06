const express = require("express");
const multer = require("multer");
const partnerAuthMiddleware = require("../middlewares/partnerAuthMiddleware");
const { getMyProfile, updateMyProfile, updateMyPhoto } = require("../controllers/partnerProfileController");

const router = express.Router();

// Memory mein temporary file; system ke folder mein save nahi hoti.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024, files: 1, fields: 4, fieldSize: 5000 },
  fileFilter: (req, file, callback) => {
    if (!["image/jpeg", "image/png"].includes(file.mimetype)) {
      return callback(new Error("Only JPEG and PNG photos are allowed"));
    }
    callback(null, true);
  },
}).single("photo");

router.get("/api/partner/profile", partnerAuthMiddleware, getMyProfile);

const uploadPhoto = (req, res, next) => {
  upload(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.code === "LIMIT_FILE_SIZE" ? "Photo must be 50 KB or smaller" : error.message,
      });
    }
    next();
  });
};

router.put("/api/partner/profile", partnerAuthMiddleware, uploadPhoto, updateMyProfile);
router.post("/api/partner/profile/photo", partnerAuthMiddleware, uploadPhoto, updateMyPhoto);

module.exports = router;
