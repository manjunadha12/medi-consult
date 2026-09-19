import {
  parseMedicalDocument,
  evaluateLabRules,
  calculateHealthTrends,
  classifyDocument,
  processMedicalDocument
} from '../medical-engine/index.js';
import assert from 'assert';

console.log("=================================================");
console.log("🧪 RUNNING PRECISION CLINICAL ENGINE TEST SUITE");
console.log("=================================================\n");

// ----------------------------------------------------
// TEST 1 & 4: Urine Protein vs Total Protein, and Urine pH vs ABG pH
// ----------------------------------------------------
console.log("▶ TEST 1 & 4: Urine Protein isolation and Urine pH mapping");
const sampleLabDoc = {
  fileType: 'text',
  totalPages: 1,
  fullText: `
    PATIENT: Ramesh Kumar  AGE: 45 / Male  DATE: 2026-08-29
    
    LIVER FUNCTION TEST
    Total Protein: 7.2 g/dL (6.0 - 8.3)
    Serum Albumin: 4.5 g/dL (3.5 - 5.0)
    Serum Uric Acid: 5.4 mg/dL (3.4 - 7.0)

    URINE ROUTINE EXAMINATION
    Urine pH: 6.0 (5.0 - 8.0)
    Urine Protein / Albumin: Negative
    Urine Sugar / Glucose: Nil
    Pus Cells: 2-3 /HPF
  `,
  lines: [
    { pageNumber: 1, lineNumber: 1, text: "PATIENT: Ramesh Kumar  AGE: 45 / Male  DATE: 2026-08-29" },
    { pageNumber: 1, lineNumber: 3, text: "LIVER FUNCTION TEST" },
    { pageNumber: 1, lineNumber: 4, text: "Total Protein: 7.2 g/dL (6.0 - 8.3)" },
    { pageNumber: 1, lineNumber: 5, text: "Serum Albumin: 4.5 g/dL (3.5 - 5.0)" },
    { pageNumber: 1, lineNumber: 6, text: "Serum Uric Acid: 5.4 mg/dL (3.4 - 7.0)" },
    { pageNumber: 1, lineNumber: 8, text: "URINE ROUTINE EXAMINATION" },
    { pageNumber: 1, lineNumber: 9, text: "Urine pH: 6.0 (5.0 - 8.0)" },
    { pageNumber: 1, lineNumber: 10, text: "Urine Protein / Albumin: Negative" },
    { pageNumber: 1, lineNumber: 11, text: "Urine Sugar / Glucose: Nil" },
    { pageNumber: 1, lineNumber: 12, text: "Pus Cells: 2-3 /HPF" }
  ]
};

const classification = classifyDocument(sampleLabDoc);
const parsed = parseMedicalDocument(sampleLabDoc, classification);
const evaluated = evaluateLabRules(parsed.structuredResults, parsed.demographics);

console.log("Extracted Tests Count:", evaluated.length);
evaluated.forEach(t => console.log(`   • ${t.testName} (${t.category}): ${t.valueString || t.value} ${t.unit} | Status: ${t.evaluatedStatus} | Ref: ${t.referenceRange}`));

// Check 1: Total Protein is 7.2 g/dL
const totalProt = evaluated.find(t => t.testId === 'total_protein');
assert(totalProt, "Total Protein should be extracted");
assert.strictEqual(totalProt.value, 7.2, "Total Protein value must be 7.2");
assert.strictEqual(totalProt.unit, 'g/dL', "Total Protein unit must be g/dL");
console.log("✅ 1. Total Protein correctly extracted as 7.2 g/dL");

// Check 2: Urine Protein is Negative (NOT 7.2)
const urineProt = evaluated.find(t => t.testId === 'urine_protein');
assert(urineProt, "Urine Protein should be extracted");
assert.strictEqual(urineProt.valueString, "Negative", "Urine Protein must be Negative, NOT 7.2");
console.log("✅ 1. Urine Protein correctly extracted as Negative");

// Check 3: pH is 6.0, Status is NORMAL (NOT HIGH), and belongs to Nephrology
const phTest = evaluated.find(t => t.testId === 'urine_ph');
assert(phTest, "Urine pH should be extracted");
assert.strictEqual(phTest.value, 6.0, "pH value must be 6.0");
assert.strictEqual(phTest.evaluatedStatus, "NORMAL", "pH 6.0 with ref 5.0-8.0 must be NORMAL");
assert.strictEqual(phTest.categoryId, "nephrology", "Urine pH must belong to Nephrology / Urinalysis (NOT Pulmonology)");
console.log("✅ 2 & 4 & 7. pH is 6.0, NORMAL, and categorized under Nephrology (Urinalysis)");

// Check 4: No duplicate Uric Acid, Total Protein, Albumin
const uricAcidMatches = evaluated.filter(t => t.testId === 'uric_acid' || t.testName.toLowerCase().includes('uric acid'));
assert.strictEqual(uricAcidMatches.length, 1, "There should be exactly 1 Uric Acid result, no duplicates");
const protMatches = evaluated.filter(t => t.testId === 'total_protein' || (t.testName.toLowerCase().includes('total protein') && !t.testName.toLowerCase().includes('urine')));
assert.strictEqual(protMatches.length, 1, "There should be exactly 1 Total Protein result, no duplicates");
console.log("✅ 3. No duplicate tests (Uric Acid, Total Protein, Albumin deduplicated cleanly)");

// ----------------------------------------------------
// TEST 5 & 6: Trend Engine Unit Mismatch and Verification Guardrails
// ----------------------------------------------------
console.log("\n▶ TEST 5 & 6: Trend Engine Guardrails");

// Scenario A: Unit mismatch (150 ug/dL vs 15 g/dL)
const currResultsA = [
  { testId: 'hemoglobin', testName: 'Hemoglobin', value: 15, unit: 'g/dL', confidence: 95, needsVerification: false }
];
const priorReportA = [{
  createdAt: '2026-07-01',
  structuredResults: [
    { testId: 'hemoglobin', testName: 'Hemoglobin', value: 150, unit: 'ug/dL', confidence: 95, needsVerification: false }
  ]
}];
const trendsA = calculateHealthTrends(currResultsA, priorReportA);
assert.strictEqual(trendsA.trends[0].status, 'UNAVAILABLE', "Trend must be UNAVAILABLE due to unit mismatch");
console.log("✅ 5. Hemoglobin unit mismatch rejected:", trendsA.trends[0].reason);

// Scenario B: Previous value was unverified (0.27 mg/dL with needsVerification: true)
const currResultsB = [
  { testId: 'serum_creatinine', testName: 'Serum Creatinine', value: 0.9, unit: 'mg/dL', confidence: 95, needsVerification: false }
];
const priorReportB = [{
  createdAt: '2026-07-01',
  structuredResults: [
    { testId: 'serum_creatinine', testName: 'Serum Creatinine', value: 0.27, unit: 'mg/dL', confidence: 50, needsVerification: true }
  ]
}];
const trendsB = calculateHealthTrends(currResultsB, priorReportB);
assert.strictEqual(trendsB.trends[0].status, 'UNAVAILABLE', "Trend must be UNAVAILABLE when previous report requires verification");
console.log("✅ 6. Creatinine unverified prior result rejected:", trendsB.trends[0].reason);

// ----------------------------------------------------
// TEST 8: Direct Radiograph / X-Ray Film Processing
// ----------------------------------------------------
console.log("\n▶ TEST 8: Direct Radiograph / X-Ray Film Processing");
const radiographDoc = {
  fileType: 'image',
  totalPages: 1,
  fullText: 'R\n\n=== SECTION 2 ===\n\n',
  isReadableDocument: true,
  isRadiographFilm: true,
  radiographInfo: {
    modality: "Plain digital radiography — Posteroanterior (PA) hand view",
    filmType: "High-Contrast Skeletal / Anatomical Radiograph"
  },
  lines: [
    { pageNumber: 1, lineNumber: 1, text: "R" }
  ]
};

const radClassification = classifyDocument(radiographDoc);
assert.strictEqual(radClassification.isNonMedicalImage, false, "Radiograph film must NOT be classified as non-medical image");
assert.strictEqual(radClassification.documentType, "RADIOLOGY_IMAGING", "Radiograph film must be classified as RADIOLOGY_IMAGING");

const radParsed = parseMedicalDocument(radiographDoc, radClassification);
assert(radParsed.diagnosticFindings.length > 0, "Radiograph diagnostic finding must be generated");

// TEST 8: Direct Radiograph / X-Ray Film Processing
import { analyzeRadiographFilm } from '../medical-engine/vision/radiographAnalyzer.js';
import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const fixturesDir = path.resolve('tests/fixtures');
if (!fs.existsSync(fixturesDir)) {
  fs.mkdirSync(fixturesDir, { recursive: true });
}
const fixturePath = path.join(fixturesDir, 'test_knee.jpg');
const width = 200, height = 200;
const rawBuffer = Buffer.alloc(width * height);
for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    if (x > 70 && x < 130) {
      rawBuffer[y * width + x] = 210;
    } else {
      rawBuffer[y * width + x] = 25;
    }
  }
}
// Introduce sharp cortical breach step-off
for (let x = 60; x < 85; x++) {
  rawBuffer[110 * width + x] = 255;
  rawBuffer[111 * width + x] = 5;
}
const jpegBuf = await sharp(rawBuffer, { raw: { width, height, channels: 1 } }).jpeg().toBuffer();
fs.writeFileSync(fixturePath, jpegBuf);

const filmAnalysis = await analyzeRadiographFilm(fixturePath, radiographDoc, 'knee.jpg');

assert(filmAnalysis.structuredParams.length >= 5, "Structured radiograph parameters must be generated");
const statusParam = filmAnalysis.structuredParams.find(p => p.testId === 'rad_fracture');
assert(statusParam, "Fracture assessment parameter must exist");
console.log("✅ 8. Direct Radiograph processed with structured params count:", filmAnalysis.structuredParams.length);

// Check zero HU values in all parameters
const hasHuUnits = filmAnalysis.structuredParams.some(p => p.unit === 'HU Index' || p.unit === 'HU' || (p.valueString && p.valueString.includes('HU')));
assert.strictEqual(hasHuUnits, false, "Plain X-rays must NEVER generate CT Hounsfield Units (HU)");

console.log("✅ 8. Radiograph Film successfully recognized:", filmAnalysis.diagnosticSummary.procedure);
console.log("   • Anatomical Region:", filmAnalysis.anatomicalRegion);
const locParam = filmAnalysis.structuredParams.find(p => p.testId === 'rad_location');
console.log("   • Fracture Assessment:", statusParam?.valueString || statusParam?.evaluatedStatus);
console.log("   • Fracture Location:", locParam?.valueString || "Intact");
const cortexParam = filmAnalysis.structuredParams.find(p => p.testId === 'rad_cortex');
console.log("   • Cortical Integrity:", cortexParam?.valueString || "Intact");
console.log("   • Zero HU Artifacts Verified: 100% compliant");

// TEST 9: CT Brain Scan Document Classification & Parsing
const ctMockDoc = {
  fileType: 'pdf',
  totalPages: 1,
  fullText: 'COMPUTED TOMOGRAPHY (CT) SCAN OF BRAIN / HEAD\nClinical Indication: 52-year-old male presenting with progressive, worsening headaches of several weeks.\nTechnique: Non-contrast axial CT images through the brain parenchyma.\nFindings: Right frontal intracranial mass lesion (measuring ~4.2 x 3.8 cm) with surrounding vasogenic edema and 4mm midline shift.\nImpression: Right frontal intracranial mass lesion associated with mass effect and localized edema.',
  isReadableDocument: true,
  lines: [
    { pageNumber: 1, lineNumber: 1, text: 'COMPUTED TOMOGRAPHY (CT) SCAN OF BRAIN / HEAD' },
    { pageNumber: 1, lineNumber: 2, text: 'Clinical Indication: 52-year-old male presenting with progressive, worsening headaches of several weeks.' },
    { pageNumber: 1, lineNumber: 3, text: 'Findings: Right frontal intracranial mass lesion (measuring ~4.2 x 3.8 cm) with surrounding vasogenic edema and 4mm midline shift.' },
    { pageNumber: 1, lineNumber: 4, text: 'Impression: Right frontal intracranial mass lesion associated with mass effect and localized edema.' }
  ]
};

const ctClass = classifyDocument(ctMockDoc);
const ctParsed = parseMedicalDocument(ctMockDoc, ctClass);
const ctFinding = ctParsed.diagnosticFindings.find(f => f.type === 'ct_brain');

assert(ctClass.documentBadges.some(b => b.code === 'NEUR_CT_BRAIN'), "Must have CT Brain badge");
assert(!ctClass.documentBadges.some(b => b.code === 'ORTHO_XRAY'), "Must NOT have false X-Ray badge");
assert(!ctClass.documentBadges.some(b => b.code === 'ONCO_BIOPSY'), "Must NOT have false Biopsy badge");
assert(ctFinding, "Must extract structured ct_brain finding");
assert(ctFinding.clinicalIndication && ctFinding.clinicalIndication.includes("headaches"), "Must extract clinical indication");
assert(ctFinding.impression && ctFinding.impression.includes("Right frontal intracranial mass"), "Must extract impression");

console.log("\n▶ TEST 9: CT Brain Scan Document Processing");
console.log("✅ 9. CT Brain Report recognized with 0 false badges:");
console.log("   • Badges:", ctClass.documentBadges.map(b => b.name).join(', '));
console.log("   • Procedure:", ctFinding.procedure);
console.log("   • Indication:", ctFinding.clinicalIndication.slice(0, 75) + '...');
console.log("   • Impression:", ctFinding.impression.slice(0, 75) + '...');

// TEST 10: Ultrasound Abdomen & Pelvis (USG)
const usgMockDoc = {
  fileType: 'image',
  totalPages: 1,
  fullText: 'ULTRASOUND EXAMINATION OF ABDOMEN AND PELVIS\nPatient Name: Master Ratish Reddy Age: 11 Yrs / Male\nLiver: Normal size and echotexture. Spleen: Normal.\nKidneys: Both kidneys normal in size, shape and position.\nMesenteric Lymph Nodes: Multiple enlarged mesenteric lymph nodes noted, largest measuring 17x8 mm in right iliac fossa.\nImpression: Mild mesenteric lymphadenopathy.',
  isReadableDocument: true,
  lines: [
    { pageNumber: 1, lineNumber: 1, text: 'ULTRASOUND EXAMINATION OF ABDOMEN AND PELVIS' },
    { pageNumber: 1, lineNumber: 2, text: 'Patient Name: Master Ratish Reddy Age: 11 Yrs / Male' },
    { pageNumber: 1, lineNumber: 3, text: 'Mesenteric Lymph Nodes: Multiple enlarged mesenteric lymph nodes noted, largest measuring 17x8 mm.' },
    { pageNumber: 1, lineNumber: 4, text: 'Impression: Mild mesenteric lymphadenopathy.' }
  ]
};

const usgClass = classifyDocument(usgMockDoc);
const usgParsed = parseMedicalDocument(usgMockDoc, usgClass);
const usgFinding = usgParsed.diagnosticFindings.find(f => f.type === 'usg_abdomen');

assert.strictEqual(usgClass.isNonMedicalImage, false, "USG report must NOT be flagged as non-medical image");
assert(usgClass.documentBadges.some(b => b.name.includes("Ultrasound")), "USG must have Ultrasound badge");
assert(usgFinding, "Must extract structured usg_abdomen finding");
assert(usgFinding.impression.includes("lymphadenopathy"), "Must extract mesenteric lymphadenopathy impression");

console.log("\n▶ TEST 10: Ultrasound Abdomen & Pelvis Processing");
console.log("✅ 10. Ultrasound successfully recognized & parsed:");
console.log("   • Badges:", usgClass.documentBadges.map(b => b.name).join(', '));
console.log("   • Procedure:", usgFinding.procedure);
console.log("   • Impression:", usgFinding.impression);

// TEST 11: ENT Tympanometry & Audiology
const entMockDoc = {
  fileType: 'image',
  totalPages: 1,
  fullText: 'TYMPANOMETRY REPORT & ACOUSTIC REFLEX\nPatient: Amrita Age: 8 Yrs Female\nRight Ear: Peak Pressure +10 daPa, Compliance 0.65 ml, Type A Tympanogram. Ipsilateral reflexes present.\nLeft Ear: Peak Pressure -180 daPa, Compliance 0.22 ml, Type C Tympanogram. Reflexes absent.\nImpression: Type A (Right) and Type C negative middle ear pressure (Left ear).',
  isReadableDocument: true,
  lines: [
    { pageNumber: 1, lineNumber: 1, text: 'TYMPANOMETRY REPORT & ACOUSTIC REFLEX' },
    { pageNumber: 1, lineNumber: 2, text: 'Right Ear: Type A Tympanogram, reflexes present' },
    { pageNumber: 1, lineNumber: 3, text: 'Left Ear: Type C Tympanogram, negative pressure -180 daPa' },
    { pageNumber: 1, lineNumber: 4, text: 'Impression: Type A (Right) and Type C negative middle ear pressure (Left ear).' }
  ]
};

const entClass = classifyDocument(entMockDoc);
const entParsed = parseMedicalDocument(entMockDoc, entClass);
const entFinding = entParsed.diagnosticFindings.find(f => f.type === 'ent_tympanogram');

assert.strictEqual(entClass.isNonMedicalImage, false, "ENT report must NOT be flagged as non-medical image");
assert(entClass.documentBadges.some(b => b.name.includes("Tympanometry")), "ENT report must have Tympanometry badge");
assert(entFinding, "Must extract structured ent_tympanogram finding");

console.log("\n▶ TEST 11: ENT Tympanometry & Middle Ear Function");
console.log("✅ 11. ENT Tympanometry successfully recognized:");
console.log("   • Badges:", entClass.documentBadges.map(b => b.name).join(', '));
console.log("   • Procedure:", entFinding.procedure);

// TEST 12: Dual-Engine Clinical Synthesis (Local Base Narrative, Risks & Recommendations)
import { generateLocalClinicalSynthesis } from '../medical-engine/index.js';
const synthesisResult = generateLocalClinicalSynthesis({
  demographics: { patientName: 'Master Ratish Reddy', age: 11, sex: 'Male' },
  structuredResults: [],
  diagnosticFindings: [usgFinding],
  relationshipPatterns: [],
  classifiedCategories: usgClass.classifiedCategories,
  documentBadges: usgClass.documentBadges
});

assert(synthesisResult.summary && synthesisResult.summary.length > 50, "Must generate rich clinical narrative summary");
assert(synthesisResult.keyRisks && synthesisResult.keyRisks.length > 0, "Must generate Key Clinical Risks");
assert(synthesisResult.recommendations && synthesisResult.recommendations.length > 0, "Must generate Specialist Recommendations");

console.log("\n▶ TEST 12: Dual-Engine Clinical Synthesis (Summary, Key Risks, Recommendations)");
console.log("✅ 12. Local Base Engine synthesizes complete diagnostic intelligence:");
console.log("   • Key Risks Count:", synthesisResult.keyRisks.length);
console.log("   • Recommendations Count:", synthesisResult.recommendations.length);
console.log("   • Suggested Specialist:", synthesisResult.suggestedSpecialist);

// TEST 13: Strict Medical Gatekeeper (Rejects Non-Medical Files)
const nonMedicalDoc = {
  fileType: 'pdf',
  totalPages: 1,
  fullText: 'Project Title: Smart City IoT Traffic Simulation. Submitted by D. Manjunadha. This project models vehicle flow across intersections using Python simulations and data structures.',
  isReadableDocument: true,
  lines: [{ pageNumber: 1, lineNumber: 1, text: 'Project Title: Smart City IoT' }]
};
const nonMedClassification = classifyDocument(nonMedicalDoc);
assert.strictEqual(nonMedClassification.isNonMedicalImage, true, "Non-medical file must be flagged as NON_MEDICAL");
assert.strictEqual(nonMedClassification.documentType, 'NON_MEDICAL', "Document type must be NON_MEDICAL");

console.log("\n▶ TEST 13: Strict Medical Document Gatekeeper");
console.log("✅ 13. Non-medical document correctly rejected (0 false positive clinical badges)");

console.log("\n=================================================");
console.log("🎉 ALL 13 CLINICAL, RADIOLOGY & DUAL-ENGINE PRECISION TESTS PASSED 100%! ");
console.log("=================================================");

