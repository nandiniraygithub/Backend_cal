const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  image: {
    type: String, // Store Base64 string
    required: true,
  },
  dict_of_vars: {
    type: Object, // Store additional metadata
    default: {},
  },
});

// Ensure you export the model correctly
const ImageModel = mongoose.model("Image", ImageSchema);
module.exports = ImageModel;
