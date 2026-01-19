const HeroSlide = require("../models/HeroSlide");

// GET all hero slides (OPTIMIZED)
const getHeroSlides = async (req, res) => {
  try {
    // ⚡ SPEED FIX: Added .lean()
    // This returns plain JSON objects instead of heavy Mongoose Documents.
    // It reduces memory usage and speeds up the response time significantly.
    const slides = await HeroSlide.find().lean();
    
    // Note: If you need them in a specific order (like newest first), use:
    // const slides = await HeroSlide.find().sort({ createdAt: -1 }).lean();

    res.json({ slides });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// POST a new hero slide
const createHeroSlide = async (req, res) => {
  try {
    const newSlide = new HeroSlide(req.body);
    await newSlide.save();
    res.status(201).json(newSlide);
  } catch (err) {
    res.status(400).json({ message: "Error creating slide", error: err.message });
  }
};

// PUT update slide
const updateHeroSlide = async (req, res) => {
  try {
    const updated = await HeroSlide.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Update failed", error: err.message });
  }
};

// DELETE slide
const deleteHeroSlide = async (req, res) => {
  try {
    await HeroSlide.findByIdAndDelete(req.params.id);
    res.json({ message: "Slide deleted" });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
};

module.exports = {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide
};