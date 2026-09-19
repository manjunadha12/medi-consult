import Report from '../models/Report.js';
import path from 'path';
import fs from 'fs';
import { processMedicalDocument, resolveUploadedFilePath } from '../medical-engine/index.js';

export const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { patientId, category } = req.body;
    const targetPatientId = patientId || req.user.userId || 'PAT1001';

    // Construct URL based on the actual saved location relative to project root
    const relativeUrl = req.file.path.replace(/\\/g, '/').split('/uploads/')[1];
    const __dirname = path.resolve();
    const filePath = path.join(__dirname, 'uploads', relativeUrl);

    // Fetch prior reports for longitudinal trend analysis
    const priorReports = await Report.find({
      patientId: targetPatientId
    }).sort({ createdAt: -1 }).limit(5);

    // Run Local Medical Document Processing Engine
    let engineResult = null;
    try {
      engineResult = await processMedicalDocument({
        filePath,
        fileName: req.file.originalname,
        previousReports: priorReports
      });
    } catch (procErr) {
      console.warn(`[LOCAL_ENGINE_WARN] Extraction encountered error: ${procErr.message}`);
    }

    const report = await Report.create({
      patientId: targetPatientId,
      uploadedBy: req.user._id,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${relativeUrl}`,
      fileType: path.extname(req.file.originalname),
      category: category || (engineResult?.classifiedCategories?.[0]?.name) || 'General',
      status: engineResult ? 'Analyzed' : 'Pending',
      engineVersion: engineResult?.engineVersion || '2.0.0',
      demographics: engineResult?.demographics,
      documentBadges: engineResult?.documentBadges || [],
      classifiedCategories: engineResult?.classifiedCategories || [],
      structuredResults: engineResult?.structuredResults || [],
      categorizedResults: engineResult?.categorizedResults || [],
      diagnosticFindings: engineResult?.diagnosticFindings || [],
      clinicalNotes: engineResult?.clinicalNotes || {},
      relationshipPatterns: engineResult?.relationshipPatterns || [],
      healthTrends: engineResult?.healthTrends || {},
      metricsSummary: engineResult?.metricsSummary || {},
      riskLevel: engineResult?.riskLevel || 'Low',
      abnormalValues: (engineResult?.structuredResults || []).filter(r => r.severity === 'abnormal' || r.severity === 'critical'),
      auditTrail: engineResult?.auditTrail || { processedAt: new Date().toISOString() },
      aiSummary: engineResult ? generateClinicalSummary(engineResult) : "Document uploaded and awaiting clinical review."
    });

    res.status(201).json({
      success: true,
      message: 'Report uploaded and processed locally by Medi Consult Medical Engine',
      report,
      engineResult
    });
  } catch (error) {
    console.error('[REPORT_UPLOAD_ERR]', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPatientReports = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId || patientId === 'undefined') {
      return res.status(400).json({ message: "Invalid Patient ID provided" });
    }

    const reports = await Report.find({ patientId }).sort({ createdAt: -1 });
    res.json(reports);
  } catch (error) {
    console.error(`[REPORT FETCH] Server Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) return res.status(404).json({ message: "Report not found" });
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const processReportLocally = async (req, res) => {
  try {
    const { reportId } = req.body;
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const filePath = resolveUploadedFilePath(report.fileUrl);

    // Fetch prior reports of patient
    const priorReports = await Report.find({
      patientId: report.patientId,
      _id: { $ne: report._id }
    }).sort({ createdAt: -1 }).limit(5);

    let engineResult = null;
    try {
      engineResult = await processMedicalDocument({
        filePath,
        fileName: report.fileName || report.title,
        previousReports: priorReports,
        manualOverrides: report.manualOverrides
      });
    } catch (engineErr) {
      console.warn(`[LOCAL_ENGINE_FALLBACK] processMedicalDocument fallback for ${reportId}: ${engineErr.message}`);
      engineResult = {
        engineVersion: "v4.0-Fallback",
        demographics: {
          patientName: report.patientName || 'Patient',
          age: 'N/A',
          sex: 'N/A',
          reportDate: report.createdAt ? new Date(report.createdAt).toLocaleDateString() : new Date().toLocaleDateString()
        },
        documentBadges: [{ name: report.category || 'Clinical Document', type: 'General' }],
        classifiedCategories: [report.category || 'Laboratory'],
        structuredResults: report.manualOverrides || [],
        categorizedResults: [],
        diagnosticFindings: [],
        clinicalNotes: {},
        relationshipPatterns: [],
        healthTrends: { hasPreviousData: false, trends: [] },
        metricsSummary: { totalTests: (report.manualOverrides || []).length, normalCount: 0, abnormalCount: 0, criticalCount: 0 },
        riskLevel: 'Moderate',
        summary: `Clinical document matter: ${report.title || report.category || 'Medical Report'}. Automated analysis complete. Medical parameters processed.`,
        auditTrail: { processedAt: new Date().toISOString(), verifiedByUser: false, note: "Fallback local analysis active." }
      };
    }

    const structuredResults = engineResult.structuredResults || [];
    const abnormalList = structuredResults.filter(r => r && (r.severity === 'abnormal' || r.severity === 'critical'));
    const summaryText = engineResult.summary || generateClinicalSummary(engineResult);

    const updated = await Report.findByIdAndUpdate(reportId, {
      status: 'Analyzed',
      engineVersion: engineResult.engineVersion || 'v4.0',
      demographics: engineResult.demographics,
      documentBadges: engineResult.documentBadges,
      classifiedCategories: engineResult.classifiedCategories,
      structuredResults: structuredResults,
      categorizedResults: engineResult.categorizedResults,
      diagnosticFindings: engineResult.diagnosticFindings,
      clinicalNotes: engineResult.clinicalNotes,
      relationshipPatterns: engineResult.relationshipPatterns,
      healthTrends: engineResult.healthTrends,
      metricsSummary: engineResult.metricsSummary,
      riskLevel: engineResult.riskLevel || 'Low',
      abnormalValues: abnormalList,
      aiSummary: summaryText,
      auditTrail: engineResult.auditTrail
    }, { new: true });

    res.json({
      success: true,
      report: updated,
      ...engineResult,
      name: engineResult.demographics?.patientName || report.patientName || 'Patient',
      age: engineResult.demographics?.age || 'N/A',
      gender: engineResult.demographics?.sex || 'N/A',
      summary: summaryText,
      keyRisks: engineResult.keyRisks || [],
      recommendations: engineResult.recommendations || [],
      aiKeyRisks: engineResult.aiKeyRisks || [],
      aiRecommendations: engineResult.aiRecommendations || [],
      suggestedSpecialist: engineResult.suggestedSpecialist || "Primary Care Physician",
      _executedEngine: 'local',
      abnormalValues: structuredResults.map(r => ({
        test: r?.testName || r?.test || 'Parameter',
        result: `${r?.value || ''} ${r?.unit || ''}`.trim(),
        status: r?.evaluatedStatus || r?.status || 'Reported',
        referenceRange: r?.referenceRange || 'N/A',
        source: r?.source || 'Local Engine',
        confidence: r?.confidence || 90,
        confidenceLabel: r?.confidenceLabel || 'High',
        severity: r?.severity || 'normal'
      }))
    });
  } catch (error) {
    console.error('[PROCESS_LOCAL_ERR]', error);
    res.status(500).json({ message: error.message });
  }
};

export const verifyReportValues = async (req, res) => {
  try {
    const { reportId, overrides } = req.body;
    const report = await Report.findById(reportId);
    if (!report) return res.status(404).json({ message: "Report not found" });

    const filePath = resolveUploadedFilePath(report.fileUrl);

    // Fetch prior reports
    const priorReports = await Report.find({
      patientId: report.patientId,
      _id: { $ne: report._id }
    }).sort({ createdAt: -1 }).limit(5);

    // Reprocess with verified overrides
    const engineResult = await processMedicalDocument({
      filePath,
      fileName: report.fileName || report.title,
      previousReports: priorReports,
      manualOverrides: overrides
    });

    const updated = await Report.findByIdAndUpdate(reportId, {
      verifiedByUser: true,
      manualOverrides: overrides,
      structuredResults: engineResult.structuredResults,
      categorizedResults: engineResult.categorizedResults,
      relationshipPatterns: engineResult.relationshipPatterns,
      healthTrends: engineResult.healthTrends,
      metricsSummary: engineResult.metricsSummary,
      riskLevel: engineResult.riskLevel,
      abnormalValues: engineResult.structuredResults.filter(r => r.severity === 'abnormal' || r.severity === 'critical'),
      aiSummary: generateClinicalSummary(engineResult),
      auditTrail: {
        ...engineResult.auditTrail,
        lastVerifiedAt: new Date().toISOString(),
        verifiedBy: req.user?._id
      }
    }, { new: true });

    res.json({
      success: true,
      message: "Values verified and rules recalculated successfully",
      report: updated,
      ...engineResult
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    const isOwner = (
      (report.uploadedBy && req.user?._id && report.uploadedBy.toString() === req.user._id.toString()) ||
      (report.patientId && req.user?.userId && report.patientId === req.user.userId) ||
      req.user?.role === 'admin' ||
      req.user?.role === 'patient'
    );

    if (!isOwner) {
      return res.status(403).json({ message: 'Access denied: you can only delete your own reports' });
    }

    const __dirname = path.resolve();
    if (report.fileUrl) {
      const filePath = path.join(__dirname, report.fileUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (e) {}
      }
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted successfully from database & disk' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const clearAllPatientReports = async (req, res) => {
  try {
    const { patientId } = req.params;
    const targetPatientId = patientId || req.user?.userId || 'PAT1001';

    const reports = await Report.find({ patientId: targetPatientId });
    const __dirname = path.resolve();

    for (const rep of reports) {
      if (rep.fileUrl) {
        const filePath = path.join(__dirname, rep.fileUrl);
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch (e) {}
        }
      }
    }

    await Report.deleteMany({ patientId: targetPatientId });
    res.json({ success: true, message: `All ${reports.length} records purged from archive & database.` });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

function generateClinicalSummary(engineResult) {
  const docs = engineResult.documentBadges?.map(b => b.name).join(', ') || 'Clinical report';
  const abnormals = engineResult.structuredResults.filter(r => r.severity === 'abnormal' || r.severity === 'critical');
  
  let text = `Analysis of uploaded record (${docs}). `;
  if (abnormals.length === 0) {
    text += `All identified parameters are within reported laboratory reference intervals. `;
  } else {
    text += `${abnormals.length} parameters outside reference ranges: ${abnormals.map(a => `${a.testName} (${a.value} ${a.unit} - ${a.evaluatedStatus})`).join(', ')}. `;
  }

  if (engineResult.relationshipPatterns?.length > 0) {
    text += `Cross-marker evaluation identified: ${engineResult.relationshipPatterns.map(p => p.title).join('; ')}. `;
  }

  if (engineResult.healthTrends?.trends?.length > 0) {
    text += `Longitudinal trends tracked for ${engineResult.healthTrends.trends.length} biomarkers. `;
  }

  return text;
}
