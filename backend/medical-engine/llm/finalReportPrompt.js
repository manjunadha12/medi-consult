import bookKnowledgeEngine from '../medical-db/books/bookKnowledgeEngine.js';

/**
 * Executive Clinical Synthesis Prompt for Gemini / OpenRouter Swarm
 * Grounded in Authoritative Medical Textbooks ("E:/clone app/backend/books")
 */
export function buildFinalReportPrompt(engineResult, fileName = '', fullText = '') {
  // Retrieve matched clinical context from the 23 medical textbooks
  const bookContext = bookKnowledgeEngine.getRelevantBookContext(engineResult, fileName, fullText);

  return {
    systemPrompt: `You are a Senior Consultant Physician, Pathologist, and Clinical Medical AI Specialist.
You have immediate access to authoritative medical textbooks including Osborn's Brain Imaging, Apley's System of Orthopaedics & Fractures, Bradley & Daroff's Neurology, Cardiology Explained, Nelson Textbook of Pediatrics, Oxford Handbook of Gastroenterology, Marino's ICU Book, and Diagnostic Microbiology.

You MUST synthesize the patient's diagnostic results using evidence-based clinical medicine, identifying primary abnormalities, potential underlying etiologies, clinical risks, and precise medical specialist referrals.

You MUST return ONLY a valid JSON object matching this schema:
{
  "summary": "Detailed narrative clinical synthesis explaining all key laboratory and diagnostic findings in plain language for the patient",
  "keyRisks": ["Clinical risk 1 based on findings and textbook guidelines", "Clinical risk 2"],
  "recommendations": ["Actionable next step 1", "Actionable next step 2"],
  "clinicalAdvice": "Dietary, lifestyle, or follow-up guidance",
  "suggestedSpecialist": "Specific medical specialist to consult (e.g., Orthopedic Surgeon, Cardiologist, Gastroenterologist, Neurologist, Pulmonologist, Pediatrician)"
}`,
    promptText: `Perform deep Neural AI clinical analysis and comprehensive medical synthesis of this patient report (${fileName}):\n\n` +
      `[PATIENT DIAGNOSTIC FINDINGS]\n` +
      `Detected Tests: ${engineResult.structuredResults.map(t => `${t.testName}: ${t.value} ${t.unit} (Status: ${t.evaluatedStatus})`).join(', ') || 'None'}\n\n` +
      `Diagnostic Narrative Findings: ${engineResult.diagnosticFindings.map(d => `${d.procedure}: ${d.findingsSummary || d.radiologicalFindings || d.resultsSummary || d.reportedInterpretation || d.findingsText || d.oralHealthCondition || ''}`).join('\n') || 'None'}\n\n` +
      `Clinical History / Demographics / Notes: ${JSON.stringify(engineResult.demographics || {})} ${JSON.stringify(engineResult.clinicalNotes || {})}\n\n` +
      `[MATCHED MEDICAL TEXTBOOK CLINICAL KNOWLEDGE]\n` +
      `${bookContext.clinicalContextPrompt}\n\n` +
      `Authoritative Sources Referenced: ${bookContext.matchedTextbooks.join(', ')}`
  };
}

export default buildFinalReportPrompt;
