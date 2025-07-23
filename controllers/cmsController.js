const HomeContent = require('../models/CMS');

exports.getHomeContent = async (req, res) => {
  try {
    let content = await HomeContent.findOne();

    if (!content) {
      // Create default document
      content = await HomeContent.create({
        heroBanners: [],
        featuredProducts: [],
        announcementText: ""
      });
    }

    res.json(content);
  } catch (error) {
    console.error("CMS fetch error:", error);
    res.status(500).json({ message: "Error fetching homepage content" });
  }
};

exports.updateHomeContent = async (req, res) => {
  try {
    const updated = await HomeContent.findOneAndUpdate({}, req.body, {
      new: true,
      upsert: true,
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: 'Error updating homepage content' });
  }
};
