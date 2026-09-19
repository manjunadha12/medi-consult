import mongoose from "mongoose";

const healthLogSchema = new mongoose.Schema(
  {
    patientId: {
      type: String,
      required: true,
      index: true
    },

    date: {
      type: Date,
      required: true,
      default: Date.now
    },

    bp_systolic: {
      type: Number,
      default: null
    },

    bp_diastolic: {
      type: Number,
      default: null
    },

    oxygen: {
      type: Number,
      default: null
    },

    heartbeat: {
      type: Number,
      default: null
    },

    weight: {
      type: Number,
      default: null
    },

    temperature: {
      type: Number,
      default: null
    },

    sugar: {
      type: Number,
      default: null
    },

    notes: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: true
  }
);

healthLogSchema.index({ patientId: 1, date: -1 });

const HealthLog = mongoose.models.HealthLog || mongoose.model("HealthLog", healthLogSchema);
export default HealthLog;
