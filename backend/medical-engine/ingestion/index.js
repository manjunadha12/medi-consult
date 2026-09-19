import path from 'path';
import fs from 'fs';
import sharp from 'sharp';
import { extractPdfText } from './pdf.js';
import { performOcr } from './tesseract.js';

/**
 * Universal Ingestion Pipeline
 * Takes any file (PDF, PNG, JPG, JPEG, WEBP) and produces standardized lines, text, and metadata
 */
export async function ingestDocument(filePath, passedFileName = '') {
  let resolvedPath = resolveUploadedFilePath(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new Error(`Document file not found at path: ${filePath}`);
  }
  filePath = resolvedPath;

  const ext = path.extname(filePath).toLowerCase();
  const fileName = passedFileName || path.basename(filePath);

  if (ext === '.pdf') {
    const pdfResult = await extractPdfText(filePath);
    return {
      filePath,
      fileName,
      ...pdfResult,
      isRadiographFilm: false
    };
  }

  if (ext === '.txt') {
    const textContent = fs.readFileSync(filePath, 'utf8');
    const rawLines = textContent.split(/\r?\n/);
    const structuredLines = [];
    let lineIdx = 1;
    for (const raw of rawLines) {
      const trimmed = raw.trim();
      if (!trimmed) continue;
      structuredLines.push({
        pageNumber: 1,
        lineNumber: lineIdx++,
        text: trimmed,
        confidence: 100,
        bbox: null
      });
    }
    return {
      filePath,
      fileName,
      fileType: 'txt',
      totalPages: 1,
      fullText: textContent,
      lines: structuredLines,
      isReadableDocument: textContent.trim().length > 30,
      isRadiographFilm: false
    };
  }

  // Handle Image Files
  const imageBuffer = fs.readFileSync(filePath);
  const isPlainXRay = await detectRadiographFilm(imageBuffer, fileName, filePath);
  const ocrResult = await performOcr(imageBuffer, fileName);

  const ocrLower = (ocrResult.fullText || '').toLowerCase();
  const hasRadiographOcrText = ocrLower.includes('radiograph') ||
    ocrLower.includes('x-ray') ||
    ocrLower.includes('xray') ||
    ocrLower.includes('tibial') ||
    ocrLower.includes('patella') ||
    ocrLower.includes('condyle') ||
    ocrLower.includes('fracture') ||
    ocrLower.includes('ap view') ||
    ocrLower.includes('lateral view');

  const finalIsRadiograph = isPlainXRay || hasRadiographOcrText;

  return {
    filePath,
    fileName,
    fileType: ext.replace('.', ''),
    totalPages: 1,
    fullText: ocrResult.fullText,
    lines: ocrResult.lines,
    isReadableDocument: ocrResult.lines.length > 0 || finalIsRadiograph,
    isRadiographFilm: finalIsRadiograph
  };
}

/**
 * Analyzes bitmap grayscale density and contextual markers to identify plain digital radiograph films
 */
async function detectRadiographFilm(imageBuffer, fileName = '', filePath = '') {
  try {
    const combinedContext = `${fileName} ${filePath}`.toLowerCase();
    const radiographKeywords = [
      'xray', 'x-ray', 'radiograph', 'knee', 'fracture', 'bone', 'ortho',
      'tibia', 'fibula', 'femur', 'patella', 'wrist', 'hand', 'chest', 'spine',
      'shoulder', 'elbow', 'pelvis', 'clavicle', 'skull', 'humerus', 'radius', 'ulna',
      'joint', 'limb'
    ];
    if (radiographKeywords.some(kw => combinedContext.includes(kw))) {
      return true;
    }

    const stats = await sharp(imageBuffer).stats();
    const channels = stats.channels;
    if (!channels || channels.length < 3) return true;

    const rMean = channels[0].mean;
    const gMean = channels[1].mean;
    const bMean = channels[2].mean;

    // Grayscale check with tolerance for photographed screens / lighting variations
    const isGrayscale = Math.abs(rMean - gMean) < 22 && Math.abs(gMean - bMean) < 22 && Math.abs(rMean - bMean) < 25;
    const avgMean = (rMean + gMean + bMean) / 3;
    const avgStdev = (channels[0].stdev + channels[1].stdev + channels[2].stdev) / 3;

    // A radiographic film is grayscale with non-white background and significant density variation
    if (isGrayscale && (avgMean < 165 || avgStdev > 35)) {
      return true;
    }

    return false;
  } catch (e) {
    return false;
  }
}

export function resolveUploadedFilePath(inputPath) {
  if (!inputPath) return inputPath;
  if (fs.existsSync(inputPath)) return inputPath;

  const cleanRel = inputPath.replace(/^[/\\]+/, '');
  const cleanAfterUploads = cleanRel.replace(/^uploads[/\\]+/i, '');
  const baseName = path.basename(inputPath);

  const candidateBases = [
    process.cwd(),
    path.join(process.cwd(), 'backend'),
    path.join(process.cwd(), '..', 'backend'),
    'E:/clone app/backend',
    'D:/clone app/backend'
  ];

  const candidatePaths = [
    inputPath,
    path.resolve(cleanRel)
  ];

  for (const base of candidateBases) {
    candidatePaths.push(path.join(base, cleanRel));
    candidatePaths.push(path.join(base, 'uploads', cleanAfterUploads));
    candidatePaths.push(path.join(base, 'uploads', cleanRel));
    candidatePaths.push(path.join(base, 'uploads', 'patient', 'PAT1001', baseName));
    candidatePaths.push(path.join(base, 'uploads', baseName));
  }

  for (const c of candidatePaths) {
    if (fs.existsSync(c)) return c;
  }

  for (const base of candidateBases) {
    const uplDir = path.join(base, 'uploads');
    if (fs.existsSync(uplDir)) {
      const found = findFileRecursive(uplDir, baseName);
      if (found) return found;
    }
  }

  return inputPath;
}

function findFileRecursive(dir, targetName) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        const found = findFileRecursive(full, targetName);
        if (found) return found;
      } else if (entry.name.toLowerCase() === targetName.toLowerCase()) {
        return full;
      }
    }
  } catch (e) {}
  return null;
}

export { extractPdfText, performOcr };
export default ingestDocument;
