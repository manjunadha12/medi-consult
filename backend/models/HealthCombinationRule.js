import mongoose from "mongoose";

const conditionSchema = new mongoose.Schema(
  {
    vital: {
      type: String,
      required: true
    },

    trend: {
      type: String,
      default: null
    },

    condition: {
      type: String,
      default: null
    },

    value: {
      type: Number,
      default: null
    }
  },
  { _id: false }
);


const healthCombinationRuleSchema =
  new mongoose.Schema(
    {
      code: {
        type: String,
        required: true,
        unique: true,
        index: true
      },

      name: {
        type: String,
        required: true
      },

      conditions: {
        type: [conditionSchema],
        required: true
      },

      severity: {
        type: String,
        enum: [
          "normal",
          "low",
          "medium",
          "high",
          "critical"
        ],
        default: "normal"
      },

      priority: {
        type: Number,
        default: 1
      },

      title: {
        type: String,
        required: true
      },

      analysis: {
        type: String,
        required: true
      },

      possibleAssociation: {
        type: String,
        default: ""
      },

      precautions: {
        type: [String],
        default: []
      },

      lifestyle: {
        type: [String],
        default: []
      },

      sleepRecommendation: {
        type: mongoose.Schema.Types.Mixed,
        default: null
      }
    },

    {
      timestamps: true
    }
  );

const HealthCombinationRule = mongoose.models.HealthCombinationRule || mongoose.model("HealthCombinationRule", healthCombinationRuleSchema);
export default HealthCombinationRule;
