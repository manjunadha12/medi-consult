/**
 * Patient Demographics & Document Bio Extractor
 */
export function extractPatientInfo(lines, fullText = '') {
  const bio = {
    patientName: null,
    age: null,
    sex: null,
    reportDate: null,
    hospitalName: null,
    doctorName: null,
    patientId: null
  };

  const cleanLines = lines.slice(0, 35);

  for (const line of cleanLines) {
    const text = line.text;

    // 1. Patient Name
    if (!bio.patientName) {
      const nameMatch = text.match(/(?:Patient\s*Name|Name|Pt\.?\s*Name)\s*[:=-]\s*([A-Za-z.\s]{2,40})/i) ||
                        text.match(/(?:Mr\.|Mrs\.|Ms\.|Master)\s+([A-Za-z\s]{3,35})/i) ||
                        text.match(/M\s+([A-Za-z\s]{3,30}\s+Reddy)/i);
      if (nameMatch) {
        let cleanName = nameMatch[1] ? nameMatch[1].trim() : nameMatch[0].trim();
        cleanName = cleanName.replace(/\s+(?:Date|Age|Sex|Gender|Req|Ref|Dr|Study|ID|No|Phone|DOB)[:=-]?\s*.*$/i, '').trim();
        cleanName = cleanName.replace(/^[:=\-+]\s*/, '').trim();
        if (cleanName.length >= 2 && !cleanName.toLowerCase().includes('insight') && !cleanName.toLowerCase().includes('diagnostics')) {
          bio.patientName = cleanName;
        }
      }
    }

    // 2. Age / Sex
    if (!bio.age) {
      const ageMatch = text.match(/(?:Age|Age\s*\/\s*Sex|Age\s*:\s*)\s*[:=-]?\s*(\d{1,3})\s*(?:Yrs?|Years?|Y)?/i);
      if (ageMatch) {
        const parsedAge = parseInt(ageMatch[1], 10);
        if (parsedAge > 0 && parsedAge < 125) {
          bio.age = parsedAge;
        }
      }
    }

    if (!bio.sex) {
      if (/\b(?:Male|M)\b/i.test(text) && !/\b(?:Female|F)\b/i.test(text) && !text.includes('Method') && !text.includes('Microscopy')) {
        bio.sex = "Male";
      } else if (/\b(?:Female|F)\b/i.test(text) && !text.includes('Method') && !text.includes('Fast')) {
        bio.sex = "Female";
      }
    }

    // 3. Date
    if (!bio.reportDate) {
      const dateMatch = text.match(/(?:Date|Report\s*Date|Sample\s*Date|Study\s*Date)\s*[:=-]?\s*(\d{1,2}[-/.][A-Za-z0-9]{2,4}[-/.](?:\d{2,4})|\d{1,2}\s+[A-Za-z]{3}\s+\d{4})/i) ||
                        text.match(/(\d{1,2}[-/.](?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[-/.](?:\d{2,4}))/i);
      if (dateMatch) {
        bio.reportDate = dateMatch[1].trim();
      }
    }

    // 4. Doctor Name
    if (!bio.doctorName) {
      const docMatch = text.match(/(?:Dr\.|Doctor|Ref\s*By|Dentist)\s*[:=-]?\s*([A-Za-z.\s]{3,35})/i);
      if (docMatch) {
        bio.doctorName = docMatch[0].trim();
      }
    }
  }

  // Fallback defaults
  if (!bio.reportDate) {
    bio.reportDate = new Date().toLocaleDateString();
  }

  return bio;
}

export default extractPatientInfo;
