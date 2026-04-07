const express = require("express");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const router = express.Router();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

/**
 * Convert text to image using canvas, then analyze with Gemini
 */
router.post("/analyze-text", async (req, res) => {
  try {
    const { text, dictOfVars } = req.body;

    if (!text) {
      return res.status(400).json({ error: "Text is required" });
    }

    console.log("📝 Received text:", text);

    // Create image from text using Canvas API
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(800, 200);
    const ctx = canvas.getContext('2d');

    // Set background and text properties
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, 800, 200);
    ctx.fillStyle = 'black';
    ctx.font = '48px Arial';
    ctx.fillText(text, 50, 100);

    // Convert canvas to base64
    const base64Image = canvas.toDataURL('image/png');
    console.log("🖼️ Text converted to image");

    // Analyze the generated image with Gemini
    const result = await analyzeImageWithGemini(base64Image, dictOfVars);

    res.json({ 
      originalText: text,
      imageGenerated: true,
      result 
    });

  } catch (error) {
    console.error("❌ Error in /analyze-text:", error);
    res.status(500).json({ error: "Failed to process text", message: error.message });
  }
});

/**
 * Analyze image with Gemini AI
 */
async function analyzeImageWithGemini(base64Image, dictOfVars) {
  try {
    if (!base64Image) {
      throw new Error("Base64 image data is required");
    }

    const dictOfVarsStr = JSON.stringify(dictOfVars || {});
    
    // Remove data URL prefix for Gemini
    const cleanBase64 = base64Image.split(",")[1];

    console.log("🔍 Processing generated image");

    // Gemini AI Model - use gemini-3-flash-preview
    const model = genAI.getGenerativeModel({
      model: "gemini-3-flash-preview",
      generationConfig: {
        temperature: 0.1,
        topK: 1,
        topP: 1,
        maxOutputTokens: 200
      }
    });

    // AI Prompt - Expert AI format
    const prompt = `You are an expert AI that analyzes images containing mathematical expressions, physics problems, or diagrams drawn by users.

Your task is to:

1. Identify the type of problem
2. Extract relevant values (distance, angle, variables, etc.)
3. Solve step-by-step internally
4. Return ONLY the final structured result

---

### TYPES OF PROBLEMS (ONLY ONE WILL APPLY)

1. BASIC MATH:
   Example: 2 + 3 * 4
   Return:
   [{"expr": "2 + 3 * 4", "result": 14}]

---

2. EQUATIONS (Solve variables):
   Example: x^2 + 2x + 1 = 0
   Return:
   [{"expr": "x", "result": -1, "assign": true}]

---

3. VARIABLE ASSIGNMENT:
   Example: x = 4
   Return:
   [{"expr": "x", "result": 4, "assign": true}]

---

4. GEOMETRY / PHYSICS (IMPORTANT):

These include:

* triangles
* height/distance problems
* projectile motion
* angle-based problems

Extract:

* distances
* angles
* heights
* known constants (like gravity if needed)

Use formulas such as:

* distance formula
* trigonometry (sin, cos, tan)
* projectile motion equations

Example:
If a triangle has base = 4√3 and angle = 30°, and eye height = 1.6m

Return:
[{"expr": "height of tree", "result": 5.6}]

---

5. GRAPHICAL / WORD PROBLEMS:
   Interpret drawing and compute final answer

---

6. ABSTRACT DRAWINGS:
   Return meaning of drawing

---

### IMPORTANT RULES

* Follow PEMDAS for math
* Always return LIST of DICTIONARIES
* Keys must be: "expr", "result", optional "assign"
* Do NOT include explanations
* Do NOT use markdown or backticks
* Use proper Python dictionary format (for ast.literal_eval)

---

### VARIABLE USAGE

Use this dictionary if variables appear: ${dictOfVarsStr}

---

Now analyze the image and return the correct structured answer.`;

    // Send AI Request
    const response = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType: "image/png",
                data: cleanBase64,
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
      parsedResponse = JSON.parse(cleanText);
      
      // Add assign property to each answer (matching Python logic)
      parsedResponse = parsedResponse.map(answer => {
        if (answer.assign) {
          answer.assign = true;
        } else {
          answer.assign = false;
        }
        return answer;
      });
      
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

module.exports = router;
