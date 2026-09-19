import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import HealthLog from '../models/HealthLog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const data = [
  { day: 1, bp_s: 138, bp_d: 88, o2: 95, pulse: 96, weight: 74.0, temp: 99.1, sugar: 148 },
  { day: 2, bp_s: 145, bp_d: 92, o2: 94, pulse: 102, weight: 74.2, temp: 99.4, sugar: 162 },
  { day: 3, bp_s: 152, bp_d: 96, o2: 93, pulse: 108, weight: 74.5, temp: 100.1, sugar: 178 },
  { day: 4, bp_s: 158, bp_d: 99, o2: 92, pulse: 112, weight: 74.7, temp: 100.6, sugar: 191 },
  { day: 5, bp_s: 165, bp_d: 104, o2: 91, pulse: 118, weight: 75.0, temp: 101.2, sugar: 207 },
  { day: 6, bp_s: 172, bp_d: 108, o2: 90, pulse: 119, weight: 75.3, temp: 101.8, sugar: 224 },
  { day: 7, bp_s: 181, bp_d: 112, o2: 89, pulse: 124, weight: 75.6, temp: 102.4, sugar: 241 }
];

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected for Log Seeding...');

    const patientId = 'PAT1001';

    // Calculate dates starting from 6 days ago up to today
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const logs = data.map((d, index) => {
      const date = new Date(now);
      date.setDate(date.getDate() - (6 - index));

      return {
        patientId,
        date,
        bp_systolic: d.bp_s,
        bp_diastolic: d.bp_d,
        oxygen: d.o2,
        heartbeat: d.pulse,
        weight: d.weight,
        temperature: d.temp,
        sugar: d.sugar,
        notes: `Automated node sync for Day ${d.day}`
      };
    });

    console.log(`Purging existing logs for ${patientId} to ensure clean trend mapping...`);
    await HealthLog.deleteMany({ patientId });

    console.log(`Inserting ${logs.length} health nodes...`);
    await HealthLog.insertMany(logs);

    console.log('Last Week Health Data Synchronized Successfully!');
    process.exit();
  } catch (err) {
    console.error('Seeding Error:', err);
    process.exit(1);
  }
};

seed();
