const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      required: true,
    },
    subcategory: {
      type: String,
    },
    brand: {
      type: String,
      required: true,
    },
    images: [
      {
        type: String,
      },
    ],
    inventory: {
      type: Number,
      required: true,
      min: 0,
    },
    attributes: {
      type: Map,
      of: String,
    },
    tags: [String],
    isActive: {
      type: Boolean,
      default: true,
    },
    ratings: {
      average: {
        type: Number,
        default: 0,
      },
      count: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ name: "text", description: "text", brand: "text" });
productSchema.index({ category: 1, price: 1 });
productSchema.index({ "ratings.average": -1 });

module.exports = mongoose.model("Product", productSchema);
