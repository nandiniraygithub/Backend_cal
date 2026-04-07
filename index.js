const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { evaluate } = require("mathjs");
const cors = require("cors");
const bodyParser = require("body-parser");
const imageRoutes = require("./routes/ImageRoute");
const { router: calculatorRouter } = require("./routes/ImageAnalyzer"); // Renamed for clarity
const textToImageRoute = require("./routes/TextToImageRoute");

dotenv.config(); // Load environment variables

const app = express();

// ✅ CORS Fix: Use environment variable with fallback
// const cors_uri = [process.env.CORS_ORIGIN || "https://ai-calc-fe.netlify.app/"];
app.use(
  cors({
    origin:['*',"https://ai-calc-fe.netlify.app","http://localhost:5173"] ,
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
    credentials: true,
  })
);

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.send(200);
});

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ MongoDB Connection with Better Error Handling
if (!process.env.MONGO_URI) {
  console.error("❌ MONGO_URI environment variable is not set");
  process.exit(1);
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => {
    console.error("❌ MongoDB Connection Failed:", err);
    process.exit(1); // Exit the process on failure
  });

// ✅ Status Route
app.get("/getstatus", (req, res) => {
  res.send("Welcome to the homepage");
});

// ✅ Routes
app.use("/image", imageRoutes);

// Debug middleware for calculator routes
app.use((req, res, next) => {
  if (req.path === '/calculate' && req.method === 'POST') {
    console.log('🔍 Debug - Request to /calculate:', {
      method: req.method,
      path: req.path,
      body: req.body,
      headers: req.headers
    });
  }
  next();
});

app.use("/", calculatorRouter);
app.use("/text", textToImageRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
