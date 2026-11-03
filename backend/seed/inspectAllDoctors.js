import mongoose from 'mongoose';
import DoctorProfile from '../models/DoctorProfile.js';
import User from '../models/User.js';
import Institution from '../models/Institution.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  const docs = await DoctorProfile.find({}).populate('userId', 'name email role').lean();
  console.log(`Found ${docs.length} doctor profiles:`);
  docs.forEach((d, idx) => {
    console.log(`[${idx + 1}] MRN: ${d.medicalRegistrationNumber} | Name: ${d.userId?.name} | Email: ${d.userId?.email} | Hospital: ${d.hospitalName} | City: ${d.city} | State: ${d.state} | Status: ${d.verificationStatus}`);
  });

  // Let's also check if there is an institutional registry / affiliation table or pre-registered doctors
  const collections = await mongoose.connection.db.listCollections().toArray();
  console.log("\nCollections in DB:", collections.map(c => c.name));

  process.exit(0);
}

run();
