const express = require("express");
const multer = require("multer");
const ImageModel = require("../models/ImageModel"); // Ensure this path is correct

const router = express.Router();

// Multer setup for handling image uploads (storing in memory)
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

router.post("/", upload.single("image"), async (req, res) => {
  try {
    let imageBuffer;

    if (req.file) {
      imageBuffer = req.file.buffer;
      console.log("📥 Image received via file upload");
    } else if (req.body.image) {
      try {
        const base64Data = req.body.image.includes(",")
          ? req.body.image.split(",")[1]
          : req.body.image;
        imageBuffer = Buffer.from(base64Data, "base64");
        console.log("📥 Image received via base64");
      } catch (error) {
        console.error("❌ Base64 parsing error:", error);
        return res.status(400).json({ message: "Invalid base64 format", status: "error" });
      }
    } else {
      return res.status(400).json({ message: "No image provided", status: "error" });
    }

    if (!imageBuffer || imageBuffer.length === 0) {
      return res.status(400).json({ message: "Invalid image data", status: "error" });
    }

    // Convert image to Base64
    const base64Image = imageBuffer.toString("base64");

    // Store image in MongoDB (Corrected usage)
    const savedImage = await ImageModel.create({
      image: base64Image,
      dict_of_vars: {}, // Empty initially, can be updated later
    });

    console.log("✅ Image stored in MongoDB:", savedImage._id);

    return res.json({
      message: "Image stored successfully",
      status: "success",
      imageId: savedImage._id, // Return the MongoDB document ID
    });
  } catch (error) {
    console.error("❌ Error processing request:", error);
    return res.status(500).json({ message: "Server error", status: "error" });
  }
});

module.exports = router;