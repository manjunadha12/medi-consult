import { evaluateRelationships } from '../rules/relationshipRules.js';

/**
 * Cross-Organ Correlation Engine
 */
export function correlateFindings(structuredResults, diagnosticFindings = [], clinicalNotes = {}) {
  return evaluateRelationships(structuredResults, diagnosticFindings, clinicalNotes);
}

export default correlateFindings;
