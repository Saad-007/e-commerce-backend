const mongoose = require("mongoose");

const heroSlideSchema = new mongoose.Schema({
   image: String, // base64 or image URL
  title: String,
  subtitle: String,
  ctaText: String,
  ctaLink: String,
  textPosition: String,
  textColor: String,
  overlayColor: String,
  overlayOpacity: Number,
  isActive: Boolean,
  animationType: String,
  buttonStyle: String,
}, { timestamps: true });

module.exports = mongoose.model("HeroSlide", heroSlideSchema);


