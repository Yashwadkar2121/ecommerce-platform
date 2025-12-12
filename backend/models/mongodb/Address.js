// models/Address.js
const mongoose = require("mongoose");

const addressSchema = new mongoose.Schema(
  {
    userId: {
      type: Number, // MySQL user id
      required: true,
      index: true,
    },
    addressType: {
      type: String,
      enum: ["home", "work", "billing", "shipping", "other"],
      default: "home",
    },
    isPrimary: {
      type: Boolean,
      default: false,
    },
    fullName: String,
    phone: String,
    addressLine1: {
      type: String,
      required: true,
    },
    addressLine2: String,
    landmark: String,
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
    },
    country: {
      type: String,
      required: true,
      default: "US",
    },
    postalCode: {
      type: String,
      required: true,
    },
    coordinates: {
      type: {
        type: String,
        enum: ["Point"],
        default: "Point",
      },
      coordinates: {
        type: [Number], // [longitude, latitude]
        default: [0, 0],
      },
    },
    instructions: String,
    isActive: {
      type: Boolean,
      default: true,
    },
    metadata: {
      type: Map,
      of: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: true,
  }
);

// Add geospatial index for location-based queries
addressSchema.index({ coordinates: "2dsphere" });
addressSchema.index({ userId: 1, isPrimary: 1 });

const Address = mongoose.model("Address", addressSchema);

module.exports = Address;
