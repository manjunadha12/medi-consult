import Report from '../models/Report.js';
import path from 'path';
import fs from 'fs';

export const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { patientId, category } = req.body;

    const report = await Report.create({
      patientId: patientId || 'PAT1001',
      uploadedBy: req.user._id,
      fileName: req.file.originalname,
      fileUrl: `/uploads/${req.file.filename}`,
      fileType: path.extname(req.file.originalname),
      category: category || 'General',
      status: 'Analyzing...' // Set initial status to Analyzing
    });

    res.status(201).json({
      success: true,
      message: 'Report uploaded successfully',
      report
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientReports = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId || patientId === 'undefined') {
      console.error(`[REPORT FETCH] Error: patientId is invalid (${patientId})`);
      return res.status(400).json({ message: "Invalid Patient ID provided" });
    }

    console.log(`[REPORT FETCH] Searching reports for ID: ${patientId}`);
    const reports = await Report.find({ patientId }).sort({ createdAt: -1 });
    console.log(`[REPORT FETCH] Found ${reports.length} reports for ${patientId}`);

    res.json(reports);
  } catch (error) {
    console.error(`[REPORT FETCH] Server Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const deleteReport = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id);
    if (!report) {
      return res.status(404).json({ message: 'Report not found' });
    }

    // [SEC] IDOR check: only the uploader or an admin may delete this report
    if (
      report.uploadedBy.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({ message: 'Access denied: you can only delete your own reports' });
    }

    const __dirname = path.resolve();
    const filePath = path.join(__dirname, report.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await Report.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Report deleted successfully' });
  } catch (error) {
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

