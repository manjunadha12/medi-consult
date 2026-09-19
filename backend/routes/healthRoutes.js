import express from "express";

import {
  addHealthLog,
  getHealthLogs,
  analyzeHealthTrends,
  cleanHealthData,
  deleteAllHealthLogs
} from "../controllers/healthController.js";
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.use(protect);

router.post(
  "/logs",
  addHealthLog
);


router.get(
  "/logs/:patientId",
  getHealthLogs
);


router.post(
  "/analyze",
  analyzeHealthTrends
);


router.post(
  "/clean/:patientId",
  cleanHealthData
);


router.delete(
  "/logs/:patientId",
  deleteAllHealthLogs
);


export default router;
