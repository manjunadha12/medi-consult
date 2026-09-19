/**
 * Identifies structured laboratory tabular rows and column boundaries
 */
export function extractTableRows(lines) {
  const candidateRows = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const text = line.text;

    // Filter out obvious header/footer metadata lines
    if (
      text.toLowerCase().includes('page ') ||
      text.toLowerCase().includes('phone:') ||
      text.toLowerCase().includes('lab address') ||
      text.toLowerCase().includes('conditions of reporting')
    ) {
      continue;
    }

    // Look for lines that contain numbers, units, or status flags
    const hasNumeric = /\d+\.?\d*/.test(text);
    const hasQualitative = /\b(?:Negative|Positive|Nil|Normal|Reactive|Non-Reactive|Disrupted|Displaced)\b/i.test(text);

    if (hasNumeric || hasQualitative) {
      candidateRows.push({
        lineIndex: i,
        pageNumber: line.pageNumber,
        lineNumber: line.lineNumber,
        text,
        confidence: line.confidence || 90
      });
    }
  }

  return candidateRows;
}

export default extractTableRows;
