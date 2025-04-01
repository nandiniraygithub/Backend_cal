const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const { evaluate } = require('mathjs');
const cors = require("cors");
const bodyParser = require("body-parser");
const imageRoutes = require("./routes/ImageRoute");
const calculatorRouter = require("./routes/ImageAnalyzer");

dotenv.config(); // Load environment variables


const app = express();
const cors_uri =  [process.env.CORS_PORT, 'http://localhost:5173']
app.use(cors({
  origin: cors_uri, // Allow only your frontend
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization'
}));
app.options('*', cors());
app.use(bodyParser.json({ limit: "50mb" })); // Handle large Base64 images
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected Successfully!"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

  app.get("/getstatus", (req, res) => {
    res.send("Welcome to the homepage");
  });

// Use Image Processing Routes
app.use("/image", imageRoutes);

//// Calculator Route
app.use("/", calculatorRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
