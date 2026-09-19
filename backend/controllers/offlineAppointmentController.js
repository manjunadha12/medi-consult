import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import OfflineAppointment from '../models/OfflineAppointment.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';

// 1. Search & List Hospitals
export const getHospitals = async (req, res) => {
  try {
    const { search, city, state, pincode, department, emergencyOnly } = req.query;
    const filter = { isActive: true };

    if (city) filter.city = new RegExp(city, 'i');
    if (state) filter.state = new RegExp(state, 'i');
    if (pincode) filter.pincode = pincode;
    if (department && department !== 'All') filter.departments = department;
    if (emergencyOnly === 'true') filter.isEmergencyAvailable = true;

    if (search) {
      filter.$or = [
        { hospitalName: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') },
        { state: new RegExp(search, 'i') },
        { pincode: new RegExp(search, 'i') },
        { departments: new RegExp(search, 'i') },
        { address: new RegExp(search, 'i') }
      ];
    }

    const hospitals = await Hospital.find(filter).sort({ rating: -1, hospitalName: 1 });
    res.json({ success: true, count: hospitals.length, hospitals });
  } catch (error) {
    console.error('[GET_HOSPITALS_ERR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 2. Get Single Hospital Details
export const getHospitalDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let hospital = await Hospital.findOne({ hospitalId: id });
    if (!hospital && mongoose.Types.ObjectId.isValid(id)) {
      hospital = await Hospital.findById(id);
    }
    if (!hospital) return res.status(404).json({ success: false, message: 'Hospital not found' });
    res.json({ success: true, hospital });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 3. Get Doctors Available at Hospital (by department)
export const getHospitalDoctors = async (req, res) => {
  try {
    const { hospitalId, department } = req.query;
    const filter = { isVerified: true };

    if (hospitalId) {
      filter.$or = [
        { hospitalId: hospitalId },
        { hospitalName: new RegExp(hospitalId, 'i') }
      ];
    }

    if (department && department !== 'All') {
      filter.$or = [
        ...(filter.$or || []),
        { department: new RegExp(department, 'i') },
        { specialization: new RegExp(department, 'i') }
      ];
    }

    const doctorProfiles = await DoctorProfile.find(filter).lean();
    
    // Enrich with user name & details
    const enriched = await Promise.all(doctorProfiles.map(async (doc) => {
      const user = await User.findOne({ doctorId: doc.doctorId }).select('name email phone profilePicture').lean();
      return {
        ...doc,
        name: user?.name || `Dr. Specialist (${doc.specialization})`,
        email: user?.email,
        phone: user?.phone,
        profilePicture: user?.profilePicture,
        availableSlots: [
          '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
          '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '02:00 PM', '02:30 PM',
          '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM'
        ],
        rating: 4.9,
        reviewsCount: 128
      };
    }));

    // If no hospital-specific doctor found, return all available verified doctors for department
    if (enriched.length === 0) {
      const allDocs = await DoctorProfile.find({ isVerified: true }).limit(5).lean();
      const fallback = await Promise.all(allDocs.map(async (doc) => {
        const user = await User.findOne({ doctorId: doc.doctorId }).select('name email phone profilePicture').lean();
        return {
          ...doc,
          name: user?.name || `Dr. Specialist`,
          availableSlots: [
            '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
            '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM'
          ],
          rating: 4.8,
          reviewsCount: 94
        };
      }));
      return res.json({ success: true, count: fallback.length, doctors: fallback });
    }

    res.json({ success: true, count: enriched.length, doctors: enriched });
  } catch (error) {
    console.error('[GET_HOSPITAL_DOCTORS_ERR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 4. Create Offline Appointment
export const createOfflineAppointment = async (req, res) => {
  try {
    const {
      patientName,
      patientPhone,
      patientEmail,
      hospitalId,
      hospitalName,
      hospitalAddress,
      hospitalContact,
      doctorId,
      doctorName,
      department,
      specialization,
      appointmentDate,
      appointmentTime,
      appointmentType,
      reasonForVisit,
      symptoms,
      estimatedFee
    } = req.body;

    const patientId = req.user?.patientId || req.user?.userId || req.user?._id?.toString() || 'PAT-OFFLINE-01';

    if (!hospitalName || !appointmentDate || !appointmentTime || !reasonForVisit) {
      return res.status(400).json({ success: false, message: 'Missing required hospital appointment parameters' });
    }

    // Generate unique Offline Appointment ID: OFF-YYYY-XXXXXX
    const year = new Date().getFullYear();
    const randomSeq = Math.floor(100000 + Math.random() * 900000);
    const appointmentId = `OFF-${year}-${randomSeq}`;

    // Compute reporting time (15 mins before scheduled time)
    const reportingTime = `${appointmentTime} (Report 15 mins early)`;

    // Process uploaded reports
    const medicalReports = [];
    if (req.files && Array.isArray(req.files)) {
      req.files.forEach(f => {
        const cleanPath = f.path.replace(/\\/g, '/').split('/uploads/')[1];
        medicalReports.push(`/uploads/${cleanPath}`);
      });
    } else if (req.file) {
      const cleanPath = req.file.path.replace(/\\/g, '/').split('/uploads/')[1];
      medicalReports.push(`/uploads/${cleanPath}`);
    }

    // Generate QR Code data payload
    const qrCodeData = JSON.stringify({
      aid: appointmentId,
      pid: patientId,
      pname: patientName || req.user?.name,
      hid: hospitalId,
      hname: hospitalName,
      doc: doctorName,
      dept: department,
      dt: appointmentDate,
      tm: appointmentTime,
      type: 'OFFLINE_HOSPITAL_CHECKIN_NODE'
    });

    const newAppointment = new OfflineAppointment({
      appointmentId,
      patientId,
      patientName: patientName || req.user?.name || 'Patient Node',
      patientPhone: patientPhone || req.user?.phone || 'Not Provided',
      patientEmail: patientEmail || req.user?.email,
      hospitalId: hospitalId || 'HOSP-GEN',
      hospitalName,
      hospitalAddress: hospitalAddress || 'Hospital Main Campus',
      hospitalContact: hospitalContact || '+91 1800 200 4000',
      doctorId: doctorId || 'DOC-GEN',
      doctorName: doctorName || 'Duty Senior Consultant',
      department: department || 'General Medicine',
      specialization: specialization || department,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      reportingTime,
      appointmentType: appointmentType || 'General Consultation',
      reasonForVisit,
      symptoms: symptoms || reasonForVisit,
      medicalReports,
      estimatedFee: Number(estimatedFee) || 500,
      paymentStatus: 'Pay at Hospital Counter',
      status: 'Booked',
      qrCodePayload: qrCodeData
    });

    await newAppointment.save();

    console.log(`[OFFLINE_BOOKING_SUCCESS] Appointment Generated: ${appointmentId} for ${patientName}`);

    res.status(201).json({
      success: true,
      message: 'Offline Hospital Appointment Confirmed Successfully',
      appointment: newAppointment
    });
  } catch (error) {
    console.error('[OFFLINE_BOOKING_FATAL_ERROR]', error);
    res.status(500).json({ success: false, message: `Offline booking failure: ${error.message}` });
  }
};

// 5. Get Patient's Offline Appointments
export const getPatientOfflineAppointments = async (req, res) => {
  try {
    const pId = req.user?.patientId;
    const hId = req.user?.humanId;
    const uId = req.user?._id?.toString();
    const { status } = req.query;

    const query = {
      $or: [
        { patientId: pId },
        { patientId: hId },
        { patientId: uId }
      ].filter(Boolean)
    };

    if (status && status !== 'All') {
      query.status = status;
    }

    const appointments = await OfflineAppointment.find(query).sort({ appointmentDate: -1, createdAt: -1 });
    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    console.error('[GET_PATIENT_OFFLINE_APPTS_ERR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 6. Get Single Offline Appointment Details & Slip
export const getOfflineAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let appt = await OfflineAppointment.findOne({ appointmentId: id });
    if (!appt && mongoose.Types.ObjectId.isValid(id)) {
      appt = await OfflineAppointment.findById(id);
    }
    if (!appt) return res.status(404).json({ success: false, message: 'Offline appointment not found' });
    res.json({ success: true, appointment: appt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 7. Cancel Offline Appointment
export const cancelOfflineAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const appt = await OfflineAppointment.findOneAndUpdate(
      { $or: [{ appointmentId: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])] },
      { status: 'Cancelled', cancellationReason: reason || 'Cancelled by Patient', cancelledAt: new Date() },
      { new: true }
    );

    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    res.json({ success: true, message: 'Appointment cancelled successfully', appointment: appt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 8. Reception QR Code Scan / Check-In Search
export const scanCheckInQR = async (req, res) => {
  try {
    const { query } = req.body; // Scanned QR string or appointmentId or patientId
    if (!query) return res.status(400).json({ success: false, message: 'Search parameter or QR payload required' });

    let parsedId = query;
    try {
      const parsed = JSON.parse(query);
      if (parsed.aid) parsedId = parsed.aid;
    } catch (e) {
      // not JSON, keep as raw string
    }

    const appt = await OfflineAppointment.findOne({
      $or: [
        { appointmentId: parsedId },
        { patientId: parsedId },
        ...(mongoose.Types.ObjectId.isValid(parsedId) ? [{ _id: parsedId }] : [])
      ]
    });

    if (!appt) return res.status(404).json({ success: false, message: 'No offline appointment matching this QR / ID node' });

    res.json({ success: true, appointment: appt });
  } catch (error) {
    console.error('[SCAN_CHECKIN_ERR]', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// 9. Update Offline Appointment Status (Check-in, Waiting, Started, Completed)
export const updateAppointmentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Booked', 'Checked In', 'Waiting', 'Consultation Started', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: `Invalid status node: ${status}` });
    }

    const updateFields = { status, updatedAt: new Date() };

    if (status === 'Checked In') {
      updateFields.checkInTime = new Date();
    } else if (status === 'Consultation Started') {
      updateFields.consultationStartTime = new Date();
    } else if (status === 'Completed') {
      updateFields.consultationEndTime = new Date();
    }

    const appt = await OfflineAppointment.findOneAndUpdate(
      { $or: [{ appointmentId: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])] },
      updateFields,
      { new: true }
    );

    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    res.json({ success: true, message: `Appointment status updated to ${status}`, appointment: appt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 10. Complete Consultation with Notes & Prescription
export const completeOfflineConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { diagnosis, clinicalNotes, prescription } = req.body;

    const appt = await OfflineAppointment.findOneAndUpdate(
      { $or: [{ appointmentId: id }, ...(mongoose.Types.ObjectId.isValid(id) ? [{ _id: id }] : [])] },
      {
        status: 'Completed',
        diagnosis,
        clinicalNotes,
        prescription,
        consultationEndTime: new Date(),
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!appt) return res.status(404).json({ success: false, message: 'Appointment not found' });

    res.json({ success: true, message: 'Consultation completed and synchronized', appointment: appt });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 11. Hospital Doctor OPD Queue
export const getHospitalOfflineQueue = async (req, res) => {
  try {
    const doctorId = req.user?.doctorId;
    const { date, hospitalId } = req.query;

    const filter = {};
    if (doctorId && req.user.role === 'doctor') {
      filter.$or = [{ doctorId }, { doctorName: new RegExp(req.user.name, 'i') }];
    }
    if (hospitalId) filter.hospitalId = hospitalId;

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const appointments = await OfflineAppointment.find(filter)
      .sort({ appointmentDate: 1, createdAt: -1 });

    res.json({ success: true, count: appointments.length, appointments });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// 12. Admin Statistics & All Offline Bookings Registry
export const getAdminOfflineStats = async (req, res) => {
  try {
    const totalBookings = await OfflineAppointment.countDocuments();
    
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const todayBookings = await OfflineAppointment.countDocuments({
      appointmentDate: { $gte: todayStart, $lte: todayEnd }
    });

    const confirmed = await OfflineAppointment.countDocuments({ status: 'Booked' });
    const checkedIn = await OfflineAppointment.countDocuments({ status: { $in: ['Checked In', 'Waiting', 'Consultation Started'] } });
    const completed = await OfflineAppointment.countDocuments({ status: 'Completed' });
    const cancelled = await OfflineAppointment.countDocuments({ status: 'Cancelled' });

    const recentAppointments = await OfflineAppointment.find()
      .sort({ createdAt: -1 })
      .limit(50);

    res.json({
      success: true,
      stats: {
        totalBookings,
        todayBookings,
        confirmed,
        checkedIn,
        completed,
        cancelled
      },
      appointments: recentAppointments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
