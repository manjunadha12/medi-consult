/**
 * Longitudinal Health Trend Engine with Strict Unit & Safety Verification Guardrails
 */
export function calculateTrends(currentResults, priorReports = []) {
  if (!priorReports || priorReports.length === 0) {
    return { hasPreviousData: false, trends: [] };
  }

  const trends = [];
  const latestPrior = priorReports[0];
  const priorResults = latestPrior.structuredResults || [];

  for (const curr of currentResults) {
    if (typeof curr.value !== 'number' || isNaN(curr.value)) continue;

    const prior = priorResults.find(p => (curr.testId && p.testId === curr.testId) || (curr.code && p.code === curr.code));
    if (!prior || typeof prior.value !== 'number' || isNaN(prior.value)) continue;

    // Unit mismatch guardrail
    if (curr.unit && prior.unit && curr.unit.toLowerCase() !== prior.unit.toLowerCase()) {
      trends.push({
        testId: curr.testId || curr.code,
        testName: curr.testName,
        code: curr.code,
        status: "UNAVAILABLE",
        reason: `Trend unavailable — unit mismatch (${prior.unit} vs ${curr.unit}).`,
        currentValue: curr.value,
        priorValue: prior.value,
        trendDirection: "UNAVAILABLE"
      });
      continue;
    }

    // Safety / Unverified Prior Result Guardrail
    if (prior.needsVerification || curr.needsVerification) {
      trends.push({
        testId: curr.testId || curr.code,
        testName: curr.testName,
        code: curr.code,
        status: "UNAVAILABLE",
        reason: `Trend unavailable — previous ${curr.testName} result requires verification.`,
        currentValue: curr.value,
        priorValue: prior.value,
        trendDirection: "UNAVAILABLE"
      });
      continue;
    }

    const delta = curr.value - prior.value;
    const pct = prior.value !== 0 ? (delta / prior.value) * 100 : 0;
    const direction = Math.abs(pct) < 3 ? "STABLE" : (delta > 0 ? "INCREASING" : "DECREASING");

    trends.push({
      testId: curr.testId || curr.code,
      testName: curr.testName,
      code: curr.code,
      status: "AVAILABLE",
      currentValue: curr.value,
      priorValue: prior.value,
      unit: curr.unit,
      delta: parseFloat(delta.toFixed(2)),
      percentChange: parseFloat(pct.toFixed(1)),
      trendDirection: direction,
      priorReportDate: latestPrior.demographics?.reportDate || new Date(latestPrior.createdAt).toLocaleDateString()
    });
  }

  return {
    hasPreviousData: trends.length > 0,
    trends
  };
}

export default calculateTrends;
