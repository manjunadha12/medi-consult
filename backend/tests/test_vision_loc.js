import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { detectFracturesWithAI } from '../medical-engine/vision/aiFractureLocalizer.js';
import { analyzeRadiographFilm } from '../medical-engine/vision/radiographAnalyzer.js';

async function test() {
  const filePath = path.resolve(__dirname, '../uploads/patient/PAT1001/report-1793724143320-107792812.png');
  console.log('Testing file:', filePath);
  if (!fs.existsSync(filePath)) {
    console.log('File not found:', filePath);
    return;
  }

  console.log('GEMINI_API_KEY available:', !!process.env.GEMINI_API_KEY);
  console.log('OPENROUTER_API_KEY available:', !!process.env.OPENROUTER_API_KEY);

  console.log('\n--- 1. Testing detectFracturesWithAI ---');
  const aiResult = await detectFracturesWithAI(filePath);
  console.log('AI Result:', JSON.stringify(aiResult, null, 2));

  console.log('\n--- 2. Testing analyzeRadiographFilm ---');
  const fullAnalysis = await analyzeRadiographFilm(filePath, { filePath, isRadiographFilm: true });
  console.log('Diagnostic Summary:');
  console.log('  Anatomical Region:', fullAnalysis.diagnosticSummary.anatomicalRegion);
  console.log('  Detected Anatomy:', fullAnalysis.diagnosticSummary.detectedAnatomy);
  console.log('  Fracture Detected:', fullAnalysis.diagnosticSummary.fractureDetected);
  console.log('  Fracture Location:', fullAnalysis.diagnosticSummary.fractureLocation);
  console.log('  Coordinates:', fullAnalysis.diagnosticSummary.coordinates);
  console.log('  Candidate ROIs:', JSON.stringify(fullAnalysis.diagnosticSummary.candidateRois, null, 2));
  console.log('  Annotated Image URL:', fullAnalysis.diagnosticSummary.annotatedImageUrl);
}

test().catch(console.error);
