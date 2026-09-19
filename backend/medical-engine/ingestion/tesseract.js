import { createWorker } from 'tesseract.js';
import path from 'path';
import fs from 'fs';
import { preprocessImage, createContrastPass } from './sharp.js';

let sharedWorker = null;

async function getWorker() {
  if (sharedWorker) return sharedWorker;
  const __dirname = path.resolve();
  const tessdataDir = path.join(__dirname, 'medical-engine');

  sharedWorker = await createWorker('eng', 1, {
    langPath: fs.existsSync(path.join(tessdataDir, 'eng.traineddata')) ? tessdataDir : undefined,
    logger: () => {}
  });

  await sharedWorker.setParameters({
    tessedit_pageseg_mode: '6', // Assume uniform block of text
    preserve_interword_spaces: '1'
  });

  return sharedWorker;
}

/**
 * Executes multi-pass OCR on an image buffer
 */
export async function performOcr(imageBuffer, filename = '') {
  try {
    const worker = await getWorker();

    // Pass 1: Standard preprocessed pass
    const pass1Buffer = await preprocessImage(imageBuffer);
    const result1 = await worker.recognize(pass1Buffer);

    let bestText = result1.data.text || '';
    let bestLines = result1.data.lines || [];

    // Pass 2: If low text extracted, perform high-contrast adaptive pass
    if (bestText.length < 250) {
      try {
        const pass2Buffer = await createContrastPass(imageBuffer);
        const result2 = await worker.recognize(pass2Buffer);
        if ((result2.data.text || '').length > bestText.length) {
          bestText = result2.data.text;
          bestLines = result2.data.lines;
        }
      } catch (p2Err) {
        // Keep pass 1
      }
    }

    const structuredLines = [];
    let lineIdx = 1;

    if (bestLines && bestLines.length > 0) {
      for (const line of bestLines) {
        const rawText = (line.text || '').trim();
        if (!rawText) continue;

        structuredLines.push({
          pageNumber: 1,
          lineNumber: lineIdx++,
          text: rawText,
          confidence: line.confidence || 85,
          bbox: line.bbox || null
        });
      }
    } else {
      const splitLines = bestText.split(/\r?\n/);
      for (const raw of splitLines) {
        const rawText = raw.trim();
        if (!rawText) continue;
        structuredLines.push({
          pageNumber: 1,
          lineNumber: lineIdx++,
          text: rawText,
          confidence: 85,
          bbox: null
        });
      }
    }

    return {
      fullText: bestText,
      lines: structuredLines,
      confidence: result1.data.confidence || 85
    };
  } catch (err) {
    console.error("[OCR_ENGINE_ERR]", err.message);
    return {
      fullText: "",
      lines: [],
      confidence: 0
    };
  }
}
