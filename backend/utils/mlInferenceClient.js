/**
 * Medi Consult - Clinical Machine Learning Inference Client
 * Bridges the Node.js backend to the Python FastAPI ML microservice (port 5050).
 */

const ML_API_BASE_URL = process.env.ML_API_BASE_URL || 'http://127.0.0.1:5050';

/**
 * Dispatches an extracted medical report to the specialized clinical model.
 * 
 * @param {Object} params
 * @param {string} params.filePath - Local filesystem path to the uploaded PDF/image/DICOM.
 * @param {string} params.fileName - Original file name.
 * @param {string} params.fileType - File extension (.pdf, .png, .jpg, .dcm).
 * @param {string} params.category - Clinical category (Blood, Chest X-ray, Lung CT, Brain MRI, ECG).
 * @param {string} params.extractedText - OCR or raw text extracted from document.
 * @param {Array} params.structuredResults - Structured laboratory analytes and measurements.
 * @returns {Promise<Object>} ML inference findings, risk score, limitations, and verification status.
 */
export async function dispatchToClinicalML({
  filePath,
  fileName,
  fileType,
  category = 'General',
  extractedText = '',
  structuredResults = []
}) {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    const response = await fetch(`${ML_API_BASE_URL}/api/ml/dispatch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filePath,
        fileName,
        fileType,
        category,
        extractedText,
        structuredResults
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[ML_CLIENT_WARN] ML API returned HTTP ${response.status}`);
      return generateFallbackResult(category, structuredResults);
    }

    const data = await response.json();
    return {
      ...data,
      modelType: data.modelType || 'Clinical-ML',
      modelUsed: data.modelUsed || 'Medi Consult Medical AI',
      clinicalCategory: data.clinicalCategory || category,
      riskScore: data.riskScore ?? (data.riskLevel === 'High' ? 0.85 : (data.riskLevel === 'Medium' ? 0.50 : 0.15)),
      riskLevel: data.riskLevel || 'Low',
      confidenceScore: data.confidenceScore ?? data.confidence ?? (data.fractureProbability != null ? data.fractureProbability : null),
      isAbnormal: data.isAbnormal ?? (data.riskLevel === 'High' || data.isFractured || data.isInvasiveAdenocarcinoma || false),
      findings: data.findings || data.abnormalFindings || ['Analysis complete. Within expected baseline.'],
      abnormalValues: data.abnormalValues || [],
      analysisLimitations: data.analysisLimitations || 'AI screening assistant only. Requires licensed physician confirmation.',
      doctorReviewStatus: data.doctorReviewStatus || 'PENDING_VERIFICATION',
      processedAt: new Date()
    };
  } catch (error) {
    console.warn(`[ML_CLIENT_NOTICE] ML Inference service unreachable (${error.message}). Using local rule fallback.`);
    return generateFallbackResult(category, structuredResults);
  }
}

function generateFallbackResult(category, structuredResults = []) {
  const abnormalItems = (structuredResults || []).filter(
    r => r.severity === 'abnormal' || r.severity === 'critical'
  );
  const isAbnormal = abnormalItems.length > 0;

  return {
    modelType: 'Standard-Rule-Engine',
    modelUsed: 'Medi Consult Clinical Reference Engine',
    clinicalCategory: category,
    riskScore: isAbnormal ? 0.70 : 0.10,
    riskLevel: isAbnormal ? 'Medium' : 'Low',
    isAbnormal,
    findings: isAbnormal
      ? abnormalItems.map(i => `${i.name || i.label}: ${i.value} ${i.unit || ''} (${i.severity || 'Out of range'})`)
      : ['No acute critical abnormalities detected in laboratory panel.'],
    abnormalValues: abnormalItems,
    analysisLimitations: 'Standard clinical reference matching. Requires licensed physician review.',
    doctorReviewStatus: 'PENDING_VERIFICATION',
    processedAt: new Date()
  };
}

