import mongoose from 'mongoose';
import User from '../models/User.js';

// Pre-register model
import '../models/ClinicalDiagnosis.js';

export const createDiagnosis = async (req, res) => {
  try {
    const ClinicalDiagnosis = mongoose.model('ClinicalDiagnosis');
    const {
      patientId: rawPatientId, patientName: rawPatientName, diagnosis, chiefComplaint, symptoms, clinicalFindings,
      reportSummary, reportInterpretation, doctorsNotes, treatmentPlan,
      medicationsPrescribed, medicationsText, recommendedTests, followUpInstructions, nextReviewDate,
      consultationDate
    } = req.body;

    // Resolve patient canonical profile
    let patientId = (rawPatientId || '').trim();
    let patientName = rawPatientName;

    const patientUser = await User.findOne({
      $or: [
        { patientId: patientId.toUpperCase() },
        { patientId: patientId },
        ...(mongoose.Types.ObjectId.isValid(patientId) ? [{ _id: patientId }] : [])
      ]
    });

    if (patientUser) {
      patientId = patientUser.patientId || patientUser._id.toString();
      patientName = patientUser.name || patientName;
    }

    let attachments = [];
    if (req.files) {
      attachments = req.files.map(file => ({
        name: file.originalname,
        url: `/uploads/${file.filename}`,
        fileType: file.mimetype
      }));
    }

    const doctorId = req.user.doctorId || req.user._id.toString();
    const doctorName = req.user.name;

    const newDiagnosis = new ClinicalDiagnosis({
      doctorId,
      doctorName,
      patientId,
      patientName: patientName || 'Patient',
      diagnosis,
      chiefComplaint,
      symptoms,
      clinicalFindings,
      reportSummary,
      reportInterpretation,
      doctorsNotes,
      treatmentPlan,
      medicationsPrescribed: Array.isArray(medicationsPrescribed) ? medicationsPrescribed : [],
      medicationsText,
      recommendedTests,
      followUpInstructions,
      nextReviewDate: nextReviewDate || null,
      consultationDate: consultationDate || Date.now(),
      attachments
    });

    await newDiagnosis.save();
    console.log(`[DIAGNOSIS_CREATE] Node created for patient: ${patientId} by doctor: ${doctorId}`);

    res.status(201).json({ success: true, message: 'Diagnosis record established', data: newDiagnosis });
  } catch (error) {
    console.error('[DIAGNOSIS_CREATE_ERROR]:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPatientDiagnosisHistory = async (req, res) => {
  try {
    const ClinicalDiagnosis = mongoose.model('ClinicalDiagnosis');
    let rawId = req.params.patientId?.trim();

    if (!rawId || rawId === 'undefined' || rawId === 'null') {
      if (req.user?.role === 'patient') {
        rawId = req.user.patientId || req.user._id?.toString();
      } else {
        return res.json([]);
      }
    }

    console.log(`[DIAGNOSIS_SYNC] Fetching history for patient key: ${rawId}`);

    const isMongo = mongoose.Types.ObjectId.isValid(rawId);
    const user = await User.findOne({
      $or: [
        { patientId: rawId.toUpperCase() },
        { patientId: rawId },
        ...(isMongo ? [{ _id: rawId }] : [])
      ]
    });

    const searchIds = [rawId, rawId.toUpperCase(), rawId.toLowerCase()];
    if (user?.patientId) searchIds.push(user.patientId, user.patientId.toUpperCase());
    if (user?._id) searchIds.push(user._id.toString());

    const history = await ClinicalDiagnosis.find({
      patientId: { $in: searchIds }
    }).sort({ consultationDate: -1, createdAt: -1 }).lean();

    return res.json(history || []);
  } catch (error) {
    console.error(`[DIAGNOSIS_FATAL_ERROR]:`, error);
    return res.status(500).json({ success: false, message: "Internal diagnostic ledger failure" });
  }
};

export const getDoctorDiagnosisHistory = async (req, res) => {
  try {
    const ClinicalDiagnosis = mongoose.model('ClinicalDiagnosis');
    const rawDoctorId = req.params.doctorId?.trim();

    let searchIds = [rawDoctorId];
    const isMongo = mongoose.Types.ObjectId.isValid(rawDoctorId);
    const doctorUser = await User.findOne({
      $or: [
        { doctorId: rawDoctorId },
        { doctorId: rawDoctorId?.toUpperCase() },
        ...(isMongo ? [{ _id: rawDoctorId }] : [])
      ]
    });

    if (doctorUser?.doctorId) searchIds.push(doctorUser.doctorId, doctorUser.doctorId.toUpperCase());
    if (doctorUser?._id) searchIds.push(doctorUser._id.toString());

    const history = await ClinicalDiagnosis.find({
      doctorId: { $in: searchIds }
    }).sort({ consultationDate: -1, createdAt: -1 }).lean();

    res.json(history || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLatestDiagnosis = async (req, res) => {
  try {
    const ClinicalDiagnosis = mongoose.model('ClinicalDiagnosis');
    const { id } = req.params;
    const updates = req.body;

    const existing = await ClinicalDiagnosis.findById(id);
    if (!existing) return res.status(404).json({ message: 'Record not found' });

    const prevValues = {
      diagnosis: existing.diagnosis,
      treatmentPlan: existing.treatmentPlan,
      doctorsNotes: existing.doctorsNotes
    };

    existing.editHistory.push({
      updatedBy: req.user.name,
      previousValues: prevValues
    });

    Object.assign(existing, updates);

    await existing.save();
    res.json({ success: true, message: 'Diagnosis node updated', data: existing });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDiagnosisById = async (req, res) => {
  try {
    const ClinicalDiagnosis = mongoose.model('ClinicalDiagnosis');
    const diagnosis = await ClinicalDiagnosis.findById(req.params.id);
    if (!diagnosis) return res.status(404).json({ message: 'Record not found' });
    res.json(diagnosis);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
