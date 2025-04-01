const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { evaluate } = require("mathjs");
const cors = require("cors");
const bodyParser = require("body-parser");
const imageRoutes = require("./routes/ImageRoute");
const calculatorRouter = require("./routes/ImageAnalyzer"); // Renamed for clarity

dotenv.config(); // Load environment variables

const app = express();

// ✅ CORS Fix: Use environment variable with fallback
const cors_uri = [process.env.CORS_ORIGIN || "https://backend-cal.vercel.app"];
app.use(
  cors({
    origin: cors_uri,
    methods: "GET, POST, PUT, DELETE, OPTIONS",
    allowedHeaders: "Content-Type, Authorization",
  })
);

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ MongoDB Connection with Better Error Handling
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
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
app.use("/", calculatorRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
