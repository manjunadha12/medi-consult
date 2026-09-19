/**
 * Printable Diagnostic PDF / Presentation Layout Formatter
 */
export function formatPrintableReport(engineResult) {
  return {
    header: {
      patientName: engineResult.demographics?.patientName || "Patient",
      age: engineResult.demographics?.age || "N/A",
      sex: engineResult.demographics?.sex || "N/A",
      reportDate: engineResult.demographics?.reportDate || new Date().toLocaleDateString(),
      hospital: engineResult.demographics?.hospitalName,
      doctor: engineResult.demographics?.doctorName
    },
    executiveSummary: engineResult.summary,
    keyRisks: engineResult.keyRisks || [],
    recommendations: engineResult.recommendations || [],
    suggestedSpecialist: engineResult.suggestedSpecialist,
    panels: engineResult.categorizedResults || []
  };
}

export default formatPrintableReport;
