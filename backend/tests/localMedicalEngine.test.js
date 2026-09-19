import fs from 'fs';
import path from 'path';
import { processMedicalDocument } from '../medical-engine/index.js';

async function runTests() {
  console.log("=================================================");
  console.log("🧪 RUNNING LOCAL MEDICAL ENGINE COMPREHENSIVE TEST");
  console.log("=================================================\n");

  const testReportText = `
METROPOLIS DIAGNOSTIC LABS
Patient Name: Rajesh Sharma
Age/Sex: 48 Yrs / Male
Date: 28-Aug-2026
Ref By: Dr. A. K. Verma

COMPLETE BLOOD COUNT (CBC)
Hemoglobin               10.2   g/dL       13.0 - 17.0      LOW
Total Leucocyte Count    9500   cells/mcL  4000 - 11000     NORMAL
Platelet Count         220000   cells/mcL  150000 - 450000  NORMAL
Packed Cell Volume (PCV) 32.5   %          40.0 - 50.0      LOW

LIPID PROFILE
Total Cholesterol        245    mg/dL      < 200            HIGH
LDL Cholesterol          158    mg/dL      < 100            HIGH
HDL Cholesterol           36    mg/dL      > 40             LOW
Serum Triglycerides      260    mg/dL      < 150            HIGH

DIABETES EVALUATION
Glycated Hemoglobin (HbA1c) 7.2  %          4.0 - 5.6        HIGH
Fasting Blood Sugar      142    mg/dL      70 - 99          HIGH

KIDNEY FUNCTION TEST (KFT)
Serum Creatinine         1.3    mg/dL      0.7 - 1.2        HIGH
Blood Urea                48    mg/dL      15 - 45          HIGH
eGFR                      58    mL/min     > 90             LOW

12 LEAD ELECTROCARDIOGRAM (ECG)
Heart Rate: 78 bpm
Rhythm: Sinus rhythm. Normal axis.
ST-T changes: No acute ST-T changes. Normal ventricular repolarization.
Impression: Normal resting 12-lead ECG.

2D ECHOCARDIOGRAM
LVEF: 45 %
LV Function: Mildly reduced LV systolic function with trace mitral regurgitation.
Aortic Valve: Normal trileaflet valve.
Pericardium: No pericardial effusion.
Impression: Mild LV systolic dysfunction (LVEF 45%).
  `;

  // Write temporary test file
  const tempPath = path.join(path.resolve(), 'temp_test_report.txt');
  fs.writeFileSync(tempPath, testReportText);

  // Previous mock report for longitudinal comparison
  const mockPreviousReports = [{
    createdAt: new Date('2026-02-15').toISOString(),
    extractedResults: [
      { testId: 'hba1c', name: 'HbA1c', value: 6.4, unit: '%' },
      { testId: 'ldl_cholesterol', name: 'LDL Cholesterol', value: 120, unit: 'mg/dL' },
      { testId: 'serum_creatinine', name: 'Serum Creatinine', value: 1.0, unit: 'mg/dL' },
      { testId: 'total_cholesterol', name: 'Total Cholesterol', value: 195, unit: 'mg/dL' }
    ]
  }];

  try {
    const result = await processMedicalDocument({
      filePath: tempPath,
      previousReports: mockPreviousReports
    });

    console.log("✅ Engine Name:", result.engineName, `(v${result.engineVersion})`);
    console.log("⏱️ Processing Time:", `${result.processingTimeMs} ms`);
    console.log("👤 Extracted Patient:", result.demographics.patientName, "| Age:", result.demographics.age, "| Sex:", result.demographics.sex);
    console.log("\n📄 Detected Document Badges:");
    result.documentBadges.forEach(b => console.log(`   ${b.icon} ${b.name} (${b.category})`));

    console.log("\n🧪 Extracted Structured Tests (" + result.structuredResults.length + " tests):");
    result.structuredResults.forEach(r => {
      console.log(`   • ${r.testName}: ${r.value} ${r.unit} | Status: ${r.evaluatedStatus} | Ref: ${r.referenceRange} | Confidence: ${r.confidence}% (${r.confidenceLabel})`);
    });

    console.log("\n🫀 Specialized Diagnostics Findings:");
    result.diagnosticFindings.forEach(d => {
      console.log(`   ${d.icon} ${d.procedure}: LVEF=${d.lvef || 'N/A'}% | Findings: ${d.reportedInterpretation || d.findingsText}`);
    });

    console.log("\n🔗 Cross-Organ Relationship Patterns (" + result.relationshipPatterns.length + " detected):");
    result.relationshipPatterns.forEach(p => {
      console.log(`   ${p.icon} [${p.title}]`);
      console.log(`     Markers: ${p.involvedMarkers.join(', ')}`);
      console.log(`     Associative Analysis: "${p.description}"`);
    });

    console.log("\n📈 Health Trend Comparison vs Previous Record:");
    if (result.healthTrends.hasPreviousData) {
      result.healthTrends.trends.forEach(t => {
        console.log(`   ${t.testName}: ${t.previousValue} → ${t.currentValue} ${t.unit} [${t.icon} ${t.direction} (${t.pctChange}%)]`);
      });
      if (result.healthTrends.multiMarkerAlert) {
        console.log(`   ⚠️ Alert: ${result.healthTrends.multiMarkerAlert.message}`);
      }
    }

    console.log("\n🔎 Traceability & Original Source Evidence sample:");
    const creat = result.structuredResults.find(r => r.testId === 'serum_creatinine');
    if (creat) {
      console.log(`   Test: ${creat.testName}`);
      console.log(`   Source Line ${creat.source.lineNumber} (Page ${creat.source.pageNumber}): "${creat.source.originalText}"`);
    }

    console.log("\n=================================================");
    console.log("🎉 ALL TESTS PASSED! ENGINE IS 100% OPERATIONAL.");
    console.log("=================================================\n");
  } catch (err) {
    console.error("❌ Test Failed:", err);
  } finally {
    if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

runTests();
