/**
 * Extracts quantitative values, qualitative flags, units, and printed reference intervals
 */
export function extractValueAndRange(lineText, testDef) {
  const cleanLine = lineText.replace(/[–—]/g, '-').trim();

  // 1. Qualitative Findings (e.g. Negative, Nil, Normal, Trace)
  const qualMatch = cleanLine.match(/\b(Negative|Positive|Nil|Trace|Present|Absent|Reactive|Non-Reactive|Disrupted|Displaced)\b/i);
  if (qualMatch) {
    return {
      value: null,
      valueString: qualMatch[1],
      unit: testDef.unit || "",
      reportedRange: "Standard Lab Range",
      reportedFlag: null,
      hasExplicitUnit: false
    };
  }

  // 2. Reference Range Isolation (e.g., "6.0 - 8.3", "12.0-15.5", "< 200")
  let reportedRange = null;
  const rangeMatch = cleanLine.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
  if (rangeMatch) {
    reportedRange = `${rangeMatch[1]} - ${rangeMatch[2]}`;
  } else {
    const boundMatch = cleanLine.match(/(?:<|>|<=|>=)\s*(\d+\.?\d*)/);
    if (boundMatch) reportedRange = boundMatch[0];
  }

  // 3. Quantitative Numeric Value Extraction
  const numRegex = /\b(\d+(?:\.\d+)?)\b/g;
  let match;
  const numbersFound = [];
  while ((match = numRegex.exec(cleanLine)) !== null) {
    numbersFound.push({
      num: parseFloat(match[1]),
      raw: match[1],
      index: match.index
    });
  }

  if (numbersFound.length === 0) {
    return {
      value: null,
      valueString: cleanLine,
      unit: testDef.unit || "",
      reportedRange,
      reportedFlag: null,
      hasExplicitUnit: false
    };
  }

  // Filter out range values if range was extracted
  let candidateNum = numbersFound[0].num;
  if (rangeMatch && numbersFound.length > 2) {
    const minVal = parseFloat(rangeMatch[1]);
    const maxVal = parseFloat(rangeMatch[2]);
    const testValues = numbersFound.filter(n => Math.abs(n.num - minVal) > 0.001 && Math.abs(n.num - maxVal) > 0.001);
    if (testValues.length > 0) {
      candidateNum = testValues[0].num;
    }
  }

  // Extract explicit unit if present on line
  let detectedUnit = testDef.unit || "";
  const unitMatch = cleanLine.match(/\b(g\/dL|mg\/dL|mg\/dl|10\^3\/uL|10\^6\/uL|cells\/mcL|million\/mcL|uIU\/mL|ng\/mL|pg\/mL|fL|pg|%|mm\/hr|U\/L|units|\/hpf)\b/i);
  if (unitMatch) {
    detectedUnit = unitMatch[0];
  }

  return {
    value: candidateNum,
    valueString: String(candidateNum),
    unit: detectedUnit,
    reportedRange: reportedRange || (testDef.ranges?.standard ? `${testDef.ranges.standard.min} - ${testDef.ranges.standard.max}` : "Standard"),
    reportedFlag: null,
    hasExplicitUnit: Boolean(unitMatch)
  };
}

export default extractValueAndRange;
