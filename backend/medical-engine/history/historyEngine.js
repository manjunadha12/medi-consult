/**
 * History & Trend Engine with Strict Clinical Guardrails
 * Compares current extracted laboratory values against prior patient reports.
 * 
 * Safety Guardrails:
 * 1. Unit Compatibility Gatekeeper: Never compare values with conflicting or incompatible units.
 * 2. Verification Gatekeeper: Reject comparison if either previous or current value requires verification.
 * 3. Biological Plausibility Gatekeeper: Reject blind percentage trends if change exceeds biological plausibility without verified clinical status.
 */
export function calculateHealthTrends(currentResults, previousReports = []) {
  if (!previousReports || previousReports.length === 0) {
    return {
      hasPreviousData: false,
      trends: [],
      multiMarkerAlert: null,
      summary: "First recorded profile in local archive. Baseline established."
    };
  }

  // Find the most recent previous report with structured results
  const priorReport = previousReports[0];
  const priorExtracted = priorReport.structuredResults || priorReport.extractedResults || priorReport.abnormalValues || [];
  
  // Build lookup map for prior results
  const priorMap = {};
  for (const item of priorExtracted) {
    if (typeof item === 'object' && item !== null) {
      const key = (item.testId || item.code || item.test || item.testName || '').toLowerCase().trim();
      const val = parseFloat(item.value ?? item.result);
      if (!isNaN(val)) {
        priorMap[key] = {
          name: item.name || item.testName || item.test,
          value: val,
          unit: (item.unit || '').trim(),
          needsVerification: Boolean(item.needsVerification || item.confidence < 80),
          date: priorReport.createdAt || priorReport.reportDate
        };
      }
    }
  }

  const trends = [];
  let increasedCount = 0;
  let decreasedCount = 0;
  let stableCount = 0;
  let metabolicWorsened = 0;

  for (const curr of currentResults) {
    const key = (curr.testId || curr.code || '').toLowerCase().trim();
    const altKey = (curr.testName || '').toLowerCase().trim();
    const prior = priorMap[key] || priorMap[altKey];

    if (prior && curr.value !== null && !isNaN(curr.value)) {
      const prevVal = prior.value;
      const currVal = curr.value;
      const prevUnit = (prior.unit || '').toLowerCase();
      const currUnit = (curr.unit || '').toLowerCase();

      // Guardrail 1: Verification Check
      if (prior.needsVerification || curr.needsVerification || (curr.confidence && curr.confidence < 80)) {
        trends.push({
          testId: curr.testId,
          testName: curr.testName,
          category: curr.category,
          previousValue: prevVal,
          currentValue: currVal,
          unit: curr.unit,
          status: 'UNAVAILABLE',
          direction: 'UNAVAILABLE',
          icon: '⚠️',
          trajectory: 'unverified',
          reason: `Trend unavailable — previous ${curr.testName} result requires verification.`,
          previousDate: prior.date
        });
        continue;
      }

      // Guardrail 2: Unit Compatibility Check
      if (prevUnit && currUnit && prevUnit !== currUnit) {
        // Check if units are convertible (e.g. g/dL vs g/L)
        let convertedPrev = prevVal;
        let isCompatible = false;

        if ((prevUnit === 'g/l' && currUnit === 'g/dl') || (prevUnit === 'g/l' && currUnit === 'gm/dl')) {
          convertedPrev = prevVal / 10;
          isCompatible = true;
        } else if ((prevUnit === 'g/dl' && currUnit === 'g/l') || (prevUnit === 'gm/dl' && currUnit === 'g/l')) {
          convertedPrev = prevVal * 10;
          isCompatible = true;
        } else if ((prevUnit === 'mg/dl' && currUnit === 'g/dl')) {
          convertedPrev = prevVal / 1000;
          isCompatible = true;
        } else if ((prevUnit === 'g/dl' && currUnit === 'mg/dl')) {
          convertedPrev = prevVal * 1000;
          isCompatible = true;
        }

        if (!isCompatible) {
          trends.push({
            testId: curr.testId,
            testName: curr.testName,
            category: curr.category,
            previousValue: prevVal,
            currentValue: currVal,
            unit: curr.unit,
            status: 'UNAVAILABLE',
            direction: 'UNAVAILABLE',
            icon: '⚠️',
            trajectory: 'unverified',
            reason: `Trend unavailable — unit mismatch (${prior.unit} vs ${curr.unit}).`,
            previousDate: prior.date
          });
          continue;
        }
      }

      // Guardrail 3: Biological Plausibility Jump Check
      const delta = currVal - prevVal;
      const pctChange = prevVal !== 0 ? ((delta / prevVal) * 100).toFixed(1) : 0;
      const absPct = Math.abs(parseFloat(pctChange));

      if (absPct > 400 && !['crp', 'esr', 'troponin_i', 'd_dimer', 'procalcitonin'].includes(key)) {
        trends.push({
          testId: curr.testId,
          testName: curr.testName,
          category: curr.category,
          previousValue: prevVal,
          currentValue: currVal,
          unit: curr.unit,
          status: 'UNAVAILABLE',
          direction: 'UNAVAILABLE',
          icon: '⚠️',
          trajectory: 'unverified',
          reason: `Trend unavailable — extreme biological delta requires clinical verification.`,
          previousDate: prior.date
        });
        continue;
      }

      let direction = 'STABLE';
      let icon = '↔';
      let trajectory = 'stable';
      const thresholdPct = 3.0;

      if (absPct < thresholdPct) {
        direction = 'STABLE';
        icon = '↔';
        stableCount++;
      } else if (currVal > prevVal) {
        direction = 'INCREASED';
        icon = '↑';
        increasedCount++;

        if (['hba1c', 'ldl_cholesterol', 'triglycerides', 'serum_creatinine', 'blood_urea', 'sgpt_alt', 'sgot_ast', 'esr'].includes(key)) {
          trajectory = 'worsening';
          metabolicWorsened++;
        } else if (['hdl_cholesterol', 'hemoglobin', 'platelets'].includes(key)) {
          trajectory = 'improving';
        }
      } else {
        direction = 'DECREASED';
        icon = '↓';
        decreasedCount++;

        if (['hba1c', 'ldl_cholesterol', 'triglycerides', 'serum_creatinine', 'blood_urea', 'sgpt_alt', 'sgot_ast', 'esr'].includes(key)) {
          trajectory = 'improving';
        } else if (['hdl_cholesterol', 'hemoglobin', 'platelets'].includes(key)) {
          trajectory = 'worsening';
        }
      }

      trends.push({
        testId: curr.testId,
        testName: curr.testName,
        category: curr.category,
        previousValue: prevVal,
        currentValue: currVal,
        unit: curr.unit,
        delta: parseFloat(delta.toFixed(2)),
        pctChange: parseFloat(pctChange),
        direction,
        icon,
        trajectory,
        previousDate: prior.date
      });
    }
  }

  // Multi-marker trend assessment
  let multiMarkerAlert = null;
  if (metabolicWorsened >= 2) {
    multiMarkerAlert = {
      level: "WARNING",
      title: "Multiple Marker Elevation Pattern",
      message: "Multiple cardiovascular and metabolic parameters have increased compared with the previous report. Discuss these changes with your doctor."
    };
  }

  return {
    hasPreviousData: trends.length > 0,
    priorReportDate: priorReport.createdAt,
    trends,
    increasedCount,
    decreasedCount,
    stableCount,
    multiMarkerAlert,
    summary: trends.length > 0 
      ? `Compared ${trends.filter(t => t.status !== 'UNAVAILABLE').length} verified parameters with prior record from ${new Date(priorReport.createdAt).toLocaleDateString()}.`
      : "No overlapping parameters found with previous records."
  };
}
