const mongoose = require("mongoose");

const trackingSessionSchema = new mongoose.Schema(
  {
    vehicleId: {
      type: Number,
      required: true,
    },

    clientId: {
      type: Number,
      required: true,
    },

    // Tracking link ka secret directly save nahi karenge.
    tokenHash: {
      type: String,
      required: true,
      unique: true,
      select: false,
    },

    expiresAt: {
      type: Date,
      required: true,
    },

    status: {
      type: String,
      enum: ["ready", "tracking", "stopped"],
      default: "ready",
    },

    startedAt: {
      type: Date,
      default: null,
    },

    stoppedAt: {
      type: Date,
      default: null,
    },

    // Map par vehicle ki latest position dikhane ke liye.
    latestLocation: {
      latitude: {
        type: Number,
        min: -90,
        max: 90,
      },

      longitude: {
        type: Number,
        min: -180,
        max: 180,
      },

      accuracy: {
        type: Number,
        min: 0,
      },

      receivedAt: {
        type: Date,
      },
    },
  },
  {
    timestamps: true,
  }
);

trackingSessionSchema.index({ clientId: 1, createdAt: -1 });
trackingSessionSchema.index({ vehicleId: 1, createdAt: -1 });

module.exports = mongoose.model("TrackingSession",trackingSessionSchema);