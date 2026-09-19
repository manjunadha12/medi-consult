import { ingestDocument } from './ingestion/index.js';
import { detectDocument, extractMedicalDocument } from './extraction/index.js';
import { medicalDb } from './medical-db/index.js';
import { evaluateAbnormalities, correlateFindings, calculateTrends, calculateRiskLevel, validateSafety } from './analysis/index.js';
import { generateClinicalReport } from './report/index.js';
import { analyzeRadiographFilm } from './vision/radiographAnalyzer.js';
import searchMedicalTextbooks from './books/bookSearchEngine.js';

/**
 * Universal Medical Document Processing Engine
 * Orchestrates: ingestion -> extraction -> medical-db -> rules -> analysis -> report
 */
export async function processMedicalDocument({ filePath, fileName = '', previousReports = [], manualOverrides = null }) {
  const startTime = Date.now();

  // 1. Ingestion Layer (PDF / OCR / Sharp)
  const extractedDoc = await ingestDocument(filePath, fileName);
  if (fileName) extractedDoc.fileName = fileName;
  const actualFilePath = extractedDoc.filePath || filePath;

  // 2. Extraction Layer (Document Detection & Strict Gatekeeping)
  const classification = detectDocument(extractedDoc);

  if (classification.isNonMedicalImage || !extractedDoc.isReadableDocument) {
    const processingTimeMs = Date.now() - startTime;
    return {
      engineVersion: medicalDb.version,
      engineName: medicalDb.system,
      isNonMedicalImage: true,
      processingTimeMs,
      fileMetadata: {
        fileType: extractedDoc.fileType,
        totalPages: extractedDoc.totalPages,
        totalLinesExtracted: extractedDoc.lines.length
      },
      demographics: {
        patientName: null,
        age: null,
        sex: null,
        reportDate: new Date().toLocaleDateString(),
        hospitalName: null,
        doctorName: null
      },
      documentBadges: [],
      classifiedCategories: [],
      riskLevel: 'Low',
      metricsSummary: {
        totalTests: 0,
        normalCount: 0,
        abnormalCount: 0,
        criticalCount: 0,
        diagnosticsCount: 0
      },
      categorizedResults: [],
      structuredResults: [],
      diagnosticFindings: [],
      clinicalNotes: {},
      relationshipPatterns: [],
      healthTrends: { hasPreviousData: false, trends: [] },
      summary: "No readable medical report text found. The uploaded file appears to be a photo or unreadable image rather than a medical document with clinical values.",
      auditTrail: {
        processedAt: new Date().toISOString(),
        sourceLinesCount: extractedDoc.lines.length,
        verifiedByUser: false,
        note: "Non-medical image / no clinical text detected."
      }
    };
  }

  // 3. Structured Parsing & Extraction Layer
  const parsedData = extractMedicalDocument(extractedDoc, classification);

  // If Direct Radiograph Film or Radiology Imaging, run Computer Vision fracture locator
  if (extractedDoc.isRadiographFilm === true || classification.documentType === 'RADIOLOGY_IMAGING') {
    const radAnalysis = await analyzeRadiographFilm(actualFilePath, extractedDoc, fileName);
    if (radAnalysis.structuredParams && radAnalysis.structuredParams.length > 0) {
      parsedData.structuredResults.push(...radAnalysis.structuredParams);
    }
    if (radAnalysis.diagnosticSummary) {
      parsedData.diagnosticFindings = parsedData.diagnosticFindings.filter(f => f.type !== 'radiograph_film');
      parsedData.diagnosticFindings.unshift(radAnalysis.diagnosticSummary);
    }
  }

  // Apply manual overrides if verified
  let workingResults = parsedData.structuredResults;
  if (manualOverrides && Array.isArray(manualOverrides)) {
    workingResults = workingResults.map(res => {
      const override = manualOverrides.find(o => o.testId === res.testId || o.code === res.code);
      if (override) {
        return {
          ...res,
          value: parseFloat(override.value) || res.value,
          unit: override.unit || res.unit,
          reportedRange: override.reportedRange || res.reportedRange,
          confidence: 100,
          confidenceLabel: "Manually Verified",
          needsVerification: false,
          verifiedByUser: true
        };
      }
      return res;
    });
  }

  // 4. Analysis Layer: Rules, Abnormalities, Safety, Correlation, Trends, Risk
  const evaluatedResults = evaluateAbnormalities(workingResults, parsedData.demographics);
  const validatedResults = validateSafety(evaluatedResults);
  const relationshipPatterns = correlateFindings(validatedResults, parsedData.diagnosticFindings, parsedData.clinicalNotes);
  const healthTrends = calculateTrends(validatedResults, previousReports);
  const riskLevel = calculateRiskLevel(validatedResults, relationshipPatterns);

  const normalCount = validatedResults.filter(r => r.severity === 'normal').length;
  const abnormalCount = validatedResults.filter(r => r.severity === 'abnormal').length;
  const criticalCount = validatedResults.filter(r => r.severity === 'critical').length;

  const categorizedResults = groupResultsByCategory(validatedResults, parsedData.diagnosticFindings);
  const processingTimeMs = Date.now() - startTime;

  const baseResult = {
    engineVersion: medicalDb.version,
    engineName: medicalDb.system,
    isNonMedicalImage: false,
    processingTimeMs,
    fileMetadata: {
      fileType: extractedDoc.fileType,
      totalPages: extractedDoc.totalPages,
      totalLinesExtracted: extractedDoc.lines.length
    },
    demographics: parsedData.demographics,
    documentBadges: classification.documentBadges,
    classifiedCategories: classification.classifiedCategories,
    riskLevel,
    metricsSummary: {
      totalTests: validatedResults.length,
      normalCount,
      abnormalCount,
      criticalCount,
      diagnosticsCount: parsedData.diagnosticFindings.length
    },
    categorizedResults,
    structuredResults: validatedResults,
    diagnosticFindings: parsedData.diagnosticFindings,
    clinicalNotes: parsedData.clinicalNotes,
    relationshipPatterns,
    healthTrends,
    auditTrail: {
      processedAt: new Date().toISOString(),
      sourceLinesCount: extractedDoc.lines.length,
      verifiedByUser: Boolean(manualOverrides)
    }
  };

  // 5. Report Layer & Textbook References: Clinical Synthesis, Risks, Recommendations, Routing, Citations
  const bookSearch = searchMedicalTextbooks({
    structuredResults: validatedResults,
    diagnosticFindings: parsedData.diagnosticFindings,
    relationshipPatterns,
    documentBadges: classification.documentBadges
  });

  const clinicalReport = generateClinicalReport(baseResult);

  return {
    ...baseResult,
    summary: clinicalReport.summary,
    keyRisks: clinicalReport.keyRisks,
    recommendations: clinicalReport.recommendations,
    aiKeyRisks: clinicalReport.keyRisks,
    aiRecommendations: clinicalReport.recommendations,
    suggestedSpecialist: clinicalReport.suggestedSpecialist,
    textbookCitations: bookSearch.citations || [],
    matchedBooksCount: bookSearch.matchedBooksCount || 0,
    totalBooksIndexed: bookSearch.totalBooksIndexed || 23,
    _executedEngine: 'local'
  };
}

export function generateLocalClinicalSynthesis(engineResult) {
  return generateClinicalReport(engineResult);
}

function groupResultsByCategory(results, diagnostics) {
  const map = {};

  for (const r of results) {
    const catId = r.categoryId || 'general';
    if (!map[catId]) {
      map[catId] = {
        id: catId,
        name: r.category || 'General',
        icon: r.categoryIcon || '📋',
        tests: [],
        diagnostics: []
      };
    }
    map[catId].tests.push(r);
  }

  for (const d of diagnostics) {
    const catId = (d.category || 'general').toLowerCase().replace(/[^a-z]/g, '_');
    const matchedKey = Object.keys(map).find(k => k.includes(catId) || catId.includes(k)) || 'general';
    if (!map[matchedKey]) {
      map[matchedKey] = {
        id: matchedKey,
        name: d.category || 'Specialized Diagnostic',
        icon: d.icon || '🔬',
        tests: [],
        diagnostics: []
      };
    }
    map[matchedKey].diagnostics.push(d);
  }

  return Object.values(map);
}

// Module Re-exports
export * from './ingestion/index.js';
export * from './extraction/index.js';
export * from './medical-db/index.js';
export * from './rules/index.js';
export * from './llm/index.js';
export * from './analysis/index.js';
export * from './report/index.js';
export { medicalDb as knowledgeBase };
export { extractMedicalDocument as parseMedicalDocument } from './extraction/index.js';
export { evaluateAbnormalities as evaluateLabRules } from './analysis/index.js';
export { calculateTrends as calculateHealthTrends } from './analysis/index.js';
export { detectDocument as classifyDocument } from './extraction/index.js';

export default processMedicalDocument;
