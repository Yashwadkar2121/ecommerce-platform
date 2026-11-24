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

// Indexes for the product list (see ProductService.getProducts). Every list
// query filters on isActive and sorts with _id as the last key, so each index
// ends in _id. Without them MongoDB scans and sorts the whole collection on
// every page, which is what makes a 10,000-product catalogue feel slow.
productSchema.index({ isActive: 1, createdAt: -1, _id: -1 }); // default list (newest first)
productSchema.index({ isActive: 1, category: 1, createdAt: -1, _id: -1 }); // category page
productSchema.index({ isActive: 1, price: 1, _id: 1 }); // sort by price (both directions)
productSchema.index({ isActive: 1, category: 1, price: 1, _id: 1 }); // category + price
productSchema.index({ isActive: 1, category: 1, brand: 1 }); // brand filter
productSchema.index({ isActive: 1, "ratings.average": -1, _id: -1 }); // top rated
productSchema.index({ isActive: 1, name: 1, _id: 1 }); // sort by name

module.exports = mongoose.model("Product", productSchema);
