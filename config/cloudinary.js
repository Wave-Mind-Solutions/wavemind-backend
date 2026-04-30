/**
 * Cloudinary configuration for file uploads
 */
const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ── Storage engine – stores files directly to Cloudinary ──────────────────
const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    // Determine folder and resource type from mimetype
    let folder = "wavemind/misc";
    let resourceType = "auto";

    if (file.mimetype.startsWith("image/")) {
      folder = "wavemind/designs";
    } else if (
      file.mimetype === "application/pdf" ||
      file.mimetype.includes("document")
    ) {
      folder = "wavemind/reports";
    } else {
      folder = "wavemind/code";
      resourceType = "raw"; // raw for non-media files
    }

    return {
      folder,
      resource_type: resourceType,
      allowed_formats: [
        "jpg",
        "jpeg",
        "png",
        "gif",
        "svg",
        "pdf",
        "doc",
        "docx",
        "zip",
        "rar",
        "txt",
        "js",
        "ts",
        "py",
        "java",
        "html",
        "css",
        "json",
        "xml",
      ],
    };
  },
});

// ── File filter ────────────────────────────────────────────────────────────
const fileFilter = (_req, file, cb) => {
  const allowedMimes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/svg+xml",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/zip",
    "application/x-rar-compressed",
    "text/plain",
    "text/javascript",
    "application/json",
    "text/html",
    "text/css",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
});

module.exports = { upload, cloudinary };
