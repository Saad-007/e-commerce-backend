require("dotenv").config();
const mongoose = require("mongoose");
const Product = require("../models/Product");

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);

    const result = await Product.updateMany(
      {
        $or: [
          { salesCount: { $exists: false } },
          { salesCount: 0 },
          { salesCount: null },
          { salesCount: "" },
          { salesCount: "0" }
        ],
        sold: { $gte: 0 }
      },
      [{ $set: { salesCount: "$sold" } }]
    );

    console.log("Backfill complete:", result.modifiedCount, "products updated.");
    process.exit();
  } catch (err) {
    console.error("Backfill error:", err);
    process.exit(1);
  }
}

run();
