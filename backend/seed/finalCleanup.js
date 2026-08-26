import mongoose from 'mongoose';
import Institution from '../models/Institution.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const cleanup = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  console.log("Starting deep registry cleanup...");

  // 1. Remove "Nadu " prefix from all names and states
  const messyDocs = await Institution.find({ name: /^Nadu /i });
  console.log(`Found ${messyDocs.length} documents with "Nadu " prefix.`);

  for (const doc of messyDocs) {
    const newName = doc.name.replace(/^Nadu\s+/i, '').trim();
    // Also clean up the university/city if they got messed up in that record
    const updated = await Institution.findByIdAndUpdate(doc._id, {
      name: newName,
      state: "Tamil Nadu",
      city: doc.city === "University,Chennai" ? "Chennai" : doc.city
    });
  }

  // 2. Remove duplicate Stanley/Saveetha entries
  // Keep only one for each city
  const institutions = await Institution.find({}).lean();
  const seen = new Set();
  const toDelete = [];

  for (const h of institutions) {
    // Normalize for comparison
    const normName = h.name.toLowerCase()
      .replace(/hospital/gi, '')
      .replace(/college/gi, '')
      .replace(/medical/gi, '')
      .replace(/and/gi, '')
      .replace(/&/gi, '')
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
    const res = await Institution.deleteMany({ _id: { $in: toDelete } });
    console.log(`Deleted ${res.deletedCount} duplicate entries.`);
  }

  // 3. Specifically fix Stanley Medical College
  await Institution.findOneAndUpdate(
    { name: /Stanley/i, city: /Chennai/i },
    {
      name: "Stanley Medical College & Hospital",
      shortName: "Stanley Medical College",
      type: "Medical College & Hospital",
      city: "Chennai",
      state: "Tamil Nadu",
      ownership: "Government"
    }
  );

  console.log("Registry Deep Clean Complete!");
  process.exit();
};

cleanup();
