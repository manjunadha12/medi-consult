import cardiologyDb from './cardiology.json' with { type: 'json' };
import hematologyDb from './hematology.json' with { type: 'json' };
import biochemistryDb from './biochemistry.json' with { type: 'json' };
import endocrinologyDb from './endocrinology.json' with { type: 'json' };
import radiologyDb from './radiology.json' with { type: 'json' };
import neurologyDb from './neurology.json' with { type: 'json' };
import pathologyDb from './pathology.json' with { type: 'json' };
import specialtiesDb from './medicalSpecialties.json' with { type: 'json' };

const allCategories = [
  cardiologyDb,
  hematologyDb,
  biochemistryDb,
  endocrinologyDb,
  radiologyDb,
  neurologyDb,
  pathologyDb
];

// Build flat item lookup dictionary
const itemIndex = new Map();
for (const cat of allCategories) {
  for (const item of cat.items) {
    itemIndex.set(item.code, item);
    if (item.aliases) {
      for (const alias of item.aliases) {
        itemIndex.set(alias.toLowerCase(), item);
      }
    }
  }
}

// Build specialty lookup dictionary
const specialtyIndex = new Map();
for (const spec of specialtiesDb.medical_specialties) {
  specialtyIndex.set(spec.id, spec);
  specialtyIndex.set(spec.specialty_code, spec);
  specialtyIndex.set(spec.specialty_name.toLowerCase(), spec);
  if (spec.synonyms) {
    for (const syn of spec.synonyms) {
      specialtyIndex.set(syn.toLowerCase(), spec);
    }
  }
}

export const medicalDb = {
  version: "3.0.0",
  system: "MediConsult Unified Clinical Knowledge Graph",
  categories: allCategories,
  specialties: specialtiesDb.medical_specialties,
  findByCode: (code) => itemIndex.get(code),
  findByAlias: (alias) => itemIndex.get((alias || '').toLowerCase().trim()),
  findSpecialty: (term) => specialtyIndex.get((term || '').toLowerCase().trim()),
  getAllCategories: () => allCategories,
  getAllSpecialties: () => specialtiesDb.medical_specialties
};

export { specialtiesDb };
export default medicalDb;
