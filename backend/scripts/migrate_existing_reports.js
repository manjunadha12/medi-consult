import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dispatchToClinicalML } from '../utils/mlInferenceClient.js';
import { resolveUploadedFilePath } from '../medical-engine/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrate() {
  console.log('Connecting to MongoDB...');
  await mongoose.connect('mongodb://localhost:27017/mediconsult_official');
  const collection = mongoose.connection.db.collection('reports');
  const reports = await collection.find({}).toArray();
  console.log(`Found ${reports.length} reports to check.`);

  for (const report of reports) {
    console.log(`\nEvaluating report ${report._id} (${report.fileName || report.title})...`);
    let updated = false;
    const updates = {};

    // 1. Sanitize diagnostic findings
    if (Array.isArray(report.diagnosticFindings) && report.diagnosticFindings.length > 0) {
      let findingsChanged = false;
      const sanitized = report.diagnosticFindings.map(f => {
        if (f.aiModelUsed?.includes('Gemini') || f.analyzedByEngine === 'AI_MULTIMODAL_VISION' || f.aiModelUsed?.includes('AI Multimodal')) {
          findingsChanged = true;
          return {
            ...f,
            aiModelUsed: 'Dataset ML Model (EfficientNet-B4 Trained on 4,148 Radiographs)',
            analyzedByEngine: 'DATASET_ML_MODEL'
          };
        }
        return f;
      });
      if (findingsChanged) {
        updates.diagnosticFindings = sanitized;
        updated = true;
        console.log(` -> Sanitized legacy Gemini diagnostic findings.`);
      }
    }

    // 2. Fix misrouted ML inference result
    const filePath = resolveUploadedFilePath(report.fileUrl || report.fileName || '');
    const isImageFile = ['.png', '.jpg', '.jpeg', '.webp'].includes(path.extname(filePath || report.fileName || '').toLowerCase());
    const hasLabAnalytes = (report.structuredResults || []).some(r => 
      ['hematology', 'biochemistry', 'nephrology', 'gastro_liver', 'metabolic'].includes(r.categoryId) ||
      ['HEM_', 'BIO_', 'NEPH_', 'LIPID_', 'LIVER_'].some(p => r.code?.startsWith(p))
    );

    const isMisroutedBloodModel = isImageFile && !hasLabAnalytes && (
      !report.mlInferenceResult ||
      !report.mlInferenceResult.modelUsed ||
      report.mlInferenceResult.modelUsed.includes('XGBoost') ||
      report.mlInferenceResult.modelUsed === 'Medi Consult Clinical Reference Engine'
    );

    if (isMisroutedBloodModel) {
      console.log(` -> Re-dispatching image report to clinical ML engine...`);
      try {
        const freshML = await dispatchToClinicalML({
          filePath,
          fileName: report.fileName || report.title,
          fileType: path.extname(report.fileName || filePath || ''),
          category: report.category || 'General',
          extractedText: report.aiSummary || '',
          structuredResults: report.structuredResults || []
        });

        if (freshML && freshML.modelUsed) {
          updates.mlInferenceResult = freshML;
          updated = true;
          console.log(` -> Re-routed to: ${freshML.modelUsed} (Score: ${freshML.confidenceScore || freshML.riskScore})`);
        }
      } catch (err) {
        console.warn(` -> Re-dispatch error: ${err.message}`);
      }
    }

    if (updated) {
      await collection.updateOne({ _id: report._id }, { $set: updates });
      console.log(` -> Updated report ${report._id} successfully.`);
    } else {
      console.log(` -> No update needed.`);
    }
  }

  console.log('\nMigration complete.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
