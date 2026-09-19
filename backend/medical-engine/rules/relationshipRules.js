import { evaluatePatterns } from './patternRules.js';

/**
 * Cross-Parameter Relationship Evaluator
 */
export function evaluateRelationships(structuredResults, diagnosticFindings = [], clinicalNotes = {}) {
  const patterns = evaluatePatterns(structuredResults);
  return patterns;
}

export default evaluateRelationships;
