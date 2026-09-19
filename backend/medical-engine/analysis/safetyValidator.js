import medicalDb from '../medical-db/index.js';

/**
 * Biological Safety, Plausibility & Contradiction Guardrails
 */
export function validateSafety(structuredResults) {
  return structuredResults.map(res => {
    const testDef = medicalDb.findByCode(res.code);
    let plausibilityWarning = null;
    let needsVerification = false;

    if (testDef?.plausibilityRange && typeof res.value === 'number') {
      const { min, max } = testDef.plausibilityRange;
      if (res.value < min || res.value > max) {
        plausibilityWarning = `Value (${res.value}) is outside expected physiological bounds (${min} - ${max} ${res.unit}). Verification recommended.`;
        needsVerification = true;
      }
    }

    return {
      ...res,
      plausibilityWarning,
      needsVerification,
      confidence: needsVerification ? 50 : (res.confidence || 90),
      confidenceLabel: needsVerification ? "Manual Verification" : "High"
    };
  });
}

export default validateSafety;
