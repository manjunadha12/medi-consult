/**
 * Longitudinal Health Trend Prompt
 */
export function buildTrendPrompt(currentResults, priorResults) {
  return `Evaluate longitudinal health trajectory between current and prior report parameters:
Current: ${JSON.stringify(currentResults)}
Prior: ${JSON.stringify(priorResults)}`;
}

export default buildTrendPrompt;
