import mongoose from 'mongoose';
import Institution from '../models/Institution.js';
import User from '../models/User.js';
import DoctorProfile from '../models/DoctorProfile.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to DB");
  const insts = await Institution.find({ name: { $regex: 'SRM|Saveetha', $options: 'i' } }).lean();
  console.log("Found institutions count:", insts.length);
  console.log(JSON.stringify(insts.map(i => ({
    _id: i._id,
    name: i.name,
    shortName: i.shortName,
    city: i.city,
    state: i.state,
    address: i.address,
    district: i.district,
    lat: i.latitude || i.lat,
    lng: i.longitude || i.lng,
    type: i.type,
    verificationStatus: i.verificationStatus
  })), null, 2));

  // Also check existing doctor profiles or users to see how registered institutions are saved!
  const doctors = await DoctorProfile.find({}).limit(5).lean();
  console.log("\nExisting Doctor Profiles (sample):");
  console.log(JSON.stringify(doctors.map(d => ({
    userId: d.userId,
    hospitalName: d.hospitalName,
    formattedAddress: d.formattedAddress,
    city: d.city,
    state: d.state,
    medicalRegistrationNumber: d.medicalRegistrationNumber
  })), null, 2));

  process.exit(0);
}

run();
