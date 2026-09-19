import { evaluateReferenceRange } from './referenceRanges.js';
import { checkCriticalPanic, CRITICAL_PANIC_LIMITS } from './criticalValues.js';
import { evaluatePatterns, CLINICAL_PATTERNS } from './patternRules.js';
import { evaluateRelationships } from './relationshipRules.js';

export {
  evaluateReferenceRange,
  checkCriticalPanic,
  CRITICAL_PANIC_LIMITS,
  evaluatePatterns,
  CLINICAL_PATTERNS,
  evaluateRelationships
};

export default {
  evaluateReferenceRange,
  checkCriticalPanic,
  evaluateRelationships
};
