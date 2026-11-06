const multer = require("multer");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 200 * 1024, files: 3, fields: 10, fieldSize: 10000 },
  fileFilter: (req, file, callback) => {
    if (!["application/pdf", "image/jpeg"].includes(file.mimetype)) {
      return callback(new Error("Only JPEG and PDF documents are allowed"));
    }
    callback(null, true);
  },
});

module.exports = upload;
