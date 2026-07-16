import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { protect } from "../middlewares/auth.js";
import { adminOnly } from "../middlewares/admin.js";

const router = express.Router();

// Ensure uploads directory exists
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, uploadDir);
  },
  filename(req, file, cb) {
    cb(
      null,
      `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`
    );
  },
});

function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png|webp/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error("Only images (jpg, jpeg, png, webp) are allowed!"));
  }
}

import { uploadToCloudinary } from "../utils/cloudinary.js";

const upload = multer({
  storage,
  fileFilter(req, file, cb) {
    checkFileType(file, cb);
  },
});

router.post("/", protect, adminOnly, upload.single("image"), async (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  const localFilePath = req.file.path;

  try {
    // If Cloudinary credentials are set up, upload to Cloudinary
    if (
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    ) {
      const result = await uploadToCloudinary(localFilePath, "aevum_uploads");
      
      // Remove temporary file from local server
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
      }

      return res.status(201).json({
        message: "Image uploaded successfully to Cloudinary",
        url: result.secure_url,
      });
    }

    // Fallback: Local upload path served to the client
    const filePath = `/uploads/${req.file.filename}`;
    res.status(201).json({
      message: "Image uploaded successfully to local storage (Cloudinary credentials missing)",
      url: filePath,
    });
  } catch (error) {
    // Clean up local file in case of error
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
    }
    next(error);
  }
});

export default router;
