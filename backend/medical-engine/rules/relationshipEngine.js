/**
 * Cross-Organ Relationship Engine
 * Detects multi-marker associative patterns across different organ systems.
 * Uses cautious non-diagnostic associative clinical wording:
 * "These findings can be associated with..." rather than claiming a medical diagnosis.
 */
export function evaluateRelationships(evaluatedResults, diagnosticFindings, clinicalNotes) {
  const patterns = [];

  // Helper map for fast lookup of evaluated results
  const testMap = {};
  for (const item of evaluatedResults) {
    const key = (item.testId || item.code || '').toLowerCase();
    testMap[key] = item;
  }

  // 1. Cardiometabolic Risk Pattern
  // (HbA1c / Glucose HIGH + LDL HIGH + Triglycerides HIGH)
  const isDiabeticRisk = (testMap['hba1c']?.evaluatedStatus === 'HIGH' || testMap['diab_hba1c']?.evaluatedStatus === 'HIGH' || testMap['diab_fbs']?.evaluatedStatus === 'HIGH' || testMap['fasting_blood_sugar']?.evaluatedStatus === 'HIGH');
  const isLdlHigh = (testMap['ldl_cholesterol']?.evaluatedStatus === 'HIGH' || testMap['ldl']?.evaluatedStatus === 'HIGH' || testMap['total_cholesterol']?.evaluatedStatus === 'HIGH');
  const isTgHigh = (testMap['triglycerides']?.evaluatedStatus === 'HIGH');

  if (isDiabeticRisk && (isLdlHigh || isTgHigh)) {
    const markers = [];
    if (isDiabeticRisk) markers.push('Glycated Hemoglobin (HbA1c) / Glucose (HIGH)');
    if (isLdlHigh) markers.push('LDL / Total Cholesterol (HIGH)');
    if (isTgHigh) markers.push('Serum Triglycerides (HIGH)');

    patterns.push({
      id: "PAT_CARDIOMETABOLIC",
      title: "Cardiometabolic Risk Association",
      icon: "🫀🍬",
      severity: "high",
      involvedMarkers: markers,
      summary: "Several cardiovascular and glycemic markers are elevated concurrently.",
      description: "These findings can be associated with increased cardiovascular and metabolic risk profile. In clinical practice, combined elevation of lipid fractions with impaired glycemic regulation warrants comprehensive lifestyle review and physician consultation.",
      recommendation: "Discuss these concurrent metabolic and lipid markers with your cardiologist or primary physician."
    });
  }

  // 2. Cardio-Renal / Blood Pressure & Kidney Pattern
  // (Creatinine HIGH / eGFR LOW + High Blood Pressure / Urea HIGH)
  const isCreatinineHigh = (testMap['serum_creatinine']?.evaluatedStatus === 'HIGH' || testMap['neph_creat']?.evaluatedStatus === 'HIGH' || testMap['creatinine']?.evaluatedStatus === 'HIGH');
  const isEgfrLow = (testMap['neph_egfr']?.evaluatedStatus === 'LOW' || testMap['egfr']?.evaluatedStatus === 'LOW');
  const isUreaHigh = (testMap['blood_urea']?.evaluatedStatus === 'HIGH' || testMap['neph_urea']?.evaluatedStatus === 'HIGH' || testMap['bun']?.evaluatedStatus === 'HIGH');

  if (isCreatinineHigh || (isEgfrLow && isUreaHigh)) {
    const markers = [];
    if (isCreatinineHigh) markers.push('Serum Creatinine (HIGH)');
    if (isUreaHigh) markers.push('Blood Urea / BUN (HIGH)');
    if (isEgfrLow) markers.push('eGFR (LOW)');

    patterns.push({
      id: "PAT_RENAL_VASCULAR",
      title: "Renal Function & Filtration Pattern",
      icon: "🫘",
      severity: "high",
      involvedMarkers: markers,
      summary: "Renal filtration biomarkers show values outside standard reference limits.",
      description: "These findings can be associated with reduced glomerular clearance or renal filtration alterations. Adequate hydration and clinical correlation with blood pressure measurements are recommended.",
      recommendation: "Consult a nephrologist or physician for evaluation of kidney function trajectory."
    });
  }

  // 3. Hepato-Metabolic Pattern
  // (ALT/SGPT HIGH + AST/SGOT HIGH + Triglycerides HIGH / Ultrasound Fatty Liver)
  const isAltHigh = (testMap['sgpt_alt']?.evaluatedStatus === 'HIGH' || testMap['alt']?.evaluatedStatus === 'HIGH');
  const isAstHigh = (testMap['sgot_ast']?.evaluatedStatus === 'HIGH' || testMap['ast']?.evaluatedStatus === 'HIGH');

  if (isAltHigh || isAstHigh) {
    const markers = [];
    if (isAltHigh) markers.push('ALT / SGPT (HIGH)');
    if (isAstHigh) markers.push('AST / SGOT (HIGH)');
    if (isTgHigh) markers.push('Serum Triglycerides (HIGH)');

    patterns.push({
      id: "PAT_HEPATIC",
      title: "Hepato-Metabolic Pattern",
      icon: "🧪",
      severity: isAltHigh && isAstHigh ? "high" : "moderate",
      involvedMarkers: markers,
      summary: "Transaminase enzyme activities are elevated above reported reference limits.",
      description: "These findings can be associated with hepatic cellular stress, metabolic steatosis, or medication-related liver effects. In clinical guidelines, transaminase changes are often correlated with dietary habits and lipid levels.",
      recommendation: "Review current medications and dietary factors with your physician."
    });
  }

  // 4. Anemia / Hematologic Pattern
  // (Hemoglobin LOW + RBC / PCV / MCV LOW)
  const isHbLow = (testMap['hemoglobin']?.evaluatedStatus === 'LOW' || testMap['hb']?.evaluatedStatus === 'LOW');
  const isMcvLow = (testMap['mcv']?.evaluatedStatus === 'LOW');
  const isPlateletLow = (testMap['platelets']?.evaluatedStatus === 'LOW');

  if (isHbLow) {
    const markers = ['Hemoglobin (LOW)'];
    if (isMcvLow) markers.push('MCV (LOW - Microcytic)');
    if (isPlateletLow) markers.push('Platelets (LOW)');

    patterns.push({
      id: "PAT_HEMATOLOGIC",
      title: "Hematologic Profile Pattern",
      icon: "🩸",
      severity: testMap['hemoglobin']?.severity === 'critical' ? 'critical' : 'moderate',
      involvedMarkers: markers,
      summary: "Circulating hemoglobin concentrations are below expected reference ranges.",
      description: "These findings can be associated with red blood cell volume depletion, iron nutritional balance, or chronic inflammatory conditions. Clinical correlation with iron studies or dietary intake is common practice.",
      recommendation: "Consult your healthcare provider for evaluation of nutritional or hematologic causes."
    });
  }

  // 5. Active Inflammatory / Infection Pattern
  // (Total WBC HIGH + Neutrophils HIGH or ESR HIGH)
  const isWbcHigh = (testMap['wbc_count']?.evaluatedStatus === 'HIGH' || testMap['total_wbc']?.evaluatedStatus === 'HIGH');
  const isNeutrophilsHigh = (testMap['neutrophils']?.evaluatedStatus === 'HIGH');
  const isEsrHigh = (testMap['esr']?.evaluatedStatus === 'HIGH' || testMap['hem_esr']?.evaluatedStatus === 'HIGH');

  if (isWbcHigh || (isNeutrophilsHigh && isEsrHigh)) {
    const markers = [];
    if (isWbcHigh) markers.push('Total WBC / Leucocyte Count (HIGH)');
    if (isNeutrophilsHigh) markers.push('Neutrophils % (HIGH)');
    if (isEsrHigh) markers.push('ESR (HIGH)');

    patterns.push({
      id: "PAT_INFLAMMATORY",
      title: "Inflammatory / Leucocyte Response Pattern",
      icon: "🦠",
      severity: "moderate",
      involvedMarkers: markers,
      summary: "Elevated inflammatory and white blood cell markers detected.",
      description: "These findings can be associated with systemic or localized immune responses, acute infections, or reactive inflammatory states in the body.",
      recommendation: "Correlate with active clinical symptoms (such as fever, pain, or cough) with your doctor."
    });
  }

  // 6. Thyroid - Lipid Association
  // (TSH HIGH + Cholesterol HIGH)
  const isTshHigh = (testMap['thy_tsh']?.evaluatedStatus === 'HIGH' || testMap['tsh']?.evaluatedStatus === 'HIGH');
  if (isTshHigh && isLdlHigh) {
    patterns.push({
      id: "PAT_THYROID_LIPID",
      title: "Thyroid-Metabolic Interaction",
      icon: "🦋",
      severity: "moderate",
      involvedMarkers: ['TSH (HIGH)', 'Cholesterol / LDL (HIGH)'],
      summary: "Elevated TSH observed in conjunction with elevated cholesterol fractions.",
      description: "These findings can be associated with hypothyroid-related slowdown in hepatic lipid receptor clearance. Normalizing thyroid balance often assists in optimizing lipid metabolism.",
      recommendation: "Discuss complete thyroid profile (FT3, FT4) and lipid management with an endocrinologist or physician."
    });
  }

  return patterns;
}
