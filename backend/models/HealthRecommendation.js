import mongoose from "mongoose";

const healthRecommendationSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true
    },

    vital: {
      type: String,
      required: true
    },

    title: {
      type: String,
      required: true
    },

    message: {
      type: String,
      required: true
    },

    severity: {
      type: String,
      default: "normal"
    },

    priority: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: true
  }
);

const HealthRecommendation = mongoose.models.HealthRecommendation || mongoose.model("HealthRecommendation", healthRecommendationSchema);
export default HealthRecommendation;
