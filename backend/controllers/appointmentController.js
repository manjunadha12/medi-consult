import mongoose from 'mongoose';
import User from '../models/User.js';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import Appointment from '../models/Appointment.js';
import Prescription from '../models/Prescription.js';
import Report from '../models/Report.js';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_TJH58EdrShV62S',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'uGW37UPEbvMdzmmVBuCghrpW'
});

export const updateVideoMeeting = async (req, res) => {
  try {
    const { id } = req.params;
    const { meetingId, meetingPassword, scheduledVideoTime } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { meetingId, meetingPassword, scheduledVideoTime },
      { new: true }
    );

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleMeetingReady = async (req, res) => {
  try {
    const { id } = req.params;
    const { isMeetingReady } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { isMeetingReady },
      { new: true }
    );

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const bookOP = async (req, res) => {
  try {
    const { doctorId, department, date, time, problemDescription, consultationType, paymentMethod, fee, transactionId } = req.body;
    let patientId = req.user?.patientId || req.user?.humanId;

    if (!patientId) {
      patientId = `PAT-${Math.floor(1000 + Math.random() * 9000)}`;
      await User.findByIdAndUpdate(req.user._id, { patientId });
    }

    if (!doctorId) {
      return res.status(400).json({ success: false, message: "Specialist node ID is required." });
    }

    console.log(`[BOOKING_SYNC] Initializing for Patient: ${patientId} ↔ Doctor: ${doctorId}`);

    // Generate secure room code
    const roomCode = `MC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const appointmentId = `OP-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const tokenNumber = Math.floor(100 + Math.random() * 900);
    const meetingId = `MC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const meetingPassword = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newAppointment = new Appointment({
      patientId,
      doctorId,
      specialization: department,
      date: date ? new Date(date) : new Date(),
      time,
      tokenNumber,
      appointmentId,
      consultationType: consultationType || 'Video',
      problemDescription: problemDescription || 'No description provided',
      roomCode,
      meetingId,
      meetingPassword,
      scheduledVideoTime: time,
      paymentMethod: paymentMethod || 'Razorpay',
      fee: fee || 0,
      paymentStatus: 'Pending',
      transactionId: transactionId || undefined,
      paymentScreenshot: req.file ? `/uploads/${req.file.path.replace(/\\/g, '/').split('/uploads/')[1]}` : undefined
    });

    // If Razorpay, create order
    if (newAppointment.paymentMethod === 'Razorpay' && newAppointment.fee > 0) {
      try {
        const options = {
          amount: newAppointment.fee * 100, // amount in paise
          currency: "INR",
          receipt: appointmentId,
        };
        const order = await razorpay.orders.create(options);
        newAppointment.razorpayOrderId = order.id;
        console.log(`[PAYMENT_NODE] Razorpay Order Generated: ${order.id}`);
      } catch (rzpErr) {
        console.error(`[PAYMENT_NODE_FAIL] Razorpay Handshake Error:`, rzpErr.message);
        // We don't crash the whole booking, just notify or fallback
        return res.status(503).json({
          success: false,
          message: "Payment gateway node busy. Please try another method or try again."
        });
      }
    } else if (newAppointment.paymentMethod === 'UPI') {
        newAppointment.paymentStatus = 'Verifying';
        console.log(`[PAYMENT_NODE] Manual UPI verification requested for UTR: ${transactionId}`);
    } else if (['PayPal', 'Card', 'Wallet'].includes(newAppointment.paymentMethod)) {
        newAppointment.paymentStatus = 'Paid';
    }

    await newAppointment.save();
    console.log(`[BOOKING_SUCCESS] Slot Synchronized: ${appointmentId}`);

    res.status(201).json({
      success: true,
      message: 'OP Booked Successfully',
      appointment: newAppointment,
      razorpayOrderId: newAppointment.razorpayOrderId
    });
  } catch (error) {
    console.error(`[BOOKING_FATAL_ERROR] Node Sync Failure:`, error);
    res.status(500).json({ success: false, message: `Node synchronization failure: ${error.message}` });
  }
};

export const generateManualToken = async (req, res) => {
  try {
    const { patientId, doctorId, department, consultationType, isEmergency, problemDescription } = req.body;

    // Verify patient exists
    const patient = await User.findOne({ patientId, role: 'patient' });
    if (!patient) return res.status(404).json({ message: 'Patient not found in registry' });

    const roomCode = `MC-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const appointmentId = `OP-MAN-${Date.now()}`;
    const tokenNumber = Math.floor(100 + Math.random() * 900);
    const meetingId = `MC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const meetingPassword = Math.random().toString(36).substring(2, 8).toUpperCase();
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newAppointment = new Appointment({
      patientId,
      doctorId,
      specialization: department,
      date: new Date(),
      time,
      tokenNumber,
      appointmentId,
      consultationType: consultationType || 'In-person',
      problemDescription: problemDescription || 'Manual Token Generation',
      roomCode,
      meetingId,
      meetingPassword,
      scheduledVideoTime: time,
      paymentStatus: 'Paid', // Admin generated is usually handled offline
      status: 'Pending',
      isEmergency: isEmergency || false
    });

    await newAppointment.save();

    res.status(201).json({
      success: true,
      message: `Token #${tokenNumber} Generated Successfully`,
      appointment: newAppointment
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getDoctorQueue = async (req, res) => {
  try {
    const doctorId = req.user.doctorId || req.user._id || req.user.id;
    // Find all appointments for this doctor so both active nodes and past buffer history are returned
    const queue = await Appointment.find({
      $or: [
        { doctorId },
        { doctorId: req.user.doctorId },
        { doctorId: req.user._id }
      ].filter(Boolean)
    }).sort({ createdAt: -1 });

    // Enrich with patient names
    const enrichedQueue = await Promise.all(queue.map(async (app) => {
      const patient = await User.findOne({ patientId: app.patientId });
      return {
        ...app._doc,
        patientName: patient?.name || app.patientName || 'Unknown Patient',
        age: 30
      };
    }));

    res.json(enrichedQueue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getGlobalQueue = async (req, res) => {
  try {
    const AppointmentModel = mongoose.model('Appointment');
    const UserModel = mongoose.model('User');

    console.log('[QUEUE_SYNC] Probing global clinical queue...');
    const queue = await AppointmentModel.find({
      status: { $in: ['Pending', 'Accepted', 'Live'] }
    }).sort({ date: 1, createdAt: 1 }).lean();

    const enriched = await Promise.all(queue.map(async (app) => {
      const patient = await UserModel.findOne({ patientId: app.patientId }).select('name').lean();
      const doctor = await UserModel.findOne({ doctorId: app.doctorId }).select('name').lean();
      return {
        ...app,
        patientName: patient?.name || 'Unknown Node',
        doctorName: doctor?.name || 'Awaiting Specialist'
      };
    }));

    res.json(enriched);
  } catch (error) {
    console.error('[QUEUE_SYNC_FATAL]:', error);
    res.status(500).json({ message: "Registry synchronization failed" });
  }
};

export const getPatientAppointments = async (req, res) => {
  try {
    // If patientId is provided in query (used by doctors), use that; otherwise use logged-in user's ID
    const patientId = req.query.patientId || req.user.patientId;

    if (!patientId) {
      return res.status(400).json({ message: "Patient ID node required for history sync" });
    }

    const appointments = await Appointment.find({ patientId }).sort({ date: -1, createdAt: -1 });

    const enriched = await Promise.all(appointments.map(async (app) => {
      let doctor = null;
      if (app.doctorId) {
        doctor = await User.findOne({
          $or: [
            { doctorId: app.doctorId },
            ...(mongoose.Types.ObjectId.isValid(app.doctorId) ? [{ _id: app.doctorId }] : [])
          ]
        }).select('name specialization').lean();
      }

      let patient = null;
      if (app.patientId) {
        patient = await User.findOne({
          $or: [
            { patientId: app.patientId },
            ...(mongoose.Types.ObjectId.isValid(app.patientId) ? [{ _id: app.patientId }] : [])
          ]
        }).select('name').lean();
      }

      return {
        ...app._doc,
        doctorName: doctor?.name || app.doctorName || (app.specialization ? `Dr. Specialist (${app.specialization})` : 'Dr. Specialist'),
        patientName: patient?.name || app.patientName || 'Patient Node'
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAppointmentDetails = async (req, res) => {
  try {
    const { id } = req.params;
    let appointment;

    if (mongoose.Types.ObjectId.isValid(id)) {
      appointment = await Appointment.findById(id);
    }

    if (!appointment) {
      appointment = await Appointment.findOne({ appointmentId: id });
    }

    if (!appointment) return res.status(404).json({ message: 'Appointment not found in registry' });

    let patient = null;
    if (appointment.patientId) {
      patient = await User.findOne({
        $or: [
          { patientId: appointment.patientId },
          ...(mongoose.Types.ObjectId.isValid(appointment.patientId) ? [{ _id: appointment.patientId }] : [])
        ]
      }).select('name').lean();
    }

    let doctor = null;
    if (appointment.doctorId) {
      doctor = await User.findOne({
        $or: [
          { doctorId: appointment.doctorId },
          ...(mongoose.Types.ObjectId.isValid(appointment.doctorId) ? [{ _id: appointment.doctorId }] : [])
        ]
      }).select('name specialization').lean();
    }

    res.json({
      ...appointment._doc,
      patientName: patient?.name || appointment.patientName || 'Patient Node',
      doctorName: doctor?.name || appointment.doctorName || (appointment.specialization ? `Dr. Specialist (${appointment.specialization})` : 'Dr. Specialist')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const shareOpinion = async (req, res) => {
  try {
    const { appointmentId, notes, diagnosis, symptoms, remarks } = req.body;
    const appointment = await Appointment.findByIdAndUpdate(appointmentId, {
      notes,
      diagnosis,
      symptoms,
      remarks,
      status: 'Completed',
      endedAt: new Date()
    }, { new: true });

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestSecondOpinion = async (req, res) => {
  try {
    const { appointmentId, doctorId } = req.body;
    await Appointment.findByIdAndUpdate(appointmentId, {
      secondOpinionStatus: 'Requested',
      secondOpinionDoctorId: doctorId
    });
    res.json({ success: true, message: 'Second opinion requested' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const acceptAppointment = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(id, { status: 'Accepted' }, { new: true });
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const startConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findByIdAndUpdate(id, { status: 'Live' }, { new: true });
    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const endConsultation = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    let appointment;
    if (mongoose.Types.ObjectId.isValid(id)) {
      appointment = await Appointment.findByIdAndUpdate(id, {
        status: status || 'Completed',
        remarks: remarks || 'Consultation ended',
        endedAt: new Date()
      }, { new: true });
    }

    if (!appointment) {
      appointment = await Appointment.findOneAndUpdate({ appointmentId: id }, {
        status: status || 'Completed',
        remarks: remarks || 'Consultation ended',
        endedAt: new Date()
      }, { new: true });
    }

    if (!appointment) return res.status(404).json({ message: 'Appointment node not found' });

    res.json({ success: true, appointment });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getDoctorHistory = async (req, res) => {
  try {
    const doctorId = req.user.doctorId;
    const history = await Appointment.find({
      doctorId,
      status: { $in: ['Completed', 'Cancelled'] }
    }).sort({ endedAt: -1 });

    const enriched = await Promise.all(history.map(async (app) => {
      const patient = await User.findOne({ patientId: app.patientId });
      return {
        ...app._doc,
        patientName: patient?.name || 'Unknown Patient'
      };
    }));

    res.json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getPatientSummary = async (req, res) => {
  try {
    const pId = req.user?.patientId;
    const hId = req.user?.humanId;
    const uId = req.user?._id?.toString();

    const appointments = await Appointment.find({
      $or: [
        { patientId: pId },
        { patientId: hId },
        { patientId: uId }
      ].filter(Boolean)
    }).sort({ date: -1, createdAt: -1 });

    const enriched = (await Promise.all(appointments.map(async (app) => {
      let doctor = await User.findOne({ doctorId: app.doctorId });
      if (!doctor && mongoose.Types.ObjectId.isValid(app.doctorId)) {
        doctor = await User.findById(app.doctorId);
      }

      const doctorName = doctor ? doctor.name : (app.doctorName || 'Specialist Doctor');
      const meetingId = app.meetingId || `NODE-${(app.appointmentId || app._id.toString()).slice(-6).toUpperCase()}`;
      const meetingPassword = app.meetingPassword || Math.random().toString(36).substring(2, 8).toUpperCase();
      const scheduledVideoTime = app.scheduledVideoTime || app.time || '09:00 AM';

      return {
        ...app._doc,
        doctorName,
        meetingId,
        meetingPassword,
        scheduledVideoTime
      };
    })));

    res.json({
      success: true,
      appointments: enriched,
      stats: {
        total: enriched.length,
        pending: enriched.filter(a => a.status === 'Pending').length,
        completed: enriched.filter(a => a.status === 'Completed').length
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const appointment = await Appointment.findByIdAndUpdate(
      id,
      { paymentStatus: status || 'Paid' },
      { new: true }
    );

    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });

    // If paid, we can also auto-accept the appointment if it's pending
    if (appointment.paymentStatus === 'Paid' && appointment.status === 'Pending') {
       appointment.status = 'Accepted';
       await appointment.save();
    }

    res.json({
      success: true,
      message: `Payment status updated to ${appointment.paymentStatus}`,
      appointment
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const verifyRazorpayPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, appointmentId } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET || 'your_secret')
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      const appointment = await Appointment.findOneAndUpdate(
        { appointmentId },
        {
          paymentStatus: 'Paid',
          razorpayPaymentId: razorpay_payment_id,
          razorpaySignature: razorpay_signature
        },
        { new: true }
      );

      return res.status(200).json({
        success: true,
        message: "Payment verified successfully",
        appointment
      });
    } else {
      return res.status(400).json({ success: false, message: "Invalid signature sent!" });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
