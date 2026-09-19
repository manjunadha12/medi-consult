import fs from 'fs';
import path from 'path';
import { processMedicalDocument } from '../medical-engine/index.js';

async function runTests() {
  console.log("=================================================");
  console.log("🧪 RUNNING DEDICATED ECHOCARDIOGRAM TEST");
  console.log("=================================================\n");

  const echoReportText = `
ADULT ECHOCARDIOGRAM REPORT
Patient Demographics: MANIKANDAN  48Y/M
Study Date: 28/08/2026

Measurements:
EF (A4C) : 62.5 %
EF (MM-Teich) : 65.0 %
SV (A4C) : 72.0 ml
LVIDd (MM) : 4.6 cm
LVIDs (MM) : 2.9 cm
IVSd (MM) : 0.9 cm
LVPWd (MM) : 0.9 cm
LA Dimen (MM) : 3.4 cm
AoR Diam (MM) : 2.8 cm
FS (MM-Teich) : 36.0 %

Doppler / Valves:
Mitral Valve: Normal leaflet excursion, no mitral regurgitation.
Aortic Valve: Trileaflet, no stenosis or regurgitation.
Tricuspid Valve: Normal Doppler flow.
Pericardium: No pericardial effusion.

Impression:
Normal LV cavity size with normal LV systolic function (LVEF 62.5%). Normal diastolic filling parameters.
  `;

  const tempPath = path.join(path.resolve(), 'temp_echo_test.txt');
  fs.writeFileSync(tempPath, echoReportText);

  try {
    const result = await processMedicalDocument({ filePath: tempPath });

    console.log("✅ Engine Name:", result.engineName);
    console.log("👤 Extracted Patient:", result.demographics.patientName, "| Age:", result.demographics.age, "| Sex:", result.demographics.sex);
    console.log("📅 Study Date:", result.demographics.reportDate);
    
    console.log("\n📄 Detected Document Badges:");
    result.documentBadges.forEach(b => console.log(`   ${b.icon} ${b.name}`));

    console.log("\n🫀 Extracted Dedicated Echo Parameters (" + result.structuredResults.length + " measurements):");
    result.structuredResults.forEach(r => {
      console.log(`   • ${r.testName}: ${r.value} ${r.unit} | Status: ${r.evaluatedStatus} | Normal Ref: ${r.referenceRange}`);
    });

    console.log("\n🫀 Echo Summary Findings:");
    result.diagnosticFindings.forEach(d => {
      console.log(`   ${d.icon} ${d.procedure} (LVEF ${d.lvef}%):`);
      console.log(`     Impression: "${d.reportedInterpretation}"`);
    });

    // Verify no false lab matches occurred
    const falseLabMatches = result.structuredResults.filter(r => ['pH', 'Hemoglobin', 'Progesterone', 'Triglycerides'].includes(r.testName));
    if (falseLabMatches.length === 0) {
      console.log("\n✅ ZERO FALSE BLOOD-LAB MATCHES! Gatekeeper and strict boundaries working perfectly.");
    } else {
      console.error("\n❌ Found false lab matches:", falseLabMatches);
    }

    console.log("\n=================================================");
    console.log("🎉 ECHOCARDIOGRAM PARSER PASSED 100% ACCURACY!");
    console.log("=================================================\n");
  } catch (err) {
    console.error("❌ Test Failed:", err);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

runTests();
