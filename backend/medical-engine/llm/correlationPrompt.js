/**
 * Cross-Marker Clinical Correlation Prompt
 */
export function buildCorrelationPrompt(abnormals, patterns) {
  return `Analyze cross-marker physiological correlations between these abnormal parameters and patterns:
Abnormals: ${JSON.stringify(abnormals)}
Patterns: ${JSON.stringify(patterns)}`;
}

export default buildCorrelationPrompt;
