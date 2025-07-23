const mongoose = require('mongoose');

const HomeContentSchema = new mongoose.Schema({
  heroBanners: [
    {
      imageUrl: String,
      link: String,
    },
  ],
  featuredCategories: [
    {
      name: String,
      imageUrl: String,
      slug: String,
    },
  ],
  topDeals: [String], // array of product IDs
  announcements: String,
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('HomeContent', HomeContentSchema);
