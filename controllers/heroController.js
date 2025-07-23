const HeroSlide = require("../models/HeroSlide");

// GET all hero slides
const getHeroSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find();
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
