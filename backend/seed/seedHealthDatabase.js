import dotenv from "dotenv";
import mongoose from "mongoose";
import path from 'path';
import { fileURLToPath } from 'url';

import VitalRule from "../models/VitalRule.js";
import HealthRecommendation from "../models/HealthRecommendation.js";

import { vitalRules } from "./healthRules.js";
import { healthRecommendations } from "./healthRecommendations.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB Connected");

    await VitalRule.deleteMany({});
    await HealthRecommendation.deleteMany({});

    await VitalRule.insertMany(vitalRules);

    await HealthRecommendation.insertMany(
      healthRecommendations
    );

    console.log("Vital Rules Inserted");
    console.log("Health Recommendations Inserted");

    process.exit(0);

  } catch (error) {
    console.error(error);

    process.exit(1);
  }
};

seedDatabase();
