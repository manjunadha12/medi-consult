/**
 * OCR Correction and JSON Extraction Prompt
 */
export function buildExtractionPrompt(documentText, fileName = '') {
  return `You are a Senior Pathologist and Medical Data Specialist. Extract all clinical laboratory tests, values, units, and ranges from this scanned medical document (${fileName}):

DOCUMENT TEXT:
${documentText}

Format output as JSON with tests, units, and reference ranges.`;
}

export default buildExtractionPrompt;
