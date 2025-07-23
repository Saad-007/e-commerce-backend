const mongoose = require("mongoose");


const variantSchema = new mongoose.Schema({
  id: String,
  color: String,
  size: String,
  stock: Number,
  price: Number,
  sku: String,
});

const productSchema = new mongoose.Schema({
  featured: {
    type: Boolean,
    default: false
  },

  id: String,
  name: String,
  category: String,
  price: Number,
  offerPrice: Number,
  description: String,
  quantity: Number,
    sold: {
      type: Number,
      default: 0,
    },
  salesCount: {
    type: Number,
    default: 0,
  },
  variants: [variantSchema],
  tags: [String],
  image: String, // base64
   images: [String],        // ✅ ADD THIS LINE to support multiple images
  status: Boolean,
  weight: Number,
  dimensions: {
    length: Number,
    width: Number,
    height: Number,
  },
  shipping: {
    weight: Number,
    dimensions: {
      length: Number,
      width: Number,
      height: Number,
    },
    methods: [
      {
        type: { type: String },
        price: Number,
      },
    ],
    processingTime: String,
  },
  createdAt: String,
});

module.exports = mongoose.model("Product", productSchema);
