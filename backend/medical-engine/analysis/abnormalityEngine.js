import { evaluateReferenceRange } from '../rules/referenceRanges.js';
import medicalDb from '../medical-db/index.js';

/**
 * Abnormality & Parameter Severity Classification Engine
 */
export function evaluateAbnormalities(workingResults, demographics = {}) {
  return workingResults.map(res => {
    // 1. If result is already explicitly evaluated as abnormal or qualitative finding
    if (res.evaluatedStatus === 'ABNORMAL' || res.severity === 'abnormal' || res.severity === 'critical') {
      return {
        ...res,
        evaluatedStatus: res.evaluatedStatus || (res.severity === 'critical' ? 'CRITICAL' : 'ABNORMAL'),
        severity: res.severity || 'abnormal',
        referenceRange: res.referenceRange || 'Intact / Normal',
        rangeSource: res.rangeSource || 'Direct Diagnostic Finding'
      };
    }

    const testDef = medicalDb.findByCode(res.code) || { unit: res.unit };
    const evalResult = evaluateReferenceRange(res.value, testDef, res.reportedRange, demographics);

    // If qualitative test string contains obvious abnormal keywords
    if (typeof res.value !== 'number' && typeof res.valueString === 'string') {
      const vsLower = res.valueString.toLowerCase();
      if (vsLower.includes('disrupted') || vsLower.includes('fracture') || vsLower.includes('step-off') || vsLower.includes('abnormal') || vsLower.includes('positive') || vsLower.includes('lesion') || vsLower.includes('mass')) {
        return {
          ...res,
          evaluatedStatus: 'ABNORMAL',
          severity: 'abnormal',
          referenceRange: res.referenceRange || 'Intact / Normal',
          rangeSource: 'Qualitative Clinical Evaluation'
        };
      }
    }

    return {
      ...res,
      evaluatedStatus: evalResult.status,
      severity: evalResult.severity,
      referenceRange: evalResult.referenceRange,
      rangeSource: evalResult.rangeSource
    };
  });
}

export default evaluateAbnormalities;
