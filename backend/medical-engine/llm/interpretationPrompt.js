/**
 * Clinical Interpretation Prompt
 */
export function buildInterpretationPrompt(findings, demographics) {
  return `Interpret the clinical significance of these diagnostic findings for patient ${demographics?.patientName || 'Patient'}:
${JSON.stringify(findings, null, 2)}`;
}

export default buildInterpretationPrompt;
