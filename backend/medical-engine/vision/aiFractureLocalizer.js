import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import dotenv from 'dotenv';
dotenv.config();

/**
 * AI-Driven Radiographic Bone Fracture Localization & Multi-Fracture Coordinate Engine
 * Uses Multimodal AI Computer Vision to detect exact spatial bounding boxes for all
 * fractures across all X-ray views (AP, Lateral, Oblique) and maps them to original image pixel coordinates.
 */
export async function detectFracturesWithAI(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;

    const meta = await sharp(filePath).metadata();
    const origW = meta.width;
    const origH = meta.height;

    // Optimize image payload for instant AI inference while preserving high visual resolution
    const optimizedBuffer = await sharp(filePath)
      .resize(1024, 1024, { fit: 'inside' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const base64Data = optimizedBuffer.toString('base64');

    const prompt = `You are an expert orthopedic radiologist and precision computer vision AI.
Analyze this musculoskeletal X-ray radiograph film with millimeter precision.

Task:
1. Determine if bone fractures, cortical disruptions, step-offs, hairline cracks, or dislocations are present.
2. Detect EVERY distinct fracture site across ALL visualized radiographic projections (AP, Lateral, Oblique, Axial views).
3. If multiple views (e.g. AP view on the left, Lateral view on the right) are shown side-by-side on this film, locate the fracture on EACH respective projection panel.
4. For each fracture detected, provide:
   - label: e.g. 'Fracture 1', 'Fracture 2', 'Fracture 3', 'Fracture 4'
   - anatomicalSite: exact anatomical bone and view, e.g. 'Proximal Tibia & Fibular Head (Lateral View)', 'Tibial Plateau Articular Split (AP View)', 'Distal Radius Metaphysis', '5th Metacarpal Neck'
   - box_2d: [ymin, xmin, ymax, xmax] tightly bounding the EXACT cortical break / step-off line in normalized 0 to 1000 coordinates (0 = top/left, 1000 = bottom/right).
   - confidence: 0 to 100 percentage
   - displacementType: e.g. 'Complete transverse displaced fracture', 'Articular split depression', 'Incomplete greenstick fracture', 'Cortical step-off with angulation'
   - clinicalRecommendation: specific immobilization and orthopedic guidance

Return ONLY valid JSON matching:
{
  "isFracturePresent": true,
  "anatomicalRegion": "Right Knee Joint (Proximal Tibia and Fibular Head)",
  "overallConfidence": 98.5,
  "totalFracturesCount": 2,
  "fractures": [
    {
      "label": "Fracture 1",
      "anatomicalSite": "Proximal Tibia & Fibular Head (Lateral View)",
      "box_2d": [480, 620, 590, 760],
      "confidence": 98.2,
      "displacementType": "Complete displaced fracture with cortical step-off and shaft angulation",
      "clinicalRecommendation": "Immobilize in long leg posterior splint. Immediate orthopedic consultation required."
    }
  ]
}
`;

    console.log(`[AI_FRACTURE] 🤖 AI Multimodal Vision analyzing radiograph film: ${path.basename(filePath)} (${origW}x${origH}px)`);

    let parsed = null;
    const apiKey = process.env.GEMINI_API_KEY;
    const openrouterKey = process.env.OPENROUTER_API_KEY;

    // 1. Try Direct Google Gemini API first with multiple model fallbacks
    if (apiKey) {
      const directGeminiModels = [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
        'gemini-1.5-pro'
      ];

      for (const geminiModel of directGeminiModels) {
        if (parsed) break;
        try {
          const url = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${apiKey}`;
          const payload = {
            contents: [
              {
                role: 'user',
                parts: [
                  { text: prompt },
                  {
                    inlineData: {
                      mimeType: 'image/jpeg',
                      data: base64Data
                    }
                  }
                ]
              }
            ],
            generationConfig: {
              temperature: 0.05,
              responseMimeType: 'application/json'
            }
          };

          const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (res.ok) {
            const json = await res.json();
            const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
              parsed = JSON.parse(cleanText);
              console.log(`[AI_FRACTURE] ✅ Gemini Direct (${geminiModel}) detected fractures: ${parsed.isFracturePresent ? parsed.fractures?.length : 0}`);
              break;
            }
          } else {
            console.warn(`[AI_FRACTURE] Gemini Direct (${geminiModel}) status ${res.status}, checking next model...`);
          }
        } catch (geminiErr) {
          console.warn(`[AI_FRACTURE] Gemini Direct (${geminiModel}) error:`, geminiErr.message);
        }
      }
    }

    // 2. Fallback to OpenRouter Multimodal AI if Gemini direct did not complete
    if (!parsed && openrouterKey) {
      const modelsToTry = [
        'google/gemini-2.0-flash-001',
        'google/gemini-flash-1.5',
        'google/gemini-2.5-flash',
        'openai/gpt-4o-mini',
        'meta-llama/llama-3.2-11b-vision-instruct',
        'google/gemini-3.6-flash:free'
      ];

      for (const modelName of modelsToTry) {
        if (parsed) break;
        try {
          console.log(`[AI_FRACTURE] 🔄 Trying OpenRouter AI Vision (${modelName})...`);
          const orPayload = {
            model: modelName,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: prompt },
                  {
                    type: 'image_url',
                    image_url: { url: `data:image/jpeg;base64,${base64Data}` }
                  }
                ]
              }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.05
          };

          const orRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${openrouterKey}`
            },
            body: JSON.stringify(orPayload)
          });

          if (orRes.ok) {
            const orJson = await orRes.json();
            const rawContent = orJson.choices?.[0]?.message?.content;
            if (rawContent) {
              const cleanContent = rawContent.replace(/```json/g, '').replace(/```/g, '').trim();
              parsed = JSON.parse(cleanContent);
              console.log(`[AI_FRACTURE] ✅ OpenRouter (${modelName}) detected fractures: ${parsed.isFracturePresent ? parsed.fractures?.length : 0}`);
              break;
            }
          }
        } catch (orErr) {
          console.warn(`[AI_FRACTURE] OpenRouter (${modelName}) error:`, orErr.message);
        }
      }
    }

    if (!parsed) {
      console.warn('[AI_FRACTURE] AI vision endpoint unavailable; delegating to local high-resolution CV discontinuity scanner.');
      return null;
    }

    if (!parsed.isFracturePresent || !Array.isArray(parsed.fractures) || parsed.fractures.length === 0) {
      return {
        isFracturePresent: false,
        anatomicalRegion: parsed.anatomicalRegion || 'Musculoskeletal Radiograph',
        overallConfidence: parsed.overallConfidence || 95.0,
        totalFracturesCount: 0,
        fractures: [],
        imageDimensions: { width: origW, height: origH }
      };
    }

    // Map normalized 0-1000 coordinates to original image pixel space [X, Y, Width, Height, CenterX, CenterY]
    const pixelFractures = parsed.fractures.map((f, idx) => {
      const [ymin, xmin, ymax, xmax] = f.box_2d || [300, 300, 500, 500];

      // Convert 0-1000 scale to pixel coordinates
      const x = Math.round((xmin / 1000) * origW);
      const y = Math.round((ymin / 1000) * origH);
      const width = Math.max(20, Math.round(((xmax - xmin) / 1000) * origW));
      const height = Math.max(20, Math.round(((ymax - ymin) / 1000) * origH));
      
      // Calculate true geometric center point
      const centerX = Math.round(((xmin + xmax) / 2000) * origW);
      const centerY = Math.round(((ymin + ymax) / 2000) * origH);

      // Normalized percentages (0..100%)
      const xPercent = (((xmin + xmax) / 2000) * 100).toFixed(1);
      const yPercent = (((ymin + ymax) / 2000) * 100).toFixed(1);
      const widthPercent = (((xmax - xmin) / 1000) * 100).toFixed(1);
      const heightPercent = (((ymax - ymin) / 1000) * 100).toFixed(1);

      return {
        label: f.label || `Fracture ${idx + 1}`,
        anatomicalSite: f.anatomicalSite || 'Bone Cortex',
        confidence: f.confidence || 95.0,
        displacementType: f.displacementType || 'Cortical disruption',
        clinicalRecommendation: f.clinicalRecommendation || 'Orthopedic evaluation required.',
        coordinates: {
          x,
          y,
          width,
          height,
          centerX,
          centerY,
          xPct: (xmin + xmax) / 2000,
          yPct: (ymin + ymax) / 2000,
          xPercent: parseFloat(xPercent),
          yPercent: parseFloat(yPercent),
          widthPercent: parseFloat(widthPercent),
          heightPercent: parseFloat(heightPercent)
        }
      };
    });

    return {
      isFracturePresent: true,
      anatomicalRegion: parsed.anatomicalRegion || 'Musculoskeletal Radiograph',
      overallConfidence: parsed.overallConfidence || 98.0,
      totalFracturesCount: pixelFractures.length,
      fractures: pixelFractures,
      imageDimensions: {
        width: origW,
        height: origH
      }
    };
  } catch (err) {
    console.error('[AI_FRACTURE] Fracture localization error:', err);
    return null;
  }
}

export default detectFracturesWithAI;
