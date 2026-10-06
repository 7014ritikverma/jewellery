import express from "express";
import fs from "fs";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import auth from "../middleware/auth.js";
import { adminAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/security.js";

dotenv.config();

const router = express.Router();

const storage = multer.diskStorage({});
const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024,
    files: 11,
  },
  fileFilter(req, file, cb) {
    const allowedImageMimeTypes = ["image/jpeg", "image/png", "image/webp"];
    const allowedVideoMimeTypes = ["video/mp4", "video/webm", "video/quicktime"];

    if (file.fieldname === "images" && allowedImageMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    if (file.fieldname === "video" && allowedVideoMimeTypes.includes(file.mimetype)) {
      return cb(null, true);
    }

    cb(new Error("Only JPG, PNG, WEBP images and MP4, WEBM, MOV videos are allowed"));
  },
});

const productUpload = upload.fields([
  { name: "images", maxCount: 10 },
  { name: "video", maxCount: 1 },
]);
const reviewUpload = upload.fields([{ name: "images", maxCount: 5 }]);

const handleProductUpload = (req, res, next) => {
  productUpload(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      const field = err.field ? ` "${err.field}"` : "";
      const message = err.code === "LIMIT_UNEXPECTED_FILE"
        ? `Unexpected upload field${field}. Upload up to 10 images and 1 video only.`
        : err.message;

      return res.status(400).json({ message });
    }

    return res.status(400).json({ message: err.message || "Upload Error" });
  });
};

const handleReviewUpload = (req, res, next) => {
  reviewUpload(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      return res.status(400).json({ message: err.message });
    }

    return res.status(400).json({ message: err.message || "Upload Error" });
  });
};

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// A signed direct upload lets the browser send large reel videos straight to
// Cloudinary, avoiding the slower browser -> server -> Cloudinary double hop.
router.post(
  "/signature",
  adminAuth,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 60, keyPrefix: "upload-signature" }),
  (req, res) => {
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = "ecommerce/reels";
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUD_SECRET
    );

    res.json({
      cloudName: process.env.CLOUD_NAME,
      apiKey: process.env.CLOUD_KEY,
      timestamp,
      folder,
      signature,
    });
  }
);

router.post(
  "/reviews",
  auth,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20, keyPrefix: "review-upload" }),
  handleReviewUpload,
  async (req, res) => {
    const imageFiles = req.files?.images || [];

    try {
      if (!imageFiles.length) {
        return res.status(400).json("No files provided");
      }

      const uploads = await Promise.all(
        imageFiles.map((file, index) =>
          cloudinary.uploader.upload(file.path, { resource_type: "image" }).then((result) => ({
            url: result.secure_url,
            index,
          }))
        )
      );

      res.json({
        urls: uploads.sort((a, b) => a.index - b.index).map((item) => item.url),
      });
    } catch (err) {
      console.log(err);
      res.status(400).json(err.message || "Upload Error");
    } finally {
      await Promise.all(
        imageFiles.map((file) => fs.promises.unlink(file.path).catch(() => null))
      );
    }
  }
);

router.post(
  "/",
  adminAuth,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30, keyPrefix: "upload" }),
  handleProductUpload,
  async (req, res) => {
    const imageFiles = req.files?.images || [];
    const videoFile = req.files?.video?.[0];
    const allFiles = [...imageFiles, ...(videoFile ? [videoFile] : [])];

    try {
      if (!allFiles.length) {
        return res.status(400).json("No files provided");
      }

      const imageUploads = await Promise.all(
        imageFiles.map((file, index) =>
          cloudinary.uploader.upload(file.path, { resource_type: "image" }).then((result) => ({
            url: result.secure_url,
            index,
          }))
        )
      );

      const urls = imageUploads
        .sort((a, b) => a.index - b.index)
        .map((uploadResult) => uploadResult.url);

      const videoUpload = videoFile
        ? await cloudinary.uploader.upload(videoFile.path, { resource_type: "video" })
        : null;

      res.json({
        urls,
        videoUrl: videoUpload?.secure_url || "",
      });
    } catch (err) {
      console.log(err);
      res.status(400).json(err.message || "Upload Error");
    } finally {
      await Promise.all(
        allFiles.map((file) => fs.promises.unlink(file.path).catch(() => null))
      );
    }
  }
);

export default router;
