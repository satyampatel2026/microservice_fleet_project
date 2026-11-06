const mongoose = require("mongoose");

const locationPointSchema = new mongoose.Schema(
  {
    sessionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "TrackingSession",
      required: true,
    },

    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90,
    },

    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180,
    },

    // Browser ki estimated accuracy, metres mein.
    accuracy: {
      type: Number,
      required: true,
      min: 0,
    },

    receivedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

locationPointSchema.index({ sessionId: 1, receivedAt: 1 });

module.exports = mongoose.model("LocationPoint",locationPointSchema);