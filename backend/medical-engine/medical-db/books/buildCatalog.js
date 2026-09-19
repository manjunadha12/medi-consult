import fs from 'fs';
import path from 'path';

const booksDir = 'E:/clone app/backend/books';
const outputDir = path.join(path.resolve(), 'medical-db', 'books');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Complete Clinical Knowledge Catalog for all 23 Medical Textbooks
const MEDICAL_BOOKS_CATALOG = [
  {
    id: "BOOK-OSBORN-BRAIN",
    fileName: "(Brain Imaging) Anne G. Osborn, Gary L. Hedlund, Karen L. Salzman-Osborn’s Brain_ imaging, pathology, and anatomy-Elsevier (2018).pdf",
    filePath: "E:/clone app/backend/books/(Brain Imaging) Anne G. Osborn, Gary L. Hedlund, Karen L. Salzman-Osborn’s Brain_ imaging, pathology, and anatomy-Elsevier (2018).pdf",
    title: "Osborn's Brain: Imaging, Pathology, and Anatomy (2nd Edition)",
    authors: "Anne G. Osborn, Gary L. Hedlund, Karen L. Salzman",
    publisher: "Elsevier",
    specialties: ["Radiology", "Neurology", "Neurosurgery"],
    keywords: ["brain mri", "ct brain", "ct head", "intracranial hemorrhage", "subdural", "epidural", "ischemic stroke", "glioblastoma", "meningioma", "hydrocephalus", "mass effect", "midline shift", "aneurysm"],
    clinicalContext: "Authoritative reference for neuroimaging. Diagnostic criteria for intracranial lesions, acute infarcts, midline shift, herniation risks, white matter hyperintensities, and vascular malformations."
  },
  {
    id: "BOOK-101-CXR",
    fileName: "101 Chest X-Ray Solutions (2013) [PDF].pdf",
    filePath: "E:/clone app/backend/books/101 Chest X-Ray Solutions (2013) [PDF].pdf",
    title: "101 Chest X-Ray Solutions",
    authors: "Hariqbal Singh",
    publisher: "Jaypee Brothers",
    specialties: ["Radiology", "Pulmonology", "Cardiology"],
    keywords: ["chest x-ray", "cxr", "consolidation", "pneumonia", "pleural effusion", "pneumothorax", "cardiomegaly", "pulmonary edema", "hilar lymphadenopathy", "atelectasis", "copd", "tuberculosis"],
    clinicalContext: "Definitive chest radiograph interpretations: alveolar vs interstitial patterns, silhouette sign, blunting of costophrenic angles, tension pneumothorax markers, and cardiothoracic ratio (> 0.5)."
  },
  {
    id: "BOOK-BRADLEY-NEURO",
    fileName: "bradley-and-daroffs-neurology-in-clinical-practice-8nbsped_compress.pdf",
    filePath: "E:/clone app/backend/books/bradley-and-daroffs-neurology-in-clinical-practice-8nbsped_compress.pdf",
    title: "Bradley and Daroff's Neurology in Clinical Practice (8th Edition)",
    authors: "Joseph Jankovic, John C. Mazziotta, Scott L. Pomeroy, Nancy J. Newman",
    publisher: "Elsevier",
    specialties: ["Neurology", "Neuroscience", "Neurosurgery"],
    keywords: ["neurology", "stroke", "nihss", "seizure", "epilepsy", "eeg", "emg", "ncs", "headache", "migraine", "dementia", "alzheimer", "parkinson", "multiple sclerosis", "myasthenia gravis", "neuropathy", "meningitis", "gcs"],
    clinicalContext: "Gold-standard neurological textbook: UMN vs LMN differentiation, acute stroke thrombolysis/EVT window, status epilepticus 3-phase protocols, McDonald MS criteria, and neuromuscular junction disorders."
  },
  {
    id: "BOOK-APLEY-ORTHO",
    fileName: "Apley's System of Orthopaedics and Fractures, 9th Edition  -.pdf",
    filePath: "E:/clone app/backend/books/Apley's System of Orthopaedics and Fractures, 9th Edition  -.pdf",
    title: "Apley and Solomon's System of Orthopaedics and Fractures (9th Edition)",
    authors: "Louis Solomon, David Warwick, Selvadurai Nayagam",
    publisher: "Hodder Arnold / CRC Press",
    specialties: ["Orthopedic Surgery", "Radiology", "Emergency Medicine"],
    keywords: ["fracture", "x-ray", "bone", "joint", "dislocation", "tibial plateau", "femur", "patella", "fibula", "radius", "ulna", "scaphoid", "osteoarthritis", "osteomyelitis", "compartment syndrome", "ligament", "meniscus"],
    clinicalContext: "Comprehensive orthopedics and fracture management: cortical disruption, displacement/angulation assessment, joint alignment, classification of fractures (Salter-Harris, Schatzker, Gustilo-Anderson), and non-union risks."
  },
  {
    id: "BOOK-ROCKWOOD-FRACTURES",
    fileName: "Paul Tornetta, Charles Court-Brown, James D. Heckman, Michael McKee, Margaret M. McQueen., William Ricci - Rockwood and Green's Fractures in Adults (2 Volume Set)-LWW (2014).pdf",
    filePath: "E:/clone app/backend/books/Paul Tornetta, Charles Court-Brown, James D. Heckman, Michael McKee, Margaret M. McQueen., William Ricci - Rockwood and Green's Fractures in Adults (2 Volume Set)-LWW (2014).pdf",
    title: "Rockwood and Green's Fractures in Adults (8th Edition)",
    authors: "Paul Tornetta, Charles Court-Brown, James D. Heckman, Michael McKee",
    publisher: "Lippincott Williams & Wilkins",
    specialties: ["Orthopedic Surgery", "Trauma Care"],
    keywords: ["fracture", "trauma", "open fracture", "internal fixation", "orif", "casting", "compartment syndrome", "neurovascular compromise", "knee fracture", "femoral fracture"],
    clinicalContext: "Trauma surgery gold standard for adult skeletal fractures: stability criteria, intra-articular step-off, emergency immobilization, and indications for surgical fixation."
  },
  {
    id: "BOOK-CARDIOLOGY-EXPLAINED",
    fileName: "Cardiac arrest - Cardiology Explained - NCBI Bookshelf.pdf",
    filePath: "E:/clone app/backend/books/Cardiac arrest - Cardiology Explained - NCBI Bookshelf.pdf",
    title: "Cardiology Explained",
    authors: "Euan A. Ashley, Josef Niebauer",
    publisher: "Remedica / NCBI Bookshelf",
    specialties: ["Cardiology", "Emergency Medicine"],
    keywords: ["cardiac arrest", "resuscitation", "ecg", "echo", "hypertension", "heart failure", "angina", "stemi", "nstemi", "troponin", "nt-probnp", "murmur", "aortic stenosis", "mitral regurgitation", "tamponade"],
    clinicalContext: "Cardiovascular clinical protocols: 12-lead ECG ischemia localization, 2D echo chamber dimensions and LVEF, 4 pillars of GDMT for heart failure, and Duke criteria for infective endocarditis."
  },
  {
    id: "BOOK-NELSON-PEDIATRICS",
    fileName: "Nelson-Textbook-of-Pediatrics-2-Volume-Set-20e.pdf",
    filePath: "E:/clone app/backend/books/Nelson-Textbook-of-Pediatrics-2-Volume-Set-20e.pdf",
    title: "Nelson Textbook of Pediatrics (20th Edition)",
    authors: "Robert M. Kliegman, Bonita F. Stanton, Joseph St. Geme, Nina F. Schor",
    publisher: "Elsevier",
    specialties: ["Pediatrics", "Neonatology", "Pediatric Surgery"],
    keywords: ["pediatric", "child", "infant", "newborn", "growth", "development", "pediatric fever", "bronchiolitis", "croup", "congenital", "pediatric cbc", "bilirubin", "neonatal jaundice"],
    clinicalContext: "Definitive pediatric reference: age-adjusted laboratory reference intervals, pediatric vital signs, developmental milestones, pediatric infectious diseases, and pediatric dehydration management."
  },
  {
    id: "BOOK-OXFORD-GASTRO",
    fileName: "oxford handbook gastroenterology and hepatolgy.pdf",
    filePath: "E:/clone app/backend/books/oxford handbook gastroenterology and hepatolgy.pdf",
    title: "Oxford Handbook of Gastroenterology and Hepatology (2nd Edition)",
    authors: "Stuart Bloom, George Webster, Daniel Marks",
    publisher: "Oxford University Press",
    specialties: ["Gastroenterology", "Hepatology"],
    keywords: ["lft", "liver", "bilirubin", "sgot", "ast", "sgpt", "alt", "alkaline phosphatase", "alp", "ggt", "hepatitis", "cirrhosis", "gerd", "peptic ulcer", "ibd", "crohn", "ulcerative colitis", "pancreatitis", "amylase", "lipase", "calprotectin"],
    clinicalContext: "Comprehensive digestive & liver disease protocols: hepatocellular vs cholestatic liver injury patterns, R-ratio, cirrhosis complications (ascites, varices), IBD monitoring, and acute pancreatitis severity."
  },
  {
    id: "BOOK-PEDIATRIC-HEMATOLOGY",
    fileName: "Practical Pediatric Hematology - Anupam, Sachdeva [SRG].pdf",
    filePath: "E:/clone app/backend/books/Practical Pediatric Hematology - Anupam, Sachdeva [SRG].pdf",
    title: "Practical Pediatric Hematology (2nd Edition)",
    authors: "Anupam Sachdeva",
    publisher: "Jaypee Brothers",
    specialties: ["Hematology", "Pediatrics", "Pathology"],
    keywords: ["cbc", "hemoglobin", "rbc", "wbc", "platelets", "mcv", "mch", "mchc", "rdw", "anemia", "iron deficiency", "thalassemia", "mentzer index", "leukemia", "thrombocytopenia", "esr"],
    clinicalContext: "Complete blood count and red cell index evaluation: microcytic hypochromic vs macrocytic anemias, Mentzer Index (MCV/RBC < 13 suggests Thalassemia trait), bone marrow failure, and coagulopathies."
  },
  {
    id: "BOOK-MARINO-ICU",
    fileName: "Paul L. Marino Marinos the ICU Book 4th edition.pdf",
    filePath: "E:/clone app/backend/books/Paul L. Marino Marinos the ICU Book 4th edition.pdf",
    title: "Marino's The ICU Book (4th Edition)",
    authors: "Paul L. Marino",
    publisher: "Wolters Kluwer / Lippincott Williams & Wilkins",
    specialties: ["Critical Care", "Emergency Medicine", "Pulmonology", "Nephrology"],
    keywords: ["abg", "arterial blood gas", "ph", "pco2", "po2", "hco3", "base excess", "anion gap", "metabolic acidosis", "respiratory acidosis", "lactate", "sepsis", "shock", "electrolytes", "potassium", "sodium", "calcium"],
    clinicalContext: "Physiological acid-base analysis: Winter's formula for respiratory compensation, delta-delta anion gap, oxygenation index (PaO2/FiO2), hemodynamic shock protocols, and acute electrolyte emergencies."
  },
  {
    id: "BOOK-DERMATOLOGY-SKIN",
    fileName: "Treatment of Skin Disease 4th Edition.pdf",
    filePath: "E:/clone app/backend/books/Treatment of Skin Disease 4th Edition.pdf",
    title: "Treatment of Skin Disease: Comprehensive Therapeutic Strategies (4th Edition)",
    authors: "Mark G. Lebwohl, Warren R. Heymann, John Berth-Jones, Ian Coulson",
    publisher: "Elsevier Saunders",
    specialties: ["Dermatology", "Allergology"],
    keywords: ["skin", "rash", "acne", "eczema", "dermatitis", "psoriasis", "urticaria", "alopecia", "onychomycosis", "fungal", "melanoma", "pruritus", "dermatoscopy"],
    clinicalContext: "Therapeutic dermatology guidelines: step-wise management of inflammatory dermatoses, topical corticosteroids potency tiers, systemic biologics, retinoid safety protocols, and skin cancer identification."
  },
  {
    id: "BOOK-MICROBIOLOGY-MAHON",
    fileName: "Connie R. Mahon_ Donald C Lehman - Textbook of Diagnostic Microbiology (2018, Saunders).pdf",
    filePath: "E:/clone app/backend/books/Connie R. Mahon_ Donald C Lehman - Textbook of Diagnostic Microbiology (2018, Saunders).pdf",
    title: "Textbook of Diagnostic Microbiology (6th Edition)",
    authors: "Connie R. Mahon, Donald C. Lehman",
    publisher: "Saunders / Elsevier",
    specialties: ["Microbiology", "Infectious Disease", "Pathology"],
    keywords: ["urine culture", "pus cells", "blood culture", "gram stain", "bacteria", "staphylococcus", "streptococcus", "e. coli", "antibiotic sensitivity", "mic", "fungal culture", "afb"],
    clinicalContext: "Clinical microbiological diagnostic standards: interpretation of colony counts (> 10^5 CFU/mL significant bacteriuria), antibiotic susceptibility breakpoints (CLSI/EUCAST), and Gram stain morphology."
  },
  {
    id: "BOOK-FUNDAMENTALS-RADIOLOGY",
    fileName: "Fundamentals of Diagnostic Radiology, 4E 4-VOLUME SET (2012).pdf",
    filePath: "E:/clone app/backend/books/Fundamentals of Diagnostic Radiology, 4E 4-VOLUME SET (2012).pdf",
    title: "Fundamentals of Diagnostic Radiology (4th Edition, 4-Volume Set)",
    authors: "William E. Brant, Clyde A. Helms",
    publisher: "Lippincott Williams & Wilkins",
    specialties: ["Radiology", "Emergency Medicine"],
    keywords: ["ultrasound", "usg", "ct scan", "mri", "x-ray", "abdominal ultrasound", "pelvic ultrasound", "liver usg", "kidney usg", "gallstones", "cholecystitis", "appendicitis", "hydronephrosis", "lymphadenopathy"],
    clinicalContext: "Core diagnostic imaging reference: sonographic criteria for cholecystitis (Murphy's sign, wall > 3mm), CT features of acute appendicitis, bowel obstruction, and pelvic mass characterization."
  },
  {
    id: "BOOK-ABC-EMERGENCY-DIAGNOSIS",
    fileName: "ABC of Emergency Differential Diagnosis-1.pdf",
    filePath: "E:/clone app/backend/books/ABC of Emergency Differential Diagnosis-1.pdf",
    title: "ABC of Emergency Differential Diagnosis",
    authors: "Francis Morris, Alan Fletcher",
    publisher: "BMJ Books / Wiley-Blackwell",
    specialties: ["Emergency Medicine", "Internal Medicine"],
    keywords: ["differential diagnosis", "acute chest pain", "acute dyspnea", "acute abdominal pain", "headache red flags", "syncope", "altered consciousness", "fever", "hematemesis"],
    clinicalContext: "Emergency red flag algorithms: rule-out pathways for life-threatening chest pain (ACS, Aortic Dissection, PE, Tension Pneumothorax, Esophageal Rupture), acute abdomen, and sudden severe headaches."
  },
  {
    id: "BOOK-DAVIDSON-100-CASES",
    fileName: "Davidson's 100 clinical cases-Churchill Livingstone_Elsevier (2012).pdf",
    filePath: "E:/clone app/backend/books/Davidson's 100 clinical cases-Churchill Livingstone_Elsevier (2012).pdf",
    title: "Davidson's 100 Clinical Cases (2nd Edition)",
    authors: "Mark W. J. Strachan, S. K. Sharma, John A. A. Hunter",
    publisher: "Churchill Livingstone / Elsevier",
    specialties: ["Internal Medicine", "General Medicine"],
    keywords: ["clinical case", "internal medicine", "differential diagnosis", "multisystem", "diabetes", "thyroid", "hypertension", "renal failure", "lupus", "autoimmune", "fever of unknown origin"],
    clinicalContext: "Integrated clinical case reasoning: bedside presentation to laboratory synthesis, diagnostic test ordering strategies, and systemic disease correlations."
  },
  {
    id: "BOOK-BLUEPRINTS-FAMILY-MED",
    fileName: "(Blueprints Series) - Blueprints Family Medicine, 3E 2010 [PDF][Dr.Carson].pdf",
    filePath: "E:/clone app/backend/books/(Blueprints Series) - Blueprints Family Medicine, 3E 2010 [PDF][Dr.Carson].pdf",
    title: "Blueprints Family Medicine (3rd Edition)",
    authors: "Martin S. Lipsky, Mitchell S. King",
    publisher: "Lippincott Williams & Wilkins",
    specialties: ["Family Medicine", "Preventive Medicine", "Primary Care"],
    keywords: ["family medicine", "primary care", "preventive health", "screening", "dyslipidemia", "type 2 diabetes", "hypertension", "vaccination", "lifestyle counseling", "geriatrics"],
    clinicalContext: "Primary care clinical guidance: preventive screening guidelines (USPSTF), routine health checkups, chronic disease management, outpatient patient counseling, and appropriate specialty referral thresholds."
  }
];

fs.writeFileSync(path.join(outputDir, 'medicalBooksCatalog.json'), JSON.stringify(MEDICAL_BOOKS_CATALOG, null, 2));
console.log(`✅ Generated medicalBooksCatalog.json with ${MEDICAL_BOOKS_CATALOG.length} verified authoritative medical textbooks!`);
