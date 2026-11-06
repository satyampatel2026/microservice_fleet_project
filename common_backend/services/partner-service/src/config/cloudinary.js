const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

// File ke buffer ko seedha Cloudinary bhejo. Disk par file nahi banti.
const uploadFile = (buffer, folder, isDocument = false) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: isDocument ? "auto" : "image",
        // KYC documents public URL se access nahi honge.
        type: isDocument ? "authenticated" : "upload",
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result);
      }
    );

    stream.end(buffer);
  });
};

module.exports = { cloudinary, uploadFile };
