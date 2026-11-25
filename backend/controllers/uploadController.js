// backend/controllers/uploadController.js
//
// Images are uploaded straight from the admin's browser to Cloudinary, so the
// files never pass through this server (important on serverless platforms,
// which limit request sizes). The server only signs the upload request, which
// proves to Cloudinary that an admin was allowed to upload.
const crypto = require("crypto");

const ALLOWED_FORMATS = "jpg,jpeg,png,webp,avif";

// GET /api/admin/uploads/signature
const getUploadSignature = (req, res) => {
  const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
  if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    return res.status(503).json({
      error: "Image uploads are not configured. Set the CLOUDINARY_* variables on the server.",
    });
  }

  const folder = process.env.CLOUDINARY_FOLDER || "ecommerce/products";
  const timestamp = Math.floor(Date.now() / 1000);

  // Cloudinary signature: parameters sorted by name, joined as key=value with
  // "&", the API secret appended, then SHA-1.
  const params = { allowed_formats: ALLOWED_FORMATS, folder, timestamp };
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  const signature = crypto
    .createHash("sha1")
    .update(toSign + CLOUDINARY_API_SECRET)
    .digest("hex");

  res.json({
    cloudName: CLOUDINARY_CLOUD_NAME,
    apiKey: CLOUDINARY_API_KEY,
    timestamp,
    folder,
    allowedFormats: ALLOWED_FORMATS,
    signature,
  });
};

module.exports = { getUploadSignature, ALLOWED_FORMATS };
