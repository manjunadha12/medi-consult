import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { analyzeRadiographFilm } from '../medical-engine/vision/radiographAnalyzer.js';
import { resolveUploadedFilePath } from '../medical-engine/index.js';

async function updateReports() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect('mongodb://localhost:27017/mediconsult_official');
  const collection = mongoose.connection.db.collection('reports');
  
  const reports = await collection.find({
    $or: [
      { 'diagnosticFindings.type': 'radiograph_film' },
      { category: 'Radiology' },
      { fileUrl: { $regex: /\.(png|jpg|jpeg|webp)$/i } }
    ]
  }).toArray();

  console.log(`Found ${reports.length} potential radiograph reports to inspect.`);

  for (const report of reports) {
    const rawPath = report.fileUrl || report.fileName || '';
    const actualPath = resolveUploadedFilePath(rawPath);

    if (!actualPath || !fs.existsSync(actualPath)) {
      console.log(`[SKIP] File not found for report ${report._id}: ${rawPath}`);
      continue;
    }

    const ext = path.extname(actualPath).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.webp'].includes(ext)) {
      continue;
    }

    console.log(`\nRe-analyzing report ${report._id} (${path.basename(actualPath)})...`);
    try {
      const analysis = await analyzeRadiographFilm(actualPath, {
        filePath: actualPath,
        fileName: report.fileName || path.basename(actualPath),
        isRadiographFilm: true
      });

      if (!analysis || !analysis.diagnosticSummary) {
        console.log(` -> No diagnostic summary generated, skipping.`);
        continue;
      }

      const diag = analysis.diagnosticSummary;
      console.log(` -> Anatomical Region: ${diag.anatomicalRegion}`);
      console.log(` -> Fracture Detected: ${diag.fractureDetected}`);
      console.log(` -> Location: ${diag.fractureLocation}`);
      console.log(` -> Coordinates: ${diag.coordinates}`);
      console.log(` -> Candidate ROIs Count: ${diag.candidateRois?.length || 0}`);

      const updates = {
        diagnosticFindings: [diag],
        classifiedCategories: ['Radiology & Orthopedics'],
        aiSummary: diag.findingsSummary
      };

      // Merge structured results with updated radiograph parameters
      if (Array.isArray(analysis.structuredParams) && analysis.structuredParams.length > 0) {
        // Keep non-radiology results if any, and replace radiology parameters
        const existingNonRad = (report.structuredResults || []).filter(r => !r.code?.startsWith('RAD_'));
        updates.structuredResults = [...existingNonRad, ...analysis.structuredParams];
      }

      await collection.updateOne({ _id: report._id }, { $set: updates });
      console.log(` -> Successfully updated report ${report._id} in MongoDB!`);
    } catch (err) {
      console.error(` -> Error processing report ${report._id}:`, err.message);
    }
  }

  console.log('\nAll radiograph reports refreshed.');
  process.exit(0);
}

updateReports().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
