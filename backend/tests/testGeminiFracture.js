import fs from 'fs';
import dotenv from 'dotenv';
import sharp from 'sharp';
dotenv.config();

const imgPath = 'E:/clone app/backend/uploads/patient/PAT1001/report-1788338624256-173417135.jpg';
const meta = await sharp(imgPath).metadata();
const imgW = meta.width;
const imgH = meta.height;
console.log('Original Image Size:', imgW, 'x', imgH);

const fileBuffer = fs.readFileSync(imgPath);
const base64Data = fileBuffer.toString('base64');

const prompt = `You are an expert orthopedic radiologist and computer vision deep learning AI.
Analyze this musculoskeletal X-ray radiograph film with millimeter precision.

Task:
1. Determine if fractures / dislocations / cortical breaches are present.
2. If present, detect EVERY fracture locus across all radiographic views (AP, Lateral, Oblique).
3. For each fracture site, return:
   - label: 'Fracture 1', 'Fracture 2', etc.
   - anatomicalSite: e.g. 'Left Ulna Shaft (AP View)', 'Left Radius Shaft (AP View)', 'Left Ulna Shaft (Lateral View)', 'Left Radius Shaft (Lateral View)'
   - box_2d: [ymin, xmin, ymax, xmax] in normalized coordinates from 0 to 1000
   - confidence: 0 to 100 percentage
   - displacementType: e.g. 'Complete displaced fracture', 'Incomplete greenstick buckle', 'Cortical step-off'
   - clinicalRecommendation: e.g. 'Long arm cast / orthopedic consultation'

Return ONLY valid JSON:
{
  "isFracturePresent": true,
  "anatomicalRegion": "Left Forearm (Radius and Ulna)",
  "overallConfidence": 99.2,
  "totalFracturesCount": 4,
  "fractures": [
    {
      "label": "Fracture 1",
      "anatomicalSite": "...",
      "box_2d": [ymin, xmin, ymax, xmax],
      "confidence": 98.5,
      "displacementType": "...",
      "clinicalRecommendation": "..."
    }
  ]
}
`;

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

const payload = {
  contents: [
    {
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: 'image/jpeg',
            data: base64Data
          }
        }
      ]
    }
  ],
  generationConfig: {
    temperature: 0.05,
    response_mime_type: 'application/json'
  }
};

const res = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});

const json = await res.json();
const result = JSON.parse(json.candidates?.[0]?.content?.parts?.[0]?.text);
console.log('--- DETECTED FRACTURES WITH NORMALIZED 2D BOXES ---');
console.log(JSON.stringify(result, null, 2));

// Convert normalized 0-1000 box_2d to exact pixel dimensions [x, y, width, height, centerX, centerY]
const pixelFractures = result.fractures.map((f, i) => {
  const [ymin, xmin, ymax, xmax] = f.box_2d;
  const x = Math.round((xmin / 1000) * imgW);
  const y = Math.round((ymin / 1000) * imgH);
  const width = Math.round(((xmax - xmin) / 1000) * imgW);
  const height = Math.round(((ymax - ymin) / 1000) * imgH);
  const centerX = Math.round(x + width / 2);
  const centerY = Math.round(y + height / 2);

  return {
    ...f,
    pixelCoordinates: {
      x,
      y,
      width,
      height,
      centerX,
      centerY
    },
    imageDimensions: {
      width: imgW,
      height: imgH
    }
  };
});

console.log('--- EXACT PIXEL COORDINATES ---');
console.log(JSON.stringify(pixelFractures, null, 2));
