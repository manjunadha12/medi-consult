import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');

/**
 * Extracts text lines and structure from a Medical PDF document
 */
export async function extractPdfText(filePath) {
  try {
    const dataBuffer = fs.readFileSync(filePath);
    let fullText = '';
    let numpages = 1;

    if (typeof pdfModule === 'function') {
      const data = await pdfModule(dataBuffer);
      fullText = data.text || '';
      numpages = data.numpages || 1;
    } else if (pdfModule && pdfModule.PDFParse) {
      const parser = new pdfModule.PDFParse({ data: dataBuffer });
      const res = await parser.getText();
      fullText = res.text || (typeof res === 'string' ? res : '');
      numpages = res.total || 1;
    } else if (pdfModule && pdfModule.default) {
      const fn = typeof pdfModule.default === 'function' ? pdfModule.default : (pdfModule.default.PDFParse ? (buf) => new pdfModule.default.PDFParse({ data: buf }).getText() : null);
      if (fn) {
        const res = await fn(dataBuffer);
        fullText = res.text || (typeof res === 'string' ? res : '');
        numpages = res.numpages || res.total || 1;
      }
    }

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
      totalPages: numpages,
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
