import medicalDb from '../medical-db/index.js';

/**
 * High-Precision Medical Document Detector & Strict Gatekeeper
 */
export function detectDocument(extractedDoc) {
  const fullText = extractedDoc?.fullText || '';
  const fullTextLower = fullText.toLowerCase();

  // Check if text is a paper laboratory test report
  const isLabPaperText = fullTextLower.includes('laboratory report') ||
                         fullTextLower.includes('hospital diagnostics') ||
                         fullTextLower.includes('hemoglobin') ||
                         fullTextLower.includes('wbc') ||
                         fullTextLower.includes('platelet') ||
                         fullTextLower.includes('serum creatinine') ||
                         fullTextLower.includes('blood glucose') ||
                         fullTextLower.includes('reference range') ||
                         fullTextLower.includes('test name');

  // Direct Plain Radiograph has top priority if isRadiographFilm is set and NOT a lab paper report
  const isDirectXRayFilm = !isLabPaperText && Boolean(extractedDoc.isRadiographFilm);
  const isXRayReport = !isLabPaperText && (
    fullTextLower.includes('plain radiograph') ||
    fullTextLower.includes('x-ray') ||
    fullTextLower.includes('chest x-ray') ||
    fullTextLower.includes('knee radiograph') ||
    fullTextLower.includes('radiographic examination') ||
    fullTextLower.includes('skeletal survey') ||
    fullTextLower.includes('tibial plateau') ||
    fullTextLower.includes('cortical step-off') ||
    fullTextLower.includes('displaced fracture')
  );

  // 1. Ultrasound Abdomen & Pelvis Signatures
  const isUSG = !isDirectXRayFilm && (
    fullTextLower.includes('ultrasound examination of abdomen') ||
    fullTextLower.includes('usg abdomen') ||
    fullTextLower.includes('ultrasound abdomen') ||
    fullTextLower.includes('sonography abdomen') ||
    (fullTextLower.includes('liver') && fullTextLower.includes('gallbladder') && fullTextLower.includes('pancreas') && fullTextLower.includes('spleen') && fullTextLower.includes('kidneys') && fullTextLower.includes('echotexture'))
  );

  // 2. ENT / Tympanometry Signatures
  const isENT = !isDirectXRayFilm && (
    fullTextLower.includes('tympanometry report') ||
    fullTextLower.includes('acoustic reflex') ||
    fullTextLower.includes('tympanogram') ||
    (fullTextLower.includes('ipsilateral') && fullTextLower.includes('contralateral') && fullTextLower.includes('dapa'))
  );

  // 3. High-priority CT Brain Signatures
  const isCTBrain = !isDirectXRayFilm && !isUSG && !isENT && (
    fullTextLower.includes('examination: computed tomography (ct) - scan of brain') ||
    fullTextLower.includes('computed tomography (ct) scan of brain') ||
    fullTextLower.includes('ct brain') ||
    fullTextLower.includes('ncct head') ||
    fullTextLower.includes('ct scan of head') ||
    fullTextLower.includes('brain parenchyma')
  );

  // 4. MRI Brain Signatures
  const isMRIBrain = !isDirectXRayFilm && !isCTBrain && !isUSG && !isENT && (
    fullTextLower.includes('mri brain') ||
    fullTextLower.includes('magnetic resonance imaging of brain')
  );

  // 5. Echo / ECG Signatures
  const isEcho = !isDirectXRayFilm && (
    fullTextLower.includes('echocardiogram') ||
    fullTextLower.includes('echocardiography') ||
    fullTextLower.includes('2d echo') ||
    fullTextLower.includes('lvidd') ||
    fullTextLower.includes('lvef')
  );

  const isEcg = !isDirectXRayFilm && (
    fullTextLower.includes('12 lead ecg') ||
    fullTextLower.includes('electrocardiogram') ||
    fullTextLower.includes('resting ecg') ||
    (fullTextLower.includes('sinus rhythm') && fullTextLower.includes('pr interval'))
  );

  // 7. Dental Signatures
  const isDental = !isDirectXRayFilm && (
    fullTextLower.includes('dental report') ||
    fullTextLower.includes('dentist') ||
    fullTextLower.includes('oral health') ||
    fullTextLower.includes('tooth assessment') ||
    fullTextLower.includes('gingivitis') ||
    fullTextLower.includes('caries') ||
    fullTextLower.includes('cavity filling') ||
    (fullTextLower.includes('teeth') && fullTextLower.includes('hygiene'))
  );

  // 8. General Checkup Signatures
  const isCheckup = !isDirectXRayFilm && (
    fullTextLower.includes('general check-up') ||
    fullTextLower.includes('check-up report') ||
    (fullTextLower.includes('patient details') && fullTextLower.includes('vitals')) ||
    fullTextLower.includes("doctor's observations")
  );

  // 9. Standard Lab
  const isLab = !isDirectXRayFilm && (
    fullTextLower.includes('complete blood count') ||
    fullTextLower.includes('hemogram') ||
    fullTextLower.includes('lipid profile') ||
    fullTextLower.includes('reference interval') ||
    fullTextLower.includes('biological reference') ||
    fullTextLower.includes('specimen')
  );

  let primaryDocType = 'GENERAL_CLINICAL';
  if (isDirectXRayFilm || isXRayReport) primaryDocType = 'RADIOLOGY_IMAGING';
  else if (isUSG) primaryDocType = 'GASTRO_USG_ABDOMEN';
  else if (isENT) primaryDocType = 'ENT_TYMPANOGRAM';
  else if (isCTBrain) primaryDocType = 'NEUROLOGY_CT_BRAIN';
  else if (isMRIBrain) primaryDocType = 'NEUROLOGY_MRI_BRAIN';
  else if (isEcho) primaryDocType = 'CARDIOLOGY_ECHO';
  else if (isEcg) primaryDocType = 'CARDIOLOGY_ECG';
  else if (isDental) primaryDocType = 'DENTAL_REPORT';
  else if (isCheckup) primaryDocType = 'GENERAL_CHECKUP_REPORT';
  else if (isLab) primaryDocType = 'STANDARD_LAB_REPORT';

  const classifiedCategories = [];
  const detectedTests = [];

  const categories = medicalDb.getAllCategories();
  for (const category of categories) {
    if (primaryDocType === 'CARDIOLOGY_ECHO' && !['cardiology', 'general'].includes(category.id)) continue;
    if (primaryDocType === 'NEUROLOGY_CT_BRAIN' && !['neurology', 'radiology', 'general'].includes(category.id)) continue;
    if (primaryDocType === 'GASTRO_USG_ABDOMEN' && !['gastro_liver', 'radiology', 'nephrology', 'general'].includes(category.id)) continue;
    if (primaryDocType === 'ENT_TYMPANOGRAM' && !['ent', 'radiology', 'general'].includes(category.id)) continue;
    if (primaryDocType === 'DENTAL_REPORT' && !['pathology', 'general'].includes(category.id)) continue;
    if ((primaryDocType === 'RADIOLOGY_IMAGING' || isDirectXRayFilm) && !['radiology', 'orthopedics'].includes(category.id)) continue;

    let catMatchedCount = 0;
    const catItems = [];

    for (const item of category.items) {
      let matched = false;
      if (item.aliases && item.aliases.length > 0) {
        for (const alias of item.aliases) {
          if (alias.length <= 4) {
            // For short aliases, only match if it is an exact capitalized or distinct word in a real medical context
            if (alias.length <= 3 && item.type === 'narrative_diagnostic') {
              continue;
            }
            const wordRegex = new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i');
            if (wordRegex.test(fullText)) {
              matched = true;
              break;
            }
          } else {
            if (fullTextLower.includes(alias.toLowerCase())) {
              matched = true;
              break;
            }
          }
        }
      }
      if (matched) {
        catMatchedCount++;
        catItems.push(item);
        detectedTests.push({
          ...item,
          category: item.category || category.name,
          categoryId: item.categoryId || category.id,
          categoryIcon: item.categoryIcon || category.icon
        });
      }
    }

    if (catMatchedCount > 0) {
      classifiedCategories.push({
        id: category.id,
        name: category.name,
        icon: category.icon,
        itemsCount: catMatchedCount,
        items: catItems
      });
    }
  }

  // Archetype Badge Attachers
  if (isUSG && !classifiedCategories.some(c => c.name?.includes('Ultrasound'))) {
    classifiedCategories.unshift({ id: 'radiology', name: 'Ultrasound Examination of Abdomen and Pelvis', icon: '🫁', itemsCount: 1, items: [] });
    detectedTests.unshift({ code: 'GAST_USG_ABDOMEN', canonicalName: 'Ultrasound Examination of Abdomen and Pelvis', category: 'Radiology', categoryIcon: '🫁' });
  }
  if (isENT && !classifiedCategories.some(c => c.name?.includes('Tympanometry'))) {
    classifiedCategories.unshift({ id: 'radiology', name: 'Tympanometry / Middle Ear Compliance', icon: '👂', itemsCount: 1, items: [] });
    detectedTests.unshift({ code: 'ENT_TYMP', canonicalName: 'Tympanometry & Acoustic Reflex', category: 'Radiology', categoryIcon: '👂' });
  }
  if (isCTBrain && !classifiedCategories.some(c => c.name?.includes('Computed Tomography'))) {
    classifiedCategories.unshift({ id: 'neurology', name: 'Computed Tomography', icon: '🧠', itemsCount: 1, items: [] });
    detectedTests.unshift({ code: 'NEUR_CT_BRAIN', canonicalName: 'Computed Tomography (CT Brain / Head)', category: 'Neurology', categoryIcon: '🧠' });
  }
  if ((isDirectXRayFilm || isXRayReport) && !classifiedCategories.some(c => c.name?.includes('Radiograph'))) {
    classifiedCategories.unshift({ id: 'radiology', name: 'Diagnostic Radiograph', icon: '🩻', itemsCount: 1, items: [] });
    detectedTests.unshift({ code: 'ORTHO_XRAY', canonicalName: 'Diagnostic Radiograph (Plain X-Ray)', category: 'Radiology', categoryIcon: '🩻' });
  }
  if (isDental && !classifiedCategories.some(c => c.name?.includes('Dental'))) {
    classifiedCategories.unshift({ id: 'pathology', name: 'Dental Examination & Assessment', icon: '🦷', itemsCount: 1, items: [] });
    detectedTests.unshift({ code: 'DENT_EXAM', canonicalName: 'Dental Examination & Assessment', category: 'Pathology', categoryIcon: '🦷' });
  }

  // Strict Medical Gatekeeper
  if (classifiedCategories.length === 0) {
    return {
      documentType: 'NON_MEDICAL',
      isNonMedicalImage: true,
      classifiedCategories: [],
      detectedTests: [],
      documentBadges: []
    };
  }

  return {
    documentType: primaryDocType,
    isNonMedicalImage: false,
    classifiedCategories,
    detectedTests,
    documentBadges: detectedTests.map(t => ({
      code: t.code,
      name: t.canonicalName.split('(')[0].trim(),
      category: t.category,
      icon: t.categoryIcon || '✓'
    }))
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export default detectDocument;
