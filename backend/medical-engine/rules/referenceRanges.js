import medicalDb from '../medical-db/index.js';

/**
 * Deterministic Biological Reference Range Evaluator
 * Priority: Printed Report Range > Demographic (Age/Sex) > Standard Knowledge Base
 */
export function evaluateReferenceRange(val, testDef, reportedRange, demographics = {}) {
  // 1. Check if qualitative
  if (typeof val !== 'number' || isNaN(val)) {
    return {
      status: "NORMAL",
      severity: "normal",
      referenceRange: reportedRange || "Standard",
      rangeSource: "Qualitative Normal"
    };
  }

  // 2. Parse range bounds
  let min = null, max = null;
  let rangeSource = "Standard Biological Range";

  if (reportedRange && reportedRange.includes('-')) {
    const parts = reportedRange.split('-').map(p => parseFloat(p.trim()));
    if (!isNaN(parts[0]) && !isNaN(parts[1])) {
      min = parts[0];
      max = parts[1];
      rangeSource = "Printed Report Range";
    }
  }

  if (min === null && testDef?.ranges) {
    const sex = (demographics.sex || '').toLowerCase();
    if (sex === 'male' && testDef.ranges.male) {
      min = testDef.ranges.male.min;
      max = testDef.ranges.male.max;
      rangeSource = "Demographic Range (Male)";
    } else if (sex === 'female' && testDef.ranges.female) {
      min = testDef.ranges.female.min;
      max = testDef.ranges.female.max;
      rangeSource = "Demographic Range (Female)";
    } else if (testDef.ranges.standard) {
      min = testDef.ranges.standard.min;
      max = testDef.ranges.standard.max;
    }
  }

  if (min === null || max === null) {
    return {
      status: "NORMAL",
      severity: "normal",
      referenceRange: reportedRange || "Standard",
      rangeSource
    };
  }

  let status = "NORMAL";
  let severity = "normal";

  if (val < min) {
    status = "LOW";
    severity = (min - val) / min > 0.25 ? "critical" : "abnormal";
  } else if (val > max) {
    status = "HIGH";
    severity = (val - max) / max > 0.35 ? "critical" : "abnormal";
  }

  return {
    status,
    severity,
    referenceRange: `${min} - ${max} ${testDef?.unit || ''}`.trim(),
    rangeSource
  };
}

export default evaluateReferenceRange;
