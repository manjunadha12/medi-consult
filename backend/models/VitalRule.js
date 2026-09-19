import mongoose from "mongoose";

const vitalRuleSchema = new mongoose.Schema(
  {
    vital: {
      type: String,
      required: true,
      index: true
    },

    label: {
      type: String,
      required: true
    },

    min: {
      type: Number,
      default: null
    },

    max: {
      type: Number,
      default: null
    },

    status: {
      type: String,
      required: true
    },

    severity: {
      type: String,
      enum: ["normal", "low", "medium", "high", "critical"],
      default: "normal"
    },

    scorePenalty: {
      type: Number,
      default: 0
    },

    recommendationCode: {
      type: String,
      required: true
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

vitalRuleSchema.index({ vital: 1, priority: -1 });

const VitalRule = mongoose.models.VitalRule || mongoose.model("VitalRule", vitalRuleSchema);
export default VitalRule;
