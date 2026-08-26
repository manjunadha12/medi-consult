import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';

dotenv.config();

const seedDocs = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to DB');

    const docs = [
      { name: 'Dr. Pavan', email: 'pavan@mediconsult.com', specialty: 'Neurologist', id: 'DOC1002' },
      { name: 'Dr. Sarah', email: 'sarah@mediconsult.com', specialty: 'Cardiologist', id: 'DOC1003' }
    ];

    for (const d of docs) {
      const exists = await User.findOne({ email: d.email });
      if (exists) {
        console.log(`Skipping ${d.name}, already exists`);
        continue;
      }

      const user = await User.create({
        name: d.name,
        email: d.email,
        password: 'password123',
        role: 'doctor',
        doctorId: d.id,
        isActive: true,
        emailVerified: true
      });

      await DoctorProfile.create({
        userId: user._id,
        doctorId: d.id,
        specialization: d.specialty,
        hospitalName: 'Medi Consult Global',
        city: 'Bangalore',
        experience: 12,
        isVerified: true,
        verificationStatus: 'Approved'
      });

      console.log(`✅ Created: ${d.name} (${d.id})`);
    }

    console.log('Seed complete');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

seedDocs();
