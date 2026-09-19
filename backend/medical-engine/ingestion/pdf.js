import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

/**
 * Extracts text lines and structure from a Medical PDF document
 */
export async function extractPdfText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);

    const fullText = data.text || '';
    const rawLines = fullText.split(/\r?\n/);
    const structuredLines = [];

    let lineIdx = 1;
    let pageNum = 1;

    for (const line of rawLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      if (trimmed.toLowerCase().includes('page ') || trimmed.includes('-- page')) {
        pageNum++;
      }

      structuredLines.push({
        pageNumber: pageNum,
        lineNumber: lineIdx++,
        text: trimmed,
        confidence: 99,
        bbox: null
      });
    }

    return {
      fileType: 'pdf',
      totalPages: data.numpages || 1,
      fullText,
      lines: structuredLines,
      isReadableDocument: fullText.trim().length > 30
    };
  } catch (err) {
    console.error("[PDF_INGESTION_ERR]", err.message);
    return {
      fileType: 'pdf',
      totalPages: 1,
      fullText: '',
      lines: [],
      isReadableDocument: false
    };
  }
}

export default extractPdfText;
