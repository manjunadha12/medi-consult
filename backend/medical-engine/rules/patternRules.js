/**
 * Cross-Organ Clinical Syndromes and Pattern Evaluators
 */
export const CLINICAL_PATTERNS = [
  {
    id: "METABOLIC_CARDIO_RISK",
    title: "Cardiometabolic & Atherogenic Profile",
    description: "Concurrent elevation in fasting blood glucose with elevated serum triglycerides / total cholesterol.",
    affectedSystems: ["Cardiology", "Biochemistry"],
    check: (results) => {
      const highGlu = results.some(r => (r.code === 'MET_GLU_FAST' || r.code === 'MET_GLU_RBS' || r.code === 'MET_HBA1C') && r.evaluatedStatus === 'HIGH');
      const highLip = results.some(r => (r.code === 'LIP_CHOL' || r.code === 'LIP_TRIG' || r.code === 'LIP_LDL') && r.evaluatedStatus === 'HIGH');
      return highGlu && highLip;
    }
  },
  {
    id: "HEPATIC_INFLAMMATORY_LEAK",
    title: "Hepatic Transaminase Elevation",
    description: "Concurrent elevation of SGOT/AST and SGPT/ALT indicating hepatocellular stress.",
    affectedSystems: ["Biochemistry", "Gastroenterology"],
    check: (results) => {
      const highAst = results.some(r => r.code === 'HEP_SGOT' && r.evaluatedStatus === 'HIGH');
      const highAlt = results.some(r => r.code === 'HEP_SGPT' && r.evaluatedStatus === 'HIGH');
      return highAst && highAlt;
    }
  },
  {
    id: "RENAL_EXCRETORY_PROFILE",
    title: "Renal Excretory Impairment",
    description: "Concomitant elevation in Serum Creatinine and Blood Urea.",
    affectedSystems: ["Nephrology", "Biochemistry"],
    check: (results) => {
      const highCreat = results.some(r => r.code === 'REN_CREAT' && r.evaluatedStatus === 'HIGH');
      const highUrea = results.some(r => r.code === 'REN_UREA' && r.evaluatedStatus === 'HIGH');
      return highCreat && highUrea;
    }
  }
];

export function evaluatePatterns(structuredResults) {
  const matched = [];
  for (const pat of CLINICAL_PATTERNS) {
    if (pat.check(structuredResults)) {
      matched.push({
        id: pat.id,
        title: pat.title,
        description: pat.description,
        affectedSystems: pat.affectedSystems
      });
    }
  }
  return matched;
}

export default evaluatePatterns;
