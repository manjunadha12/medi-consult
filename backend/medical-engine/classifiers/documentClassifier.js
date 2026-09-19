import knowledgeBase from '../data/index.js';

/**
 * 1. Document Classification Gatekeeper
 * Classifies document archetype before specialized parsers run.
 */
export function classifyDocument(extractedDoc) {
  if (extractedDoc.isReadableDocument === false || (!extractedDoc.isRadiographFilm && (!extractedDoc.fullText || extractedDoc.fullText.trim().length < 15))) {
    return {
      documentType: 'NON_MEDICAL',
      isNonMedicalImage: true,
      classifiedCategories: [],
      detectedTests: [],
      documentBadges: []
    };
  }

  const fullTextLower = (extractedDoc.fullText || '').toLowerCase();
  
  // 1. Ultrasound / USG (Abdomen & Pelvis / Doppler / Sonography)
  const isUSG = (
    fullTextLower.includes('ultrasound') ||
    fullTextLower.includes('sonography') ||
    fullTextLower.includes('usg') ||
    (fullTextLower.includes('abdomen') && fullTextLower.includes('pelvis')) ||
    (fullTextLower.includes('liver') && (fullTextLower.includes('gallbladder') || fullTextLower.includes('kidney') || fullTextLower.includes('spleen'))) ||
    fullTextLower.includes('hydronephrosis') ||
    fullTextLower.includes('lymphadenopathy') ||
    fullTextLower.includes('echotexture')
  );

  // 2. ENT / Audiology / Tympanometry Signatures
  const isENT = (
    /\bent\b/i.test(fullTextLower) ||
    /\btymp/i.test(fullTextLower) ||
    /\baudiolog/i.test(fullTextLower) ||
    fullTextLower.includes('middle ear') ||
    fullTextLower.includes('ear function') ||
    fullTextLower.includes('acoustic reflex') ||
    fullTextLower.includes('audiogram')
  );

  // 3. CT Brain / Head Signatures
  const isCTBrain = !isUSG && !isENT && (
    fullTextLower.includes('ct brain') ||
    fullTextLower.includes('ncct head') ||
    (fullTextLower.includes('computed tomography') && (fullTextLower.includes('brain') || fullTextLower.includes('head') || fullTextLower.includes('axial'))) ||
    fullTextLower.includes('helical ct')
  );

  // 4. MRI Brain Signatures
  const isMRIBrain = !isCTBrain && !isUSG && !isENT && (
    fullTextLower.includes('examination: mri brain') ||
    fullTextLower.includes('magnetic resonance imaging of brain') ||
    (fullTextLower.includes('mri brain') && !fullTextLower.includes('recommendation'))
  );

  // 5. High-priority Cardiology / Echo Signatures
  const isEcho = (
    fullTextLower.includes('adult echo') ||
    fullTextLower.includes('echocardiogram') ||
    fullTextLower.includes('echocardiography') ||
    fullTextLower.includes('mm-teich') ||
    fullTextLower.includes('teich') ||
    fullTextLower.includes('lvidd') ||
    fullTextLower.includes('a4c') ||
    (fullTextLower.includes('lvef') && fullTextLower.includes('lvids'))
  );

  // 6. High-priority ECG Signatures
  const isEcg = (
    fullTextLower.includes('12 lead ecg') ||
    fullTextLower.includes('electrocardiogram') ||
    fullTextLower.includes('resting ecg') ||
    (fullTextLower.includes('sinus rhythm') && fullTextLower.includes('pr interval'))
  );

  // 7. Plain Radiograph Film / X-Ray Signatures
  const isDirectXRayFilm = Boolean(extractedDoc.isRadiographFilm);
  const isXRayReport = !isCTBrain && !isMRIBrain && !isUSG && !isENT && (
    fullTextLower.includes('plain radiograph') ||
    fullTextLower.includes('x-ray') ||
    fullTextLower.includes('chest x-ray') ||
    fullTextLower.includes('knee radiograph')
  );

  // 8. Lab / Biochemistry / Hematology Signatures
  const isLab = (
    fullTextLower.includes('complete blood count') ||
    fullTextLower.includes('hemogram') ||
    fullTextLower.includes('lipid profile') ||
    fullTextLower.includes('liver function') ||
    fullTextLower.includes('kidney function') ||
    fullTextLower.includes('reference interval') ||
    fullTextLower.includes('biological reference') ||
    fullTextLower.includes('methodology') ||
    fullTextLower.includes('specimen')
  );

  // 9. Dental Signatures
  const isDental = (
    fullTextLower.includes('dental report') ||
    fullTextLower.includes('dentist') ||
    fullTextLower.includes('oral health') ||
    fullTextLower.includes('tooth assessment') ||
    fullTextLower.includes('gingivitis') ||
    fullTextLower.includes('caries') ||
    fullTextLower.includes('cavity filling') ||
    (fullTextLower.includes('teeth') && fullTextLower.includes('hygiene'))
  );

  // 10. General Check-Up / Clinical Consultation Signatures
  const isCheckup = (
    fullTextLower.includes('general check-up') ||
    fullTextLower.includes('check-up report') ||
    (fullTextLower.includes('patient details') && fullTextLower.includes('vitals')) ||
    (fullTextLower.includes('medical history') && fullTextLower.includes('vitals')) ||
    fullTextLower.includes("doctor's observations") ||
    fullTextLower.includes('doctor observations') ||
    fullTextLower.includes('notes and next steps') ||
    fullTextLower.includes('physical examination')
  );

  let primaryDocType = 'GENERAL_CLINICAL';
  if (isUSG) primaryDocType = 'GASTRO_USG_ABDOMEN';
  else if (isENT) primaryDocType = 'ENT_TYMPANOGRAM';
  else if (isCTBrain) primaryDocType = 'NEUROLOGY_CT_BRAIN';
  else if (isMRIBrain) primaryDocType = 'NEUROLOGY_MRI_BRAIN';
  else if (isEcho && isLab) primaryDocType = 'COMPOSITE_MULTI_PANEL';
  else if (isEcho) primaryDocType = 'CARDIOLOGY_ECHO';
  else if (isEcg && isLab) primaryDocType = 'COMPOSITE_MULTI_PANEL';
  else if (isEcg) primaryDocType = 'CARDIOLOGY_ECG';
  else if (isDirectXRayFilm || isXRayReport) primaryDocType = 'RADIOLOGY_IMAGING';
  else if (isDental) primaryDocType = 'DENTAL_REPORT';
  else if (isCheckup) primaryDocType = 'GENERAL_CHECKUP_REPORT';
  else if (isLab) primaryDocType = 'STANDARD_LAB_REPORT';

  const classifiedCategories = [];
  const detectedTests = [];

  // Match items based on detected document archetype
  for (const category of knowledgeBase.categories) {
    let catMatchedCount = 0;
    const catItems = [];

    // Archetype-gated category filters to avoid cross-domain false positives
    if (primaryDocType === 'CARDIOLOGY_ECHO' && !['cardiology', 'general'].includes(category.id)) continue;
    if (primaryDocType === 'NEUROLOGY_CT_BRAIN' && !['neurology', 'radiology', 'general'].includes(category.id)) continue;
    if (primaryDocType === 'GASTRO_USG_ABDOMEN' && !['gastro_liver', 'radiology', 'nephrology', 'general'].includes(category.id)) continue;
    if (primaryDocType === 'ENT_TYMPANOGRAM' && !['ent', 'general'].includes(category.id)) continue;
    if (primaryDocType === 'DENTAL_REPORT' && !['dental', 'general'].includes(category.id)) continue;
    if ((primaryDocType === 'RADIOLOGY_IMAGING' || isDirectXRayFilm) && !['radiology', 'orthopedics', 'general'].includes(category.id)) continue;

    for (const item of category.items) {
      let matched = false;
      let matchSource = '';

      if (primaryDocType === 'NEUROLOGY_CT_BRAIN') {
        if (['ONCO_BIOPSY', 'RAD_XRAY', 'ORTHO_XRAY', 'NEUR_MRI_BRAIN', 'RAD_MRI'].includes(item.code)) continue;
      }

      // Check aliases with strict word boundaries
      if (item.aliases && item.aliases.length > 0) {
        for (const alias of item.aliases) {
          if (alias.length <= 2) {
            const strictRegex = new RegExp(`(?:^|\\s|:)${escapeRegExp(alias)}(?:\\s*[:=-]|\\s+\\d)`, 'i');
            if (strictRegex.test(fullTextLower)) {
              matched = true;
              matchSource = alias;
              break;
            }
          } else {
            const regex = new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i');
            if (regex.test(fullTextLower)) {
              matched = true;
              matchSource = alias;
              break;
            }
          }
        }
      }

      if (matched) {
        catMatchedCount++;
        const detectedItem = {
          code: item.code,
          canonicalName: item.canonicalName,
          category: category.name,
          categoryId: category.id,
          categoryIcon: category.icon,
          type: item.type,
          matchSource
        };
        detectedTests.push(detectedItem);
        catItems.push(detectedItem);
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

  // Ensure USG Abdomen & Pelvis has prominent badges
  if (isUSG && !classifiedCategories.some(c => c.id === 'gastro_liver')) {
    classifiedCategories.unshift({
      id: 'gastro_liver',
      name: 'Ultrasound & Abdominal Imaging',
      icon: '🫁',
      itemsCount: 1,
      items: [{
        code: 'GAST_USG_ABDOMEN',
        canonicalName: 'Ultrasound Examination of Abdomen and Pelvis (USG)',
        category: 'Ultrasound & Abdominal Imaging',
        categoryId: 'gastro_liver',
        categoryIcon: '🫁',
        type: 'narrative_diagnostic'
      }]
    });
    detectedTests.unshift({
      code: 'GAST_USG_ABDOMEN',
      canonicalName: 'Ultrasound Examination of Abdomen and Pelvis (USG)',
      category: 'Ultrasound & Abdominal Imaging',
      categoryId: 'gastro_liver',
      categoryIcon: '🫁',
      type: 'narrative_diagnostic'
    });
  }

  // Ensure ENT / Tympanometry has prominent badges
  if (isENT && !classifiedCategories.some(c => c.id === 'ent')) {
    classifiedCategories.unshift({
      id: 'ent',
      name: 'ENT & Audiology',
      icon: '👂',
      itemsCount: 1,
      items: [{
        code: 'ENT_TYMP',
        canonicalName: 'Tympanometry & Acoustic Reflex Examination',
        category: 'ENT & Audiology',
        categoryId: 'ent',
        categoryIcon: '👂',
        type: 'narrative_diagnostic'
      }]
    });
    detectedTests.unshift({
      code: 'ENT_TYMP',
      canonicalName: 'Tympanometry & Acoustic Reflex Examination',
      category: 'ENT & Audiology',
      categoryId: 'ent',
      categoryIcon: '👂',
      type: 'narrative_diagnostic'
    });
  }

  // If CT Brain Report detected, ensure Neurology / CT Brain badge is primary
  if (isCTBrain && !classifiedCategories.some(c => c.id === 'neurology')) {
    classifiedCategories.unshift({
      id: 'neurology',
      name: 'Neurology & Neuroimaging',
      icon: '🧠',
      itemsCount: 1,
      items: [{
        code: 'NEUR_CT_BRAIN',
        canonicalName: 'Computed Tomography (CT Brain / Head)',
        category: 'Neurology & Neuroimaging',
        categoryId: 'neurology',
        categoryIcon: '🧠',
        type: 'narrative_diagnostic'
      }]
    });
    detectedTests.unshift({
      code: 'NEUR_CT_BRAIN',
      canonicalName: 'Computed Tomography (CT Brain / Head)',
      category: 'Neurology & Neuroimaging',
      categoryId: 'neurology',
      categoryIcon: '🧠',
      type: 'narrative_diagnostic'
    });
  }

  // If Echo or ECG detected, ensure Cardiology category is prominent
  if (isEcho && !classifiedCategories.some(c => c.id === 'cardiology')) {
    classifiedCategories.unshift({
      id: 'cardiology',
      name: 'Cardiology',
      icon: '🫀',
      itemsCount: 1,
      items: [{
        code: 'CARD_ECHO',
        canonicalName: 'Echocardiogram (2D Echo / Doppler)',
        category: 'Cardiology',
        categoryId: 'cardiology',
        categoryIcon: '🫀',
        type: 'hybrid_diagnostic'
      }]
    });
    detectedTests.unshift({
      code: 'CARD_ECHO',
      canonicalName: 'Echocardiogram (2D Echo / Doppler)',
      category: 'Cardiology',
      categoryId: 'cardiology',
      categoryIcon: '🫀',
      type: 'hybrid_diagnostic'
    });
  }

  // If Direct Radiograph film or X-Ray detected, ensure Radiology category is added
  if ((isDirectXRayFilm || isXRayReport) && !classifiedCategories.some(c => c.id === 'radiology' || c.id === 'orthopedics')) {
    classifiedCategories.unshift({
      id: 'radiology',
      name: 'Radiology & Orthopedic Imaging',
      icon: '🩻',
      itemsCount: 1,
      items: [{
        code: 'ORTHO_XRAY',
        canonicalName: 'Diagnostic Radiograph (X-Ray Film Scan)',
        category: 'Radiology & Orthopedic Imaging',
        categoryId: 'radiology',
        categoryIcon: '🩻',
        type: 'narrative_diagnostic'
      }]
    });
    detectedTests.unshift({
      code: 'ORTHO_XRAY',
      canonicalName: 'Diagnostic Radiograph (X-Ray Film Scan)',
      category: 'Radiology & Orthopedic Imaging',
      categoryId: 'radiology',
      categoryIcon: '🩻',
      type: 'narrative_diagnostic'
    });
  }

  // If Dental Report detected, ensure Dental category is prominent
  if (isDental && !classifiedCategories.some(c => c.id === 'dental')) {
    classifiedCategories.unshift({
      id: 'dental',
      name: 'Dental Examination & Odontology',
      icon: '🦷',
      itemsCount: 1,
      items: [{
        code: 'DENT_EXAM',
        canonicalName: 'Dental Examination & Assessment',
        category: 'Dental Examination & Odontology',
        categoryId: 'dental',
        categoryIcon: '🦷',
        type: 'narrative_diagnostic'
      }]
    });
    detectedTests.unshift({
      code: 'DENT_EXAM',
      canonicalName: 'Dental Examination & Assessment',
      category: 'Dental Examination & Odontology',
      categoryId: 'dental',
      categoryIcon: '🦷',
      type: 'narrative_diagnostic'
    });
  }

  // If General Checkup detected, ensure General Checkup category is prominent
  if (isCheckup && !classifiedCategories.some(c => c.id === 'general_checkup' || c.id === 'general')) {
    classifiedCategories.unshift({
      id: 'general',
      name: 'General Health Check-Up',
      icon: '🩺',
      itemsCount: 1,
      items: [{
        code: 'GEN_CHECKUP',
        canonicalName: 'General Health Check-Up & Physical Examination',
        category: 'General Health Check-Up',
        categoryId: 'general',
        categoryIcon: '🩺',
        type: 'narrative_diagnostic'
      }]
    });
    detectedTests.unshift({
      code: 'GEN_CHECKUP',
      canonicalName: 'General Health Check-Up & Physical Examination',
      category: 'General Health Check-Up',
      categoryId: 'general',
      categoryIcon: '🩺',
      type: 'narrative_diagnostic'
    });
  }

  // Strict Medical Gatekeeper: If no recognized medical categories or diagnostic procedures matched, flag as NON_MEDICAL
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
      icon: t.categoryIcon
    }))
  };
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
