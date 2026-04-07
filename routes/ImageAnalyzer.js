const express = require("express");
const ImageModel = require("../models/ImageModel");
const axios = require("axios");
const crypto = require("crypto");
const sharp = require("sharp");
require("dotenv").config();

const router = express.Router();

// Simple in-memory cache for processed images
const imageCache = new Map();
const CACHE_SIZE_LIMIT = 100; // Limit cache size

// Ollama Qwen2.5-VL configuration
const OLLAMA_URL = "http://localhost:11434/api/chat";

// ─── IMAGE OPTIMIZATION ───
async function optimizeImage(base64Image) {
  try {
    console.log("🔧 Starting image optimization...");
    
    const buffer = Buffer.from(
      base64Image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );
    
    console.log("📏 Original buffer size:", buffer.length);

    const resized = await sharp(buffer)
      .resize(512, 512, { fit: "inside" }) // Larger for better handwriting recognition
      .sharpen({ sigma: 1, flat: 1, jagged: 2 }) // Enhance handwriting
      .jpeg({ quality: 75 })               // Better quality for text
      .toBuffer();

    const result = resized.toString("base64");
    console.log("✅ Optimization successful, result size:", result.length);
    return result;
  } catch (error) {
    console.error("❌ Image optimization failed:", error.message);
    // Return original image if optimization fails
    return base64Image;
  }
}

// ─── QWEN2.5-VL SOLVER (OPTIMIZED) ───
async function solveWithQwen(base64Image, timeoutMs = 30000) {
  // Check cache first
  const imageHash = crypto.createHash('md5').update(base64Image).digest('hex');
  if (imageCache.has(imageHash)) {
    console.log("🎯 Cache hit!");
    return imageCache.get(imageHash);
  }

  try {
    console.log("🤖 Qwen2.5-VL solving (optimized)...");

    const cleanBase64 = base64Image.includes("base64,")
      ? base64Image.split("base64,")[1]
      : base64Image;

    // Ultra-simplified prompt for guaranteed JSON
    const prompt = `Return ONLY this JSON format for the math problem in the image:

[{"expr": "expression", "result": "answer", "assign": false}]

Examples:
[{"expr": "2 + 3", "result": "5", "assign": false}]
[{"expr": "sin(30)", "result": "0.5", "assign": false}]
[{"expr": "3^2 + 4^2 = 5^2", "result": "25", "assign": false}]

Analyze and return JSON:`;


    const response = await axios.post(OLLAMA_URL, {
      model: "qwen2.5vl:3b",
      messages: [
        {
          role: "user",
          content: prompt,
          images: [cleanBase64],
        },
      ],
      stream: false,
      options: {
        temperature: 0.2, // Slightly higher for better handwriting recognition
        num_predict: 200, // More tokens for detailed analysis
        top_k: 20,        // More options for handwriting variability
        top_p: 0.5,       // Balanced sampling
        repeat_penalty: 1.1,
        mirostat: 2,
        mirostat_tau: 3.0,
        mirostat_eta: 0.2
      }
    }, { timeout: timeoutMs });

    const raw = response.data.message.content;
    
    console.log("🔍 Raw Qwen response (full):", raw);
    console.log("🔍 Response length:", raw.length);

    // Faster JSON extraction - handle list of dictionaries format
    try {
      // Try multiple JSON extraction patterns
      let jsonMatch = raw.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        jsonMatch = raw.match(/\{[\s\S]*\}/);
      }
      
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const result = Array.isArray(parsed) ? parsed : [parsed];
        
        console.log("✅ Parsed result:", result);
        
        // Cache the result
        if (imageCache.size >= CACHE_SIZE_LIMIT) {
          const firstKey = imageCache.keys().next().value;
          imageCache.delete(firstKey);
        }
        imageCache.set(imageHash, result);
        
        return result;
      }
      
      console.log("❌ No JSON found in response");
      throw new Error("No JSON found");
    } catch (parseError) {
      console.log("🔧 Parse error:", parseError.message);
      console.log("🔧 Attempting to extract from raw text...");
      
      // Try to extract any mathematical content as fallback
      const mathMatch = raw.match(/(\d+\.?\d*\s*[+\-*/=]\s*\d+\.?\d*)/);
      if (mathMatch) {
        const simpleResult = [{
          expr: mathMatch[1],
          result: "extracted_from_text",
          assign: false
        }];
        
        console.log("✅ Extracted math expression:", mathMatch[1]);
        
        // Cache the extracted result
        if (imageCache.size >= CACHE_SIZE_LIMIT) {
          const firstKey = imageCache.keys().next().value;
          imageCache.delete(firstKey);
        }
        imageCache.set(imageHash, simpleResult);
        
        return simpleResult;
      }
      
      // If no math found, return the raw text as result for debugging
      const fallbackResult = [{
        expr: "qwen_response",
        result: raw.slice(0, 200), // Show first 200 chars of raw response
        assign: false
      }];
      
      console.log("🔧 Returning raw Qwen response for debugging");
      
      // Cache fallback result too
      if (imageCache.size >= CACHE_SIZE_LIMIT) {
        const firstKey = imageCache.keys().next().value;
        imageCache.delete(firstKey);
      }
      imageCache.set(imageHash, fallbackResult);
      
      return fallbackResult;
    }

  } catch (error) {
    console.error("❌ Qwen Error:", error.message);
    
    // Quick fallback for timeout/common errors
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      const timeoutResult = [{
        expr: "timeout",
        result: "Processing took too long",
        assign: false
      }];
      
      // Cache timeout result
      if (imageCache.size >= CACHE_SIZE_LIMIT) {
        const firstKey = imageCache.keys().next().value;
        imageCache.delete(firstKey);
      }
      imageCache.set(imageHash, timeoutResult);
      
      return timeoutResult;
    }
    
    // Ultra-fast fallback
    const fallbackResult = [{
      expr: "fallback",
      result: "AI model busy",
      assign: false
    }];
    
    // Cache fallback result
    if (imageCache.size >= CACHE_SIZE_LIMIT) {
      const firstKey = imageCache.keys().next().value;
      imageCache.delete(firstKey);
    }
    imageCache.set(imageHash, fallbackResult);
    
    return fallbackResult;
  }
}

// ─── Route: POST /calculate ──────────────────────────────────────────────────

router.post("/calculate", async (req, res) => {
  try {
    const { image, imageId } = req.body;

    let base64Image;

    // Check for direct image FIRST
    if (image) {
      // Direct image processing
      console.log("📥 Processing direct image");
      base64Image = image;
    } else if (imageId) {
      // Fetch image from MongoDB
      console.log("📥 Fetching image from MongoDB with ID:", imageId);
      const imageDoc = await ImageModel.findById(imageId);
      if (!imageDoc) {
        return res.status(404).json({ error: "Image not found" });
      }
      base64Image = imageDoc.image;
    } else {
      return res.status(400).json({ error: "Either image or imageId is required" });
    }

    console.log("📥 Original image size:", base64Image.length);

    console.log("🖼️ Optimizing image...");
    const optimizedImage = await optimizeImage(base64Image);
    console.log("✅ Optimized image size:", optimizedImage.length);
    
    // Validate optimized image
    if (!optimizedImage || optimizedImage.length < 100) {
      return res.json([{
        expr: "image_error",
        result: "Image optimization failed - image too small",
        assign: false
      }]);
    }

    console.log("📤 Sending to Qwen2.5-VL (optimized)...");
    const result = await solveWithQwen(optimizedImage, 15000); // 15 seconds

    return res.json(result);

  } catch (error) {
    console.error("❌ Error:", error);
    return res.status(500).json([{
      expr: "server_error",
      result: error.message,
      assign: false
    }]);
  }
});

// Cache status endpoint
router.get("/cache-status", (req, res) => {
  res.json({
    cacheSize: imageCache.size,
    limit: CACHE_SIZE_LIMIT,
    usage: `${Math.round((imageCache.size / CACHE_SIZE_LIMIT) * 100)}%`
  });
});

// Clear cache endpoint
router.post("/clear-cache", (req, res) => {
  imageCache.clear();
  res.json({ message: "Cache cleared" });
});

module.exports = { router, solveWithQwen };