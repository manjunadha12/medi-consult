import mongoose from 'mongoose';
import Institution from '../models/Institution.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected to MongoDB for Institution coordinates update");

  // SRM Medical College Hospital and Research Centre (Kattankulathur)
  await Institution.updateMany(
    { name: { $regex: 'SRM Medical College Hospital and Research Centre', $options: 'i' }, city: { $regex: 'Kattankulathur', $options: 'i' } },
    {
      $set: {
        latitude: 12.8230,
        longitude: 80.0444,
        campus: 'Kattankulathur',
        district: 'Chengalpattu',
        address: 'SRM Nagar, Kattankulathur, Chengalpattu District, Tamil Nadu 603203',
        verificationStatus: 'Verified'
      }
    }
  );

  // Saveetha Medical College Hospital (Thandalam)
  await Institution.updateMany(
    { name: { $regex: 'Saveetha Medical College Hospital', $options: 'i' } },
    {
      $set: {
        latitude: 13.0254,
        longitude: 80.0031,
        campus: 'Thandalam',
        district: 'Kanchipuram',
        address: 'Saveetha Nagar, Poonamallee High Road, Thandalam, Chennai, Tamil Nadu 602105',
        verificationStatus: 'Verified'
      }
    }
  );

  // SIMS Hospital (SRM Institutes for Medical Science, Vadapalani)
  await Institution.updateMany(
    { name: { $regex: 'SIMS Hospital', $options: 'i' } },
    {
      $set: {
        latitude: 13.0519,
        longitude: 80.2096,
        campus: 'Vadapalani',
        district: 'Chennai',
        address: 'No.1, Jawaharlal Nehru Salai, Vadapalani, Chennai, Tamil Nadu 600026',
        verificationStatus: 'Verified'
      }
    }
  );

  // Saveetha Dental College and Hospitals (Velappanchavadi / Chennai)
  await Institution.updateMany(
    { name: { $regex: 'Saveetha Dental College', $options: 'i' } },
    {
      $set: {
        latitude: 13.0583,
        longitude: 80.1417,
        campus: 'Velappanchavadi',
        district: 'Chennai',
        address: '162, Poonamallee High Road, Velappanchavadi, Chennai, Tamil Nadu 600077',
        verificationStatus: 'Verified'
      }
    }
  );

  // Trichy SRM Medical College Hospital and Research Centre
  await Institution.updateMany(
    { name: { $regex: 'Trichy SRM', $options: 'i' } },
    {
      $set: {
        latitude: 10.8780,
        longitude: 78.6920,
        campus: 'Irungalur',
        district: 'Tiruchirappalli',
        address: 'SRM Nagar, Trichy-Chennai Highway, Irungalur, Tiruchirappalli, Tamil Nadu 621105',
        verificationStatus: 'Verified'
      }
    }
  );
  const updated = await Institution.find({ name: { $regex: 'SRM|Saveetha', $options: 'i' } }).lean();
  console.log("Updated institutions count:", updated.length);
  updated.forEach(u => {
    console.log(`- ${u.name} | City: ${u.city} | Campus: ${u.campus} | Lat: ${u.latitude}, Lng: ${u.longitude}`);
  });

  process.exit(0);
}

run();
