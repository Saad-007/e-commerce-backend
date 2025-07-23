const express = require("express");
const {
  getHeroSlides,
  createHeroSlide,
  updateHeroSlide,
  deleteHeroSlide
} = require("../controllers/heroController");

const router = express.Router();

router.get("/", getHeroSlides);
router.post("/", createHeroSlide);
router.put("/:id", updateHeroSlide);
router.delete("/:id", deleteHeroSlide);

module.exports = router;
