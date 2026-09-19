import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');
const { createWorker } = require('tesseract.js');
const sharp = require('sharp');

/**
 * Universal local Text & Line Extractor with Sharp image enhancement,
 * multi-pass Tesseract OCR, and page-by-page line coordinate tracking.
 */
export async function extractDocumentText(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`File not found at path: ${filePath}`);
  }

  const ext = path.extname(filePath).toLowerCase();
  const fileBuffer = fs.readFileSync(filePath);
  const pages = [];
  const allLines = [];

  if (ext === '.pdf') {
    try {
      let rawText = '';
      let numPages = 1;

      if (typeof pdfParse === 'function') {
        const pdfData = await pdfParse(fileBuffer);
        rawText = pdfData.text || '';
        numPages = pdfData.numpages || 1;
      } else if (pdfParse.PDFParse) {
        const parser = new pdfParse.PDFParse({ data: fileBuffer });
        await parser.load();
        const res = await parser.getText();
        rawText = (typeof res === 'string' ? res : (res?.text || '')) || '';
        numPages = res?.total || parser.pagesCount || 1;
        await parser.destroy();
      }

      const rawPages = rawText.split(/\f|\n--- Page \d+ ---\n|\n-- \d+ of \d+ --\n/);
      
      if (rawPages.length > 1) {
        rawPages.forEach((pageText, idx) => {
          const pageNum = idx + 1;
          const lines = processPageLines(pageText, pageNum);
          pages.push({ pageNumber: pageNum, text: pageText, lines });
          allLines.push(...lines);
        });
      } else {
        const lines = processPageLines(rawText, 1);
        pages.push({ pageNumber: 1, text: rawText, lines });
        allLines.push(...lines);
      }

      const isReadable = isValidDocumentText(rawText);

      return {
        success: true,
        fileType: 'pdf',
        totalPages: numPages,
        fullText: rawText,
        pages,
        lines: allLines,
        isReadableDocument: isReadable
      };
    } catch (err) {
      console.warn(`[PDF_PARSE_ERR] ${err.message}`);
      return {
        success: false,
        fileType: 'pdf',
        totalPages: 0,
        fullText: '',
        pages: [],
        lines: [],
        isReadableDocument: false
      };
    }
  } else if (['.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff'].includes(ext)) {
    // Sharp Image Preprocessing, Density Statistics & Multi-pass OCR
    let preprocessedBuffer = null;
    let isRadiographFilm = false;
    let radiographInfo = null;

    try {
      const sharpInstance = sharp(filePath);
      const stats = await sharpInstance.stats();
      const ch = stats.channels;
      
      // Radiological Film Density Gatekeeper:
      // X-Rays / CTs are high-contrast monochrome with deep dark film base (dominant rgb < 50) and high std dev.
      if (ch && ch.length >= 3) {
        const isMonochrome = Math.abs(ch[0].mean - ch[1].mean) < 20 && Math.abs(ch[1].mean - ch[2].mean) < 20;
        const isHighContrastFilm = ch[0].stdev > 38 && stats.dominant.r < 55 && stats.dominant.g < 55 && stats.dominant.b < 55;
        if (isMonochrome && isHighContrastFilm) {
          isRadiographFilm = true;
          radiographInfo = {
            modality: "Plain Radiography (X-Ray Film / Diagnostic Scan)",
            filmType: "High-Contrast Skeletal / Anatomical Radiograph",
            meanDensity: Math.round(ch[0].mean)
          };
          console.log(`[OCR_ENGINE] 🩻 Diagnostic Radiograph Film Detected via Density Analysis`);
        }
      }

      console.log(`[OCR_ENGINE] Preprocessing image with Sharp: ${path.basename(filePath)}`);
      preprocessedBuffer = await sharpInstance
        .resize({ width: 2400, withoutEnlargement: false })
        .grayscale()
        .normalize()
        .sharpen()
        .png()
        .toBuffer();
    } catch (sharpErr) {
      console.warn(`[SHARP_PREPROCESS_WARN] Falling back to raw file: ${sharpErr.message}`);
      preprocessedBuffer = fileBuffer;
    }

    try {
      const worker = await createWorker('eng');
      
      // Pass 1: PSM 6 (Uniform text block / table grid structure)
      await worker.setParameters({
        tessedit_pageseg_mode: '6',
      });
      const retPsm6 = await worker.recognize(preprocessedBuffer);
      const textPsm6 = retPsm6.data.text || '';

      // Pass 2: PSM 3 (Automatic page segmentation)
      await worker.setParameters({
        tessedit_pageseg_mode: '3',
      });
      const retPsm3 = await worker.recognize(preprocessedBuffer);
      const textPsm3 = retPsm3.data.text || '';

      await worker.terminate();

      // Combine both passes to ensure headers and table fields are captured
      const combinedText = `${textPsm6}\n\n=== SECTION 2 ===\n\n${textPsm3}`;
      console.log(`[OCR_ENGINE] Extracted ${combinedText.length} characters across passes`);

      // Strict Check: If OCR extracted paper lab report text, force isRadiographFilm to false
      const lowerText = combinedText.toLowerCase();
      const isLabPaperText = lowerText.includes('laboratory report') ||
                             lowerText.includes('hospital diagnostics') ||
                             lowerText.includes('patient name') ||
                             lowerText.includes('hemoglobin') ||
                             lowerText.includes('wbc') ||
                             lowerText.includes('platelet') ||
                             lowerText.includes('creatinine') ||
                             lowerText.includes('blood glucose') ||
                             lowerText.includes('reference range') ||
                             lowerText.includes('test name');

      if (isLabPaperText) {
        isRadiographFilm = false;
        radiographInfo = null;
        console.log(`[OCR_ENGINE] Paper Laboratory Report detected via OCR text. Disabling Radiograph mode.`);
      }

      const lines = processPageLines(textPsm6.length > 50 ? textPsm6 : combinedText, 1);
      const isReadable = isValidDocumentText(combinedText) || isRadiographFilm;

      return {
        success: true,
        fileType: 'image',
        totalPages: 1,
        fullText: combinedText,
        pages: [{ pageNumber: 1, text: combinedText, lines }],
        lines,
        isReadableDocument: isReadable,
        isRadiographFilm,
        radiographInfo
      };
    } catch (ocrErr) {
      console.warn(`[OCR_ENGINE_ERR] ${ocrErr.message}`);
      return {
        success: isRadiographFilm,
        fileType: 'image',
        totalPages: 1,
        fullText: '',
        pages: [],
        lines: [],
        isReadableDocument: isRadiographFilm,
        isRadiographFilm,
        radiographInfo
      };
    }
  } else {
    // Plain text files
    const text = fileBuffer.toString('utf-8');
    const lines = processPageLines(text, 1);
    const isReadable = isValidDocumentText(text);

    return {
      success: true,
      fileType: 'text',
      totalPages: 1,
      fullText: text,
      pages: [{ pageNumber: 1, text, lines }],
      lines,
      isReadableDocument: isReadable
    };
  }
}

/**
 * Splits page text into clean indexed lines
 */
function processPageLines(pageText, pageNumber) {
  if (!pageText) return [];
  const rawLines = pageText.split(/\r?\n/);
  const processed = [];

  rawLines.forEach((raw, idx) => {
    const sanitized = raw.replace(/[^\x20-\x7E\t]/g, ' ').replace(/\s+/g, ' ').trim();
    if (sanitized.length >= 2) {
      processed.push({
        pageNumber,
        lineNumber: idx + 1,
        text: sanitized,
        originalRaw: raw
      });
    }
  });

  return processed;
}

/**
 * Checks if the text has reasonable word structure (not binary noise or blank portrait)
 */
function isValidDocumentText(text) {
  if (!text || text.trim().length < 15) return false;
  // Match standard medical or clinical words
  const words = text.match(/[A-Za-z0-9]{2,}/g) || [];
  return words.length >= 4;
}
