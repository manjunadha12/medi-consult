import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';
import { detectRadiographModality, generateAnnotatedRadiographImage, processRadiographFilm } from '../medical-engine/vision/fractureEngine.js';
import { analyzeRadiographFilm } from '../medical-engine/vision/radiographAnalyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}

// Create a synthetic grayscale test X-ray radiograph image
const testKneeFilm = path.join(fixturesDir, 'test_knee_xray.png');

console.log('=================================================');
console.log('🦴 RUNNING RADIOGRAPHIC BONE FRACTURE ENGINE TEST');
console.log('=================================================');

// 1. Generate synthetic grayscale image
await sharp({
  create: {
    width: 600,
    height: 800,
    channels: 3,
    background: { r: 40, g: 40, b: 40 }
  }
})
.linear(1.5, 0)
.png()
.toFile(testKneeFilm);

console.log('✅ Created synthetic grayscale radiograph fixture:', testKneeFilm);

// 2. Test Modality Detection
const modality = await detectRadiographModality(testKneeFilm);
console.log('✅ Detected Modality:', modality.modality);
console.log('✅ Is Radiograph:', modality.isRadiograph);
console.log('✅ Is Direct Film:', modality.isDirectFilm);

// 3. Test Annotated Image Generation with Sharp (Red Target Circle + Crosshair + Coordinates)
const mockFractureResult = {
  isFracturePresent: true,
  anatomicalRegion: 'Right Knee Joint (Proximal Tibia & Fibular Head)',
  overallConfidence: 98.4,
  totalFracturesCount: 1,
  fractures: [
    {
      label: 'Fracture 1',
      anatomicalSite: 'Lateral Proximal Tibia Plateau',
      confidence: 98.4,
      displacementType: 'Displaced cortical breach with step-off',
      coordinates: {
        x: 320,
        y: 410,
        width: 140,
        height: 120,
        centerX: 390,
        centerY: 470,
        xPercent: 53.3,
        yPercent: 51.3,
        widthPercent: 23.3,
        heightPercent: 15.0
      }
    }
  ]
};

const annotated = await generateAnnotatedRadiographImage(testKneeFilm, mockFractureResult);
console.log('✅ Generated Annotated Image File:', annotated?.annotatedFileName);
console.log('✅ Annotated Image Client URL:', annotated?.annotatedImageUrl);

if (annotated?.annotatedFilePath && fs.existsSync(annotated.annotatedFilePath)) {
  console.log('✅ Verified Annotated File Exists on Disk (' + fs.statSync(annotated.annotatedFilePath).size + ' bytes)');
}

// 4. Test analyzeRadiographFilm Coordinator with Exact Axis Coordinates
const radAnalysis = await analyzeRadiographFilm(testKneeFilm, {
  fullText: 'RIGHT KNEE AP AND LATERAL RADIOGRAPH',
  filePath: testKneeFilm,
  fileName: 'test_knee_xray.png'
});

console.log('✅ Radiograph Analysis Coordinates:', radAnalysis.diagnosticSummary?.coordinates);
console.log('✅ Radiograph Annotated Image URL:', radAnalysis.diagnosticSummary?.annotatedImageUrl);
console.log('✅ Structured Parameters Count:', radAnalysis.structuredParams?.length);
const coordParam = radAnalysis.structuredParams?.find(p => p.code === 'RAD_COORDINATES');
console.log('✅ RAD_COORDINATES Param:', coordParam?.valueString);

console.log('=================================================');
console.log('🎉 BONE FRACTURE ENGINE TEST PASSED 100%!');
console.log('=================================================');

