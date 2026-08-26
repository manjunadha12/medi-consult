import mongoose from 'mongoose';
import Institution from '../models/Institution.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

mongoose.connect(process.env.MONGO_URI).then(async () => {
  const docs = await Institution.find({ name: /Saveetha/i });
  console.log(JSON.stringify(docs, null, 2));
  process.exit();
});
