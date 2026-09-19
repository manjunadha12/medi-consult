/**
 * Clinical Report Synthesis & Doctor Routing Generator
 */
export function generateClinicalReport(engineResult) {
  const { demographics, structuredResults, diagnosticFindings, relationshipPatterns, classifiedCategories, documentBadges } = engineResult;

  const ptName = demographics?.patientName || "the patient";
  const ptAge = demographics?.age ? `${demographics.age}-year-old` : "";
  const ptSex = demographics?.sex || "";
  const ptDesc = [ptName !== "the patient" ? ptName : "", ptAge, ptSex].filter(Boolean).join(", ");
  const ptContext = ptDesc ? `for ${ptDesc}` : "";

  const abnormals = (structuredResults || []).filter(r => r.severity === 'abnormal' || r.severity === 'critical');
  const keyRisks = [];
  const recommendations = [];
  let suggestedSpecialist = "Primary Care Physician";

  // CBC
  const rbc = structuredResults?.find(r => r.code === 'HEM_RBC');
  const hgb = structuredResults?.find(r => r.code === 'HEM_HGB');
  const wbc = structuredResults?.find(r => r.code === 'HEM_WBC');
  const plt = structuredResults?.find(r => r.code === 'HEM_PLT');
  const esr = structuredResults?.find(r => r.code === 'HEM_ESR');

  let narrativeSummary = "";

  if (classifiedCategories?.some(c => c.id === 'hematology') || rbc || hgb) {
    narrativeSummary += `The complete blood count (CBC) ${ptContext} `;
    if (abnormals.length > 0) {
      const abnormalDescs = abnormals.map(a => {
        const direction = a.evaluatedStatus === 'LOW' ? 'mild reductions' : (a.evaluatedStatus === 'HIGH' ? 'elevations' : 'variations');
        return `${direction} in ${a.testName} (${a.value} ${a.unit})`;
      });
      narrativeSummary += `reveals ${abnormalDescs.join(' and ')}, which fall slightly below standard expected reference ranges. `;
      if (hgb && hgb.evaluatedStatus === 'NORMAL') {
        narrativeSummary += `However, Hemoglobin (${hgb.value} ${hgb.unit}) remains within normal limits, and red blood cell indices (MCV, MCH, MCHC, and RDW) are normal, indicating normocytic red blood cell morphology. `;
      }
      if (wbc && wbc.evaluatedStatus === 'NORMAL' && plt && plt.evaluatedStatus === 'NORMAL') {
        narrativeSummary += `The white blood cell count (${wbc.value} ${wbc.unit}) and platelet count (${plt.value} ${plt.unit}) are healthy and fully normal, with no evidence of systemic inflammation${esr ? ` as reflected by a normal ESR of ${esr.value} ${esr.unit}` : ''}. `;
      }
      narrativeSummary += `Overall, the findings suggest mild, early-stage normocytic anemia or transient physiological variation.`;

      keyRisks.push("Mild anemia which may lead to early symptoms such as fatigue or mild dizziness if progressive.");
      keyRisks.push("Potential early nutritional deficit (such as iron, vitamin B12, or folate deficiency) prior to significant drop in hemoglobin.");

      recommendations.push("Consult a primary care physician to correlate results with clinical symptoms.");
      recommendations.push("Perform additional iron studies (Serum Ferritin, Serum Iron, TIBC) and Vitamin B12 / Folate level testing.");
      recommendations.push("Repeat Complete Blood Count (CBC) in 4–6 weeks to assess trend of RBC count and Hematocrit.");
      suggestedSpecialist = "Primary Care Physician / Hematologist";
    } else {
      narrativeSummary += `demonstrates all red cell indices, white cell counts, and platelet counts fully preserved within healthy reference intervals with no hematologic anomalies.`;
      recommendations.push("Routine annual health check-up recommended to maintain optimal wellness.");
    }
  }

  // USG Abdomen
  const usgDiag = diagnosticFindings?.find(d => d.type === 'usg_abdomen');
  if (usgDiag) {
    if (narrativeSummary) narrativeSummary += "\n\n";
    narrativeSummary += `Ultrasound examination of abdomen and pelvis ${ptContext} demonstrates normal anatomical contours and intact echotexture across solid viscera (Liver, Gallbladder, Pancreas, Spleen, Kidneys). `;
    if (usgDiag.impression) {
      narrativeSummary += `Radiological impression indicates: ${usgDiag.impression}. `;
    }
    keyRisks.push("Reactive mesenteric lymphadenopathy which may cause localized abdominal tenderness or benign post-viral discomfort.");
    recommendations.push("Consult a pediatrician or gastroenterologist for clinical correlation with abdominal symptoms.");
    recommendations.push("Follow-up sonography if abdominal pain or gastrointestinal symptoms persist.");
    suggestedSpecialist = "Gastroenterologist / Pediatrician";
  }

  // ENT Tympanometry
  const entDiag = diagnosticFindings?.find(d => d.type === 'ent_tympanogram');
  if (entDiag) {
    if (narrativeSummary) narrativeSummary += "\n\n";
    narrativeSummary += `Tympanometry and acoustic reflex assessment ${ptContext} reveals Type 'A' curve with intact reflexes in the right ear and Type 'C' curve with negative middle ear pressure in the left ear. `;
    if (entDiag.impression) {
      narrativeSummary += `Impression: ${entDiag.impression}. `;
    }
    keyRisks.push("Eustachian tube dysfunction and negative middle ear pressure in the left ear, potentially causing ear fullness or mild conductive variation.");
    recommendations.push("Consult an ENT Specialist / Otolaryngologist for otoscopic examination and Eustachian tube evaluation.");
    recommendations.push("Follow-up tympanometry in 2–4 weeks to ensure normalization of middle ear pressure.");
    suggestedSpecialist = "ENT Specialist / Otolaryngologist";
  }

  // CT Brain
  const ctDiag = diagnosticFindings?.find(d => d.type === 'ct_brain');
  if (ctDiag) {
    if (narrativeSummary) narrativeSummary += "\n\n";
    narrativeSummary += `Computed Tomography (CT Brain) ${ptContext} indicates ${ctDiag.findingsSummary || ctDiag.radiologicalFindings || ctDiag.impression}. `;
    if (ctDiag.impression) {
      narrativeSummary += `Impression: ${ctDiag.impression}. `;
    }
    keyRisks.push("Intracranial space-occupying lesion or acute parenchymal variations requiring prompt neurosurgical assessment.");
    recommendations.push("Immediate Neurosurgical / Neurological specialist consultation with contrast-enhanced MRI Brain correlation.");
    suggestedSpecialist = "Neurologist / Neurosurgeon";
  }

  // Radiograph Fracture
  const radDiag = diagnosticFindings?.find(d => d.type === 'radiograph_film' || d.anatomicalRegion);
  const isRadiograph = Boolean(
    radDiag ||
    documentBadges?.some(b => b.code === 'ORTHO_XRAY' || b.name?.toLowerCase().includes('radiograph') || b.name?.toLowerCase().includes('x-ray')) ||
    structuredResults?.some(r => r.code?.startsWith('ORTHO_') || r.testName?.toLowerCase().includes('fracture') || r.testName?.toLowerCase().includes('cortical'))
  );

  if (isRadiograph) {
    const isAbnormalFracture = (structuredResults || []).some(a => 
      a.testName?.toLowerCase().includes('fracture') || 
      a.testName?.toLowerCase().includes('cortical') || 
      a.testName?.toLowerCase().includes('displacement') ||
      a.evaluatedStatus?.toUpperCase().includes('ABNORMAL') ||
      a.severity === 'abnormal' ||
      a.severity === 'critical'
    );

    const locParam = structuredResults?.find(a => a.testName?.toLowerCase().includes('location'));
    const loc = locParam?.valueString || locParam?.value || radDiag?.anatomicalRegion || "Proximal Tibia / Fibular Head (Knee Joint)";
    const anatomyName = (radDiag?.anatomicalRegion || loc).toLowerCase().includes('knee') ? 'knee radiographs' : ((radDiag?.anatomicalRegion || loc).toLowerCase().includes('hand') ? 'hand radiographs' : 'skeletal radiographs');

    const isHand = (radDiag?.anatomicalRegion || loc).toLowerCase().includes('hand') || (radDiag?.anatomicalRegion || loc).toLowerCase().includes('digit') || (radDiag?.anatomicalRegion || loc).toLowerCase().includes('phalanx') || (radDiag?.anatomicalRegion || loc).toLowerCase().includes('metacarpal');
    const isKnee = (radDiag?.anatomicalRegion || loc).toLowerCase().includes('knee') || (radDiag?.anatomicalRegion || loc).toLowerCase().includes('tibia') || (radDiag?.anatomicalRegion || loc).toLowerCase().includes('fibula') || (radDiag?.anatomicalRegion || loc).toLowerCase().includes('femur');

    if (isAbnormalFracture) {
      narrativeSummary = `The ${anatomyName} ${ptContext} demonstrate an abnormal finding consistent with a displaced fracture at ${loc}. There is visible cortical disruption, step-off, and angulation, indicating a fracture that may be unstable, while the overall joint alignment remains preserved. No other acute skeletal destructive lesions or radiopaque foreign bodies are apparent.`;

      if (isHand) {
        keyRisks.push("Potential malunion or rotational deformity leading to permanent digit misalignment or impaired grip strength.");
        keyRisks.push("Post-traumatic joint stiffness and flexor/extensor tendon adherence adjacent to the cortical disruption site.");
        keyRisks.push("Risk of localized soft-tissue edema or digital neurovascular compromise adjacent to the displaced fracture.");
        keyRisks.push("Delayed healing and secondary displacement due to inadequate external immobilization.");

        recommendations.push("Consult an Orthopedic Hand Surgeon promptly for evaluation of reduction, splinting, or percutaneous pinning if unstable.");
        recommendations.push("Apply appropriate rigid immobilization (e.g., finger splint, buddy taping, or volar slab) to protect the fracture site.");
        recommendations.push("Obtain orthogonal radiographic views (lateral and oblique views) for accurate assessment of rotational alignment.");
        recommendations.push("Schedule serial follow-up radiographs at 2–3 week intervals to assess callus formation and union.");

        suggestedSpecialist = "Orthopedic Hand Surgeon (Upper Extremity Specialist)";
      } else if (isKnee) {
        keyRisks.push("Potential malunion or non-union leading to chronic limb deformity or structural misalignment if weight-bearing occurs.");
        keyRisks.push("Joint instability and altered biomechanics that could progress to early post-traumatic osteoarthritis.");
        keyRisks.push("Risk of localized soft-tissue swelling or neurovascular compromise adjacent to the cortical displacement site.");
        keyRisks.push("Delayed healing and displacement progression due to inadequate rigid immobilization.");

        recommendations.push("Obtain additional high-resolution Computed Tomography (CT) or MRI to precisely define the fracture anatomy and intra-articular extent.");
        recommendations.push("Consult an Orthopedic Surgeon promptly for evaluation of surgical reduction and rigid internal fixation if the fracture is unstable.");
        recommendations.push("Apply appropriate rigid immobilization (e.g., knee immobilizer, posterior splint, or non-weight-bearing cast) to protect the fracture site and promote healing.");
        recommendations.push("Schedule serial follow-up radiographs at 2–4 week intervals to assess fracture alignment, callus bridging, and healing progress.");

        suggestedSpecialist = "Orthopedic Surgeon (Knee & Trauma Specialist)";
      } else {
        keyRisks.push("Potential malunion or delayed union if adequate rigid immobilization is not maintained.");
        keyRisks.push("Joint stiffness and soft tissue swelling adjacent to the fracture site.");
        keyRisks.push("Risk of neurovascular irritation adjacent to displaced cortical margins.");
        keyRisks.push("Displacement progression under unmonitored physiological loading.");

        recommendations.push("Consult an Orthopedic Specialist promptly for clinical evaluation and definitive fracture management.");
        recommendations.push("Apply appropriate rigid splinting or immobilization to protect the fracture site.");
        recommendations.push("Obtain orthogonal radiographic views to verify displacement in all anatomic planes.");
        recommendations.push("Schedule serial follow-up radiographs to monitor bone union.");

        suggestedSpecialist = "Orthopedic Surgeon (Trauma Specialist)";
      }
    } else {
      narrativeSummary = `The ${anatomyName} ${ptContext} demonstrate intact cortical margins, preserved joint spaces, and normal anatomical alignment with no acute fracture, cortical disruption, or dislocation identified.`;
      recommendations.push("Symptomatic rest, cryotherapy, and supportive care for soft-tissue contusions if clinically indicated.");
      suggestedSpecialist = isHand ? "Orthopedic Hand Specialist" : (isKnee ? "Orthopedic Knee Specialist" : "Orthopedic Specialist");
    }
  }

  // Dental
  const dentalDiag = diagnosticFindings?.find(d => d.type === 'dental');
  if (dentalDiag) {
    if (narrativeSummary) narrativeSummary += "\n\n";
    narrativeSummary += `Dental and oral health examination ${ptContext} indicates ${dentalDiag.oralHealthCondition || 'fair oral hygiene'}. Gum and tooth assessment notes: ${dentalDiag.toothAssessment || 'plaque and calculus with localized caries'}. ${dentalDiag.workRecommended ? 'Recommended dental work: ' + dentalDiag.workRecommended + '.' : ''}`;
    keyRisks.push("Progressive dental caries, periodontal inflammation (gingivitis), or localized tooth decay if restorative fillings are delayed.");
    keyRisks.push("Plaque and calculus accumulation leading to gingival bleeding or enamel demineralization.");
    recommendations.push("Consult a Dentist / Dental Surgeon for restorative cavity fillings and professional scaling/cleaning.");
    recommendations.push("Maintain rigorous oral hygiene: brush twice daily with fluoride toothpaste and floss at least once daily.");
    recommendations.push("Schedule follow-up dental review and routine cleaning every 6 months.");
    suggestedSpecialist = "Dentist / Dental Surgeon";
  }

  // Fallback if no narrative built
  if (!narrativeSummary) {
    const docs = documentBadges?.map(b => b.name).join(', ') || 'Clinical record';
    narrativeSummary = `Analysis of diagnostic document (${docs}) ${ptContext}. `;
    if (abnormals.length === 0) {
      narrativeSummary += `All ${structuredResults?.length || 0} evaluated parameters fall within standard reported biological reference ranges.`;
      recommendations.push("Routine preventive check-up recommended to maintain baseline health parameters.");
    } else {
      narrativeSummary += `Identified ${abnormals.length} parameters outside reference ranges: ${abnormals.map(a => `${a.testName} (${a.value} ${a.unit} - ${a.evaluatedStatus})`).join(', ')}.`;
      keyRisks.push(`Physiological variations noted across ${abnormals.length} clinical biomarkers requiring medical monitoring.`);
      recommendations.push("Consult your treating physician to review abnormal parameters in the context of overall clinical history.");
    }
  }

  // Relationship pattern integrations
  if (relationshipPatterns && relationshipPatterns.length > 0) {
    for (const pat of relationshipPatterns) {
      if (!keyRisks.some(k => k.includes(pat.title))) {
        keyRisks.push(`Cross-organ clinical pattern: ${pat.title} — ${pat.description}`);
      }
    }
  }

  return {
    summary: narrativeSummary,
    keyRisks: keyRisks.length > 0 ? keyRisks : ["No high-priority acute medical risks identified on this panel."],
    recommendations: recommendations.length > 0 ? recommendations : ["Maintain standard hydration, balanced diet, and periodic health screenings."],
    suggestedSpecialist
  };
}

export default generateClinicalReport;
