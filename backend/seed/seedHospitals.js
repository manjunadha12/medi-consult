import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Hospital from '../models/Hospital.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';

dotenv.config();

const premierHospitals = [
  {
    hospitalId: 'HOSP-APOLLO-01',
    hospitalName: 'Apollo Speciality Hospitals',
    logo: 'https://images.unsplash.com/photo-1587351021759-3e566b6af7cc?w=400&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    address: 'Greams Lane, 21 Greams Road, Thousand Lights',
    city: 'Chennai',
    state: 'Tamil Nadu',
    pincode: '600006',
    departments: [
      'Cardiology',
      'Neurology & Neurosurgery',
      'Orthopedics & Joint Replacement',
      'Oncology',
      'Gastroenterology',
      'Emergency & Trauma',
      'General Medicine',
      'Pediatrics'
    ],
    contactNumber: '+91 44 2829 0200',
    emergencyContact: '1066',
    timings: '24x7 Emergency • OPD: 08:00 AM - 08:00 PM',
    isEmergencyAvailable: true,
    consultationFee: 750,
    rating: 4.9,
    totalBeds: 560,
    icuBedsAvailable: 38,
    distanceKm: 2.8,
    facilities: ['24x7 Emergency Trauma Center', 'Robotic Surgery Unit', 'Advanced CT/MRI 3T', 'NABH/JCI Accredited', 'In-house 24/7 Pharmacy', 'Ambulance GPS Fleet']
  },
  {
    hospitalId: 'HOSP-MEDANTA-01',
    hospitalName: 'Medanta - The Medicity',
    logo: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?w=400&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1586773860418-d37222d8fce3?w=800&auto=format&fit=crop&q=80',
    address: 'CH Bakhtawar Singh Road, Sector 38',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122001',
    departments: [
      'Cardiovascular & Thoracic Surgery',
      'Neurosciences',
      'Orthopedics',
      'Cancer Institute',
      'Kidney & Urology',
      'Emergency Medicine',
      'Internal Medicine'
    ],
    contactNumber: '+91 124 414 1414',
    emergencyContact: '1068',
    timings: '24x7 Emergency • OPD: 08:30 AM - 07:30 PM',
    isEmergencyAvailable: true,
    consultationFee: 1000,
    rating: 4.9,
    totalBeds: 1250,
    icuBedsAvailable: 85,
    distanceKm: 4.5,
    facilities: ['Level 1 Trauma Care', 'Heart Failure Clinic', 'CyberKnife Radiosurgery', 'Organ Transplant Suite', 'Air Ambulance']
  },
  {
    hospitalId: 'HOSP-FORTIS-01',
    hospitalName: 'Fortis Memorial Research Institute',
    logo: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1512678080530-7760d81faba6?w=800&auto=format&fit=crop&q=80',
    address: 'Sector 44, Opposite HUDA City Centre',
    city: 'Gurugram',
    state: 'Haryana',
    pincode: '122002',
    departments: [
      'Cardiac Sciences',
      'Bone & Joint Care',
      'Oncology',
      'Pediatrics & Neonatology',
      'Pulmonology & Critical Care',
      'Dermatology',
      'Emergency Care'
    ],
    contactNumber: '+91 124 496 2200',
    emergencyContact: '+91 124 496 2222',
    timings: '24x7 Emergency • OPD: 09:00 AM - 08:00 PM',
    isEmergencyAvailable: true,
    consultationFee: 850,
    rating: 4.8,
    totalBeds: 400,
    icuBedsAvailable: 30,
    distanceKm: 5.1,
    facilities: ['Advanced Cath Labs', 'Linear Accelerator Radiation', 'Neonatal ICU Level 3', 'Physiotherapy & Rehab']
  },
  {
    hospitalId: 'HOSP-MANIPAL-01',
    hospitalName: 'Manipal Hospital',
    logo: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=400&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?w=800&auto=format&fit=crop&q=80',
    address: '98 HAL Old Airport Road, Kodihalli',
    city: 'Bengaluru',
    state: 'Karnataka',
    pincode: '560017',
    departments: [
      'Cardiology',
      'Neurology',
      'Orthopedics',
      'Gastroenterology',
      'Nephrology',
      'General Surgery',
      'Obstetrics & Gynecology'
    ],
    contactNumber: '+91 80 2502 4444',
    emergencyContact: '080 2502 3333',
    timings: '24x7 Emergency • OPD: 08:00 AM - 08:30 PM',
    isEmergencyAvailable: true,
    consultationFee: 650,
    rating: 4.7,
    totalBeds: 600,
    icuBedsAvailable: 42,
    distanceKm: 3.6,
    facilities: ['Comprehensive Cancer Center', 'Comprehensive Dialysis Unit', 'Pediatric Intensive Care', 'Digital Radiology']
  },
  {
    hospitalId: 'HOSP-AIIMS-01',
    hospitalName: 'All India Institute of Medical Sciences (AIIMS)',
    logo: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=400&auto=format&fit=crop&q=80',
    image: 'https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?w=800&auto=format&fit=crop&q=80',
    address: 'Sri Aurobindo Marg, Ansari Nagar',
    city: 'New Delhi',
    state: 'Delhi',
    pincode: '110029',
    departments: [
      'Cardiology',
      'Neurology',
      'Orthopedics',
      'General Medicine',
      'Pediatrics',
      'Surgical Oncology',
      'Emergency & Trauma Care'
    ],
    contactNumber: '+91 11 2658 8500',
    emergencyContact: '102 / 108',
    timings: '24x7 Apex Trauma Center • OPD: 07:30 AM - 05:00 PM',
    isEmergencyAvailable: true,
    consultationFee: 100,
    rating: 4.9,
    totalBeds: 2400,
    icuBedsAvailable: 150,
    distanceKm: 6.2,
    facilities: ['National Apex Trauma Center', 'National Cancer Institute', 'Superspecialty Diagnostic Wings', 'Affordable Subsidized Care']
  }
];

const seedHospitals = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mediconsult_official');
    console.log('Connected.');

    for (const hosp of premierHospitals) {
      await Hospital.findOneAndUpdate(
        { hospitalId: hosp.hospitalId },
        hosp,
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded/Updated Hospital: ${hosp.hospitalName} (${hosp.city})`);
    }

    // Ensure we have active doctor records affiliated with hospitals
    const doctorsToEnsure = [
      {
        name: 'Dr. Naresh Trehan',
        email: 'doctor@mediconsult.com',
        doctorId: 'DOC1001',
        specialization: 'Cardiovascular Surgeon',
        department: 'Cardiology',
        hospitalId: 'HOSP-MEDANTA-01',
        hospitalName: 'Medanta - The Medicity',
        experience: 40,
        consultationFee: 1000
      },
      {
        name: 'Dr. Devi Prasad Shetty',
        email: 'devyshetty@mediconsult.com',
        doctorId: 'DOC1002',
        specialization: 'Cardiac Surgeon',
        department: 'Cardiology',
        hospitalId: 'HOSP-MANIPAL-01',
        hospitalName: 'Manipal Hospital',
        experience: 35,
        consultationFee: 800
      },
      {
        name: 'Dr. Ashok Rajgopal',
        email: 'ashok.rajgopal@mediconsult.com',
        doctorId: 'DOC1003',
        specialization: 'Orthopedic Surgeon (Knee & Trauma Specialist)',
        department: 'Orthopedics & Joint Replacement',
        hospitalId: 'HOSP-APOLLO-01',
        hospitalName: 'Apollo Speciality Hospitals',
        experience: 38,
        consultationFee: 750
      },
      {
        name: 'Dr. B. K. Misra',
        email: 'bk.misra@mediconsult.com',
        doctorId: 'DOC1004',
        specialization: 'Senior Neurosurgeon',
        department: 'Neurology & Neurosurgery',
        hospitalId: 'HOSP-APOLLO-01',
        hospitalName: 'Apollo Speciality Hospitals',
        experience: 32,
        consultationFee: 900
      },
      {
        name: 'Dr. S. K. Sarin',
        email: 'sk.sarin@mediconsult.com',
        doctorId: 'DOC1005',
        specialization: 'Gastroenterologist & Hepatologist',
        department: 'Gastroenterology',
        hospitalId: 'HOSP-AIIMS-01',
        hospitalName: 'All India Institute of Medical Sciences (AIIMS)',
        experience: 29,
        consultationFee: 200
      },
      {
        name: 'Dr. Randeep Guleria',
        email: 'randeep.guleria@mediconsult.com',
        doctorId: 'DOC1006',
        specialization: 'Pulmonologist & Internal Medicine Specialist',
        department: 'General Medicine',
        hospitalId: 'HOSP-FORTIS-01',
        hospitalName: 'Fortis Memorial Research Institute',
        experience: 34,
        consultationFee: 850
      }
    ];

    for (const doc of doctorsToEnsure) {
      let userDoc = await User.findOne({ doctorId: doc.doctorId });
      if (!userDoc) {
        userDoc = await User.create({
          name: doc.name,
          email: doc.email,
          password: 'Doctor@123',
          role: 'doctor',
          doctorId: doc.doctorId,
          isActive: true,
          authProvider: 'Local'
        });
      }

      await DoctorProfile.findOneAndUpdate(
        { doctorId: doc.doctorId },
        {
          userId: userDoc._id,
          doctorId: doc.doctorId,
          specialization: doc.specialization,
          department: doc.department,
          hospitalName: doc.hospitalName,
          hospitalId: doc.hospitalId,
          experience: doc.experience,
          consultationFee: doc.consultationFee,
          isVerified: true
        },
        { upsert: true, new: true }
      );
      console.log(`✅ Seeded/Updated Doctor: ${doc.name} (${doc.specialization}) at ${doc.hospitalName}`);
    }

    console.log('\n=================================================');
    console.log('PREMIER HOSPITALS & SPECIALISTS SEEDED SUCCESSFULLY');
    console.log('=================================================\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Hospital Seeding Error:', error.message);
    process.exit(1);
  }
};

seedHospitals();
