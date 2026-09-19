import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  patientId: { type: String, required: true },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  fileName: { type: String },
  fileUrl: { type: String },
  fileType: { type: String },
  category: { type: String, default: 'General' },
  aiSummary: { type: String },
  riskLevel: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Low' },
  abnormalValues: [mongoose.Schema.Types.Mixed],
  suggestedSpecialist: { type: String },
  suggestedTest: { type: String },
  precautionTips: [String],
  status: { type: String, default: 'Pending' },

  // Local Engine Output Fields
  engineVersion: { type: String, default: '2.0.0' },
  demographics: {
    patientName: String,
    age: Number,
    sex: String,
    reportDate: String,
    hospitalName: String,
    doctorName: String
  },
  documentBadges: [{
    code: String,
    name: String,
    category: String,
    icon: String
  }],
  classifiedCategories: [mongoose.Schema.Types.Mixed],
  structuredResults: [mongoose.Schema.Types.Mixed],
  categorizedResults: [mongoose.Schema.Types.Mixed],
  diagnosticFindings: [mongoose.Schema.Types.Mixed],
  clinicalNotes: mongoose.Schema.Types.Mixed,
  relationshipPatterns: [mongoose.Schema.Types.Mixed],
  healthTrends: mongoose.Schema.Types.Mixed,
  metricsSummary: mongoose.Schema.Types.Mixed,
  verifiedByUser: { type: Boolean, default: false },
  manualOverrides: [mongoose.Schema.Types.Mixed],
  auditTrail: mongoose.Schema.Types.Mixed,
  createdAt: { type: Date, default: Date.now }
});

const Report = mongoose.models.Report || mongoose.model('Report', reportSchema);
export default Report;

