import sharp from 'sharp';
import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';

async function testPreprocessing() {
  const filePath = './uploads/patient/PAT1001/report-1787985694060-94468612.jpg';
  const preprocessedPath = './temp_preprocessed.png';

  // Preprocess with sharp: upscale 3x, grayscale, sharpen, threshold
  await sharp(filePath)
    .resize({ width: 2200, withoutEnlargement: false })
    .grayscale()
    .normalize()
    .sharpen()
    .threshold(180) // Clean binarization
    .toFile(preprocessedPath);

  console.log("Image preprocessed to:", preprocessedPath);

  const worker = await createWorker('eng');
  
  // Test PSM 6 (single uniform block of text / table)
  await worker.setParameters({
    tessedit_pageseg_mode: '6',
  });

  const res1 = await worker.recognize(preprocessedPath);
  console.log("\n=== PREPROCESSED OCR (PSM 6) ===\n", res1.data.text);

  // Test PSM 3 (fully automatic page segmentation)
  await worker.setParameters({
    tessedit_pageseg_mode: '3',
  });
  const res2 = await worker.recognize(preprocessedPath);
  console.log("\n=== PREPROCESSED OCR (PSM 3) ===\n", res2.data.text);

  await worker.terminate();
  if (fs.existsSync(preprocessedPath)) fs.unlinkSync(preprocessedPath);
}

testPreprocessing();
