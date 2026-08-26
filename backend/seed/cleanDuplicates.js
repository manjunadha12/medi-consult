import mongoose from 'mongoose';
import Institution from '../models/Institution.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const clean = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // 1. Remove the specifically reported messy entry
  const messy = await Institution.deleteOne({
    name: "Nadu Saveetha Medical College and Hospital, Kanchipuram Kanchipuram Saveetha University (Deemed), Chennai"
  });
  console.log(`Deleted messy Saveetha entry: ${messy.deletedCount}`);

  // 2. Generic deduplication script for the whole DB
  const all = await Institution.find({}).lean();
  const seen = new Set();
  const toDelete = [];

  for (const h of all) {
    const normName = h.name.toLowerCase()
      .replace(/nadu\s+/gi, '')
      .replace(/and\s+/gi, '')
      .replace(/hospital/gi, '')
      .replace(/college/gi, '')
      .replace(/[^a-z0-9]/g, '')
      .trim();

    const cityKey = (h.city || '').toLowerCase().trim();
    const key = `${normName}|${cityKey}`;

    if (seen.has(key)) {
      toDelete.push(h._id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    const result = await Institution.deleteMany({ _id: { $in: toDelete } });
    console.log(`Auto-purged ${result.deletedCount} general duplicates from registry.`);
  }

  console.log("Registry Optimization Complete!");
  process.exit();
};

clean();
