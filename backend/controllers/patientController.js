import User from '../models/User.js';
import PatientProfile from '../models/PatientProfile.js';
import Prescription from '../models/Prescription.js';
import DoctorReview from '../models/DoctorReview.js';
import Appointment from '../models/Appointment.js';
import Complaint from '../models/Complaint.js';

export const getPatientProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`[PROFILE_NODE] Sync Request for ID: ${userId} (Requested by: ${req.user?.name})`);

    if (!userId || userId === 'undefined') {
       return res.status(400).json({ message: 'Invalid identity node parameter' });
    }

    // [SEC] IDOR check: only owner, doctors, or admins may read this profile
    if (
      req.user.patientId !== userId &&
      req.user.role !== 'admin' &&
      req.user.role !== 'doctor'
    ) {
      return res.status(403).json({ message: 'Access denied: insufficient privileges' });
    }

    const user = await User.findOne({ patientId: userId });

    if (!user) {
      console.log(`[PROFILE] Error: User node not found for ${userId}`);
      return res.status(404).json({ message: 'User not found' });
    }

    const profile = await PatientProfile.findOne({ userId: user._id });
    console.log(`[PROFILE] Success: Profile synchronized for ${user.name}`);

    res.json({
      name: user.name,
      email: user.email,
      phone: user.phone,
      patientId: user.patientId,
      profilePicture: user.profilePicture,
      ...profile?._doc
    });
  } catch (error) {
    console.error(`[PROFILE] Server Error: ${error.message}`);
    res.status(500).json({ message: error.message });
  }
};

export const updatePatientProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, phone, age, gender, bloodGroup, address, allergies, medicalHistory, profilePicture } = req.body;

    // [SEC] IDOR check: only owner or admin may update this profile
    if (req.user.patientId !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied: you can only update your own profile' });
    }

    const updateFields = { name, phone };
    if (profilePicture) updateFields.profilePicture = profilePicture;

    const user = await User.findOneAndUpdate(
      { patientId: userId },
      updateFields,
      { new: true }
    );

    await PatientProfile.findOneAndUpdate(
      { userId: user._id },
      { age, gender, bloodGroup, address, allergies, medicalHistory },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientPrescriptions = async (req, res) => {
  try {
    const patientId = req.user.patientId;
    if (!patientId) {
      return res.status(400).json({ message: 'User is not registered as a patient.' });
    }
    const prescriptions = await Prescription.find({ patientId }).sort({ createdAt: -1 });
    res.json(prescriptions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deletePrescription = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id);
    if (!prescription) {
      return res.status(404).json({ message: 'Prescription not found' });
    }
    // Check if patient owns this prescription
    if (prescription.patientId !== req.user.patientId && req.user.role !== 'admin') {
      return res.status(401).json({ message: 'Not authorized to delete this record' });
    }
    await Prescription.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Prescription removed from archive' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addDoctorReview = async (req, res) => {
  try {
    const { doctorId, appointmentId, rating, comment } = req.body;
    const patientId = req.user.patientId;

    if (!patientId) {
      return res.status(400).json({ message: 'Patient identity not synchronized.' });
    }

    const reviewId = `REV-${Date.now()}`;

    // Fetch names for denormalization
    const doctor = await User.findOne({ doctorId });

    const review = await DoctorReview.create({
      reviewId,
      patientId,
      patientName: req.user.name,
      doctorId,
      doctorName: doctor?.name || 'Specialist Node',
      appointmentId,
      rating,
      reviewComment: comment,
      status: 'Published' // Auto-publish for dev
    });

    res.status(201).json({ success: true, message: 'Review successfully submitted to clinical registry.', review });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const raiseComplaint = async (req, res) => {
  try {
    const { appointmentId, doctorId, doctorName, patientId, category, description, urgency } = req.body;
    
    const pId = patientId || req.user?.patientId || req.user?._id;
    const pName = req.user?.name || 'Patient';

    let dName = doctorName;
    if (!dName && doctorId) {
      const docUser = await User.findOne({ $or: [{ doctorId }, { _id: doctorId }] });
      if (docUser) dName = docUser.name;
    }

    const complaint = new Complaint({
      appointmentId: appointmentId || '',
      patientId: pId,
      patientName: pName,
      doctorId: doctorId || '',
      doctorName: dName || 'Assigned Specialist',
      category: category || 'Billing / Payment Issue',
      description,
      urgency: urgency || 'Normal',
      status: 'Pending Review'
    });

    await complaint.save();
    console.log(`[COMPLAINT_PERSISTED] Complaint ${complaint.complaintId} created by ${pName} for Appt=${appointmentId}`);

    res.status(201).json({
      success: true,
      message: "Complaint registered with Governance Registry.",
      complaint
    });
  } catch (error) {
    console.error('[RAISE_COMPLAINT_ERROR]:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPatientComplaints = async (req, res) => {
  try {
    const pId = req.user?.patientId || req.user?._id;
    const query = { patientId: pId };
    
    if (req.query.appointmentId) {
      query.appointmentId = req.query.appointmentId;
    }

    const complaints = await Complaint.find(query).sort({ createdAt: -1 });
    res.json({ success: true, complaints });
  } catch (error) {
    console.error('[GET_PATIENT_COMPLAINTS_ERR]:', error);
    res.status(500).json({ message: error.message });
  }
};
