/**
 * Risk Profiling & Stratification Engine
 */
export function calculateRiskLevel(structuredResults, relationshipPatterns = []) {
  const criticalCount = structuredResults.filter(r => r.severity === 'critical').length;
  const abnormalCount = structuredResults.filter(r => r.severity === 'abnormal').length;

  if (criticalCount > 0) return 'High';
  if (abnormalCount >= 2 || relationshipPatterns.length > 0) return 'Medium';
  return 'Low';
}

export default calculateRiskLevel;
