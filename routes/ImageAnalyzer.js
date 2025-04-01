const express = require("express");
const ImageModel = require("../models/ImageModel"); // Import MongoDB model
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Function to analyze a mathematical image using Google Gemini AI.
 * @param {string} base64Image - Base64-encoded image.
 * @param {Object} dictOfVars - User-defined variables to consider during analysis.
 * @returns {Promise<Array>} - Parsed response from Gemini AI.
 */
async function analyzeImage(base64Image, dictOfVars) {
  try {
    if (!base64Image) {
      throw new Error("Base64 image data is required");
    }

    const dictOfVarsStr = JSON.stringify(dictOfVars || {});
    const mimeType = "image/jpeg"; // Default to JPEG, adjust if needed

    // Gemini AI Model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // AI Prompt
    const prompt = `
    You have been given an image with some mathematical expressions, equations, or graphical problems, and you need to solve them. Note: Use the PEMDAS rule for solving mathematical expressions. PEMDAS stands for the Priority Order: Parentheses, Exponents, Multiplication and Division (from left to right), Addition and Subtraction (from left to right).

Analyze the equation or expression in this image and return the answer in one of these formats:
1. Simple math: [{"expr": "given expression", "result": "calculated answer"}]
2. Equations: [{"expr": "x", "result": 2, "assign": true}, {"expr": "y", "result": 5, "assign": true}]
3. Variable assignment: [{"expr": "variable", "result": "value", "assign": true}]
4. Graphical problems: [{"expr": "given expression", "result": "calculated answer"}]
5. Abstract concepts: [{"expr": "explanation", "result": "concept"}]

Use the following user-defined variables in your calculations: ${dictOfVarsStr}

Important:
* Extract mathematical expressions and evaluate them. Return a valid JSON array **without enclosing it in markdown or code blocks**.
* If you cannot solve a problem, provide an explanation in the "result" field.
* Assume all images are of good quality and contain only mathematical content.
* Provide detailed results.
    `;

    // Send AI Request
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
    });

    const result = await response.response;
    const resultText = await result.text();

    // Parse JSON Response
    let parsedResponse = [];
    try {
      const cleanText = resultText.replace(/```json|```/g, "").trim();
      console.log('Cleaned text:', cleanText.substring(0, 100) + '...');
      parsedResponse = JSON.parse(cleanText);
    } catch (error) {
      console.error("❌ AI response is not valid JSON:", resultText);
      parsedResponse = [{ error: "Invalid JSON response from AI", raw_response: resultText }];
    }

    console.log("✅ AI Analysis:", parsedResponse);
    return parsedResponse;
  } catch (error) {
    console.error("❌ Error analyzing image:", error);
    return [{ error: "Error processing image", message: error.message }];
  }
}

/**
 * Route: POST /calculate
 * Description: Fetches image from MongoDB and analyzes it using Gemini AI.
 */
router.post("/calculate", async (req, res) => {
  try {
    const { imageId, dictOfVars } = req.body;

    if (!imageId) {
      return res.status(400).json({ error: "imageId is required" });
    }

    // Fetch image from MongoDB
    const imageDoc = await ImageModel.findById(imageId);
    if (!imageDoc) {
      return res.status(404).json({ error: "Image not found" });
    }

    const base64Image = imageDoc.image;
    const variables = dictOfVars || imageDoc.dict_of_vars;

    console.log("📤 Retrieved image from MongoDB:", imageId);

    // Process image with AI
    const result = await analyzeImage(base64Image, variables);

    res.json({ result });

  } catch (error) {
    console.error("❌ Error in /calculate:", error);
    res.status(500).json({ error: "Failed to analyze image", message: error.message });
  }
});

module.exports = router;
