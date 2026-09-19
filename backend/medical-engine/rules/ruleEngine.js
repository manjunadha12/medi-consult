/**
 * Deterministic Rule Engine for Clinical Reference Range Evaluation
 * Evaluates values with range priority:
 * 1. Printed Range on Patient Report (Highest Priority)
 * 2. Sex/Age Specific Demographic Range from Knowledge Base
 * 3. Default Standard Laboratory Interval
 */
export function evaluateLabRules(structuredResults, demographics) {
  const evaluatedResults = [];

  for (const item of structuredResults) {
    const val = item.value;
    let min = null;
    let max = null;
    let status = item.evaluatedStatus || 'NORMAL';
    let severity = item.severity || 'normal'; // 'normal', 'borderline', 'abnormal', 'critical'
    let effectiveRangeText = '';
    let rangeSource = 'Standard Knowledge Base';

    // 1. Try to parse reported printed range or pre-configured reference range
    const candidateRange = item.reportedRange || item.referenceRange;
    if (candidateRange) {
      const parsedReported = parseRangeString(candidateRange);
      if (parsedReported.min !== null || parsedReported.max !== null) {
        min = parsedReported.min;
        max = parsedReported.max;
        effectiveRangeText = candidateRange;
        rangeSource = item.reportedRange ? 'Printed on Report' : 'Clinical Diagnostic Range';
      }
    }

    // 2. If no reported range, use Demographic / Gender / Standard from Knowledge Base
    if (min === null && max === null) {
      const sex = (demographics.sex || '').toLowerCase();
      const defaultRanges = item.defaultRanges || {};

      if (sex === 'female' && defaultRanges.female) {
        min = defaultRanges.female.min ?? null;
        max = defaultRanges.female.max ?? null;
        effectiveRangeText = `${min ?? 0} - ${max ?? '∞'}`;
        rangeSource = 'Female Demographic Range';
      } else if (sex === 'male' && defaultRanges.male) {
        min = defaultRanges.male.min ?? null;
        max = defaultRanges.male.max ?? null;
        effectiveRangeText = `${min ?? 0} - ${max ?? '∞'}`;
        rangeSource = 'Male Demographic Range';
      } else if (defaultRanges.normal) {
        min = defaultRanges.normal.min ?? null;
        max = defaultRanges.normal.max ?? null;
        effectiveRangeText = `${min ?? 0} - ${max ?? '∞'}`;
      } else if (defaultRanges.optimal || defaultRanges.desirable) {
        const opt = defaultRanges.optimal || defaultRanges.desirable;
        min = opt.min ?? null;
        max = opt.max ?? null;
        effectiveRangeText = `< ${max ?? '∞'}`;
      }
    }

    // 3. Determine status against boundaries
    if (val !== null && !isNaN(val)) {
      if (min !== null && val < min) {
        status = 'LOW';
        severity = 'abnormal';
      } else if (max !== null && val > max) {
        status = 'HIGH';
        severity = 'abnormal';
      } else {
        status = 'NORMAL';
        severity = 'normal';
      }

      // Check Critical Threshold limits
      const crit = item.criticalThresholds || {};
      if (crit.low !== undefined && val <= crit.low) {
        status = 'CRITICAL_LOW';
        severity = 'critical';
      } else if (crit.high !== undefined && val >= crit.high) {
        status = 'CRITICAL_HIGH';
        severity = 'critical';
      }
    }

    // 4. Incorporate reported flag ONLY when no mathematical reference interval was available
    if (min === null && max === null) {
      if (item.reportedFlag && (item.reportedFlag === 'HIGH' || item.reportedFlag === 'H' || item.reportedFlag === 'CRITICAL')) {
        status = 'HIGH';
        severity = 'abnormal';
      } else if (item.reportedFlag && (item.reportedFlag === 'LOW' || item.reportedFlag === 'L')) {
        status = 'LOW';
        severity = 'abnormal';
      }
    }

    evaluatedResults.push({
      ...item,
      evaluatedStatus: status,
      severity,
      referenceRange: effectiveRangeText || 'Standard Lab Range',
      rangeSource
    });
  }

  return evaluatedResults;
}

/**
 * Parses numeric min and max from range strings (e.g., "13.0 - 17.0", "< 200", "0.7 to 1.3", ">= 60")
 */
function parseRangeString(str) {
  if (!str) return { min: null, max: null };
  const clean = str.replace(/[()]/g, '').trim();

  // Pattern: "13.0 - 17.0" or "0.7 to 1.3"
  const dashMatch = clean.match(/(\d+(?:\.\d+)?)\s*[-–toTO]\s*(\d+(?:\.\d+)?)/i);
  if (dashMatch) {
    return {
      min: parseFloat(dashMatch[1]),
      max: parseFloat(dashMatch[2])
    };
  }

  // Pattern: "< 200" or "<= 150"
  const lessMatch = clean.match(/[<≤]=?\s*(\d+(?:\.\d+)?)/);
  if (lessMatch) {
    return {
      min: 0,
      max: parseFloat(lessMatch[1])
    };
  }

  // Pattern: "> 60" or ">= 90"
  const greaterMatch = clean.match(/[>≥]=?\s*(\d+(?:\.\d+)?)/);
  if (greaterMatch) {
    return {
      min: parseFloat(greaterMatch[1]),
      max: 999999
    };
  }

  return { min: null, max: null };
}
