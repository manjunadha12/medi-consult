import dotenv from "dotenv";
import mongoose from "mongoose";
import path from 'path';
import { fileURLToPath } from 'url';

import HealthCombinationRule from "../models/HealthCombinationRule.js";
import { healthCombinationRules } from "./healthCombinationRules.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected for Combination Rules Seeding...");

    await HealthCombinationRule.deleteMany({});

    await HealthCombinationRule.insertMany(healthCombinationRules);

    console.log(`Inserted ${healthCombinationRules.length} combination rules`);

    process.exit(0);

  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

seed();
