// import express from "express";
// import multer from "multer";
// import cloudinary from "../config/cloudinary.js";

// const router = express.Router();

// // Storage (temporary)
// const storage = multer.diskStorage({});
// const upload = multer({ storage });

// // 👇 multiple images (max 5 ya 10)
// router.post("/upload", upload.array("images", 5), async (req, res) => {
//   try {
//     const urls = [];

//     for (let file of req.files) {
//       const result = await cloudinary.uploader.upload(file.path);
//       urls.push(result.secure_url);
//     }

//     res.json({ urls });
//   } catch (err) {
//     res.status(500).json("Upload error");
//   }
// });

// export default router;

import express from "express";
import multer from "multer";
import cloudinary from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

const storage = multer.diskStorage({});
const upload = multer({ storage });

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

router.post("/", upload.any(), async (req, res) => {
  try {
    const uploads = await Promise.all(
      req.files.map((file, index) =>
        cloudinary.uploader.upload(file.path).then(result => ({
          url: result.secure_url,
          index
        }))
      )
    );

    // 🔥 SORT BY ORIGINAL ORDER
    const sorted = uploads.sort((a, b) => a.index - b.index);

    const urls = sorted.map(u => u.url);

    res.json({ urls });

  } catch (err) {
    console.log(err);
    res.status(500).json("Upload Error ❌");
  }
});

export default router;