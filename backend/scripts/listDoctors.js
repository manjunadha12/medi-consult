import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const listDoctors = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const doctors = await User.find({ role: 'doctor' }).select('name email doctorId');

    console.log('--- DOCTOR REGISTRY ---');
    doctors.forEach(doc => {
      console.log(`Name: ${doc.name} | ID: ${doc.doctorId} | Email: ${doc.email}`);
    });
    console.log('-----------------------');
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

listDoctors();
