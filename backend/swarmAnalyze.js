import dotenv from "dotenv";
import axios from "axios";
dotenv.config();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
console.log(`[SWARM_INIT] API Keys Detected: OpenRouter(${OPENROUTER_API_KEY ? 'YES' : 'NO'}), Gemini(${GEMINI_API_KEY ? 'YES' : 'NO'})`);

// Advanced multi-tier model swarm for maximum reliability
const DEFAULT_MODELS = [
  "google/gemini-2.0-flash-exp:free",      // Tier 1: Speed & Vision
  "google/gemini-2.0-flash-lite-preview-02-05:free",
  "google/gemma-2-9b-it:free",
  "mistralai/mistral-7b-instruct:free",
  "deepseek/deepseek-chat",
  "openrouter/free"
];

async function callDirectGemini(params) {
  const { prompt, imageBase64, mimeType, systemPrompt, signal } = params;
  if (!GEMINI_API_KEY) throw new Error("Gemini API Key missing from registry");

  console.log(`[GEMINI_DIRECT_TRACE] Handshake initiated with key: ${GEMINI_API_KEY.substring(0, 4)}...`);

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

  const payload = {
    contents: [],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json"
    }
  };

  if (systemPrompt) {
    payload.systemInstruction = {
      parts: [{ text: systemPrompt }]
    };
  }

  const userParts = [];
  if (imageBase64) {
    userParts.push({ text: prompt || "Analyze this image." });
    userParts.push({
      inlineData: {
        mimeType: mimeType || "image/jpeg",
        data: imageBase64
      }
    });
  } else {
    userParts.push({ text: prompt });
  }

  payload.contents.push({ role: "user", parts: userParts });

  const response = await axios.post(url, payload, {
    headers: { "Content-Type": "application/json" },
    signal
  });

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    console.error("[GEMINI_DIRECT_ERR] Empty response body", JSON.stringify(response.data));
    throw new Error("Invalid response from Gemini API");
  }

  return text;
}

function cleanupResponse(answer) {
  if (!answer || answer.length <= 5) return answer;

  // Cleanup JSON
  answer = answer.replace(/```json/g, '').replace(/```/g, '').trim();

  const start = answer.indexOf('{');
  const end = answer.lastIndexOf('}') + 1;
  if (start !== -1 && end > start) {
      answer = answer.substring(start, end);
  }
  return answer;
}

export async function swarmAnalyze({ prompt, imageBase64, mimeType, systemPrompt, preferredModel, useDirectKey }) {
  if (!OPENROUTER_API_KEY && !GEMINI_API_KEY) {
    console.error("[SWARM_FATAL] API Keys are missing from environment registry.");
    return JSON.stringify({ error: "Configuration Missing", message: "Institutional API Keys are not synchronized." });
  }

  const hasImage = Boolean(imageBase64);
  const modelsToTry = preferredModel ? [preferredModel, ...DEFAULT_MODELS.filter(m => m !== preferredModel)] : DEFAULT_MODELS;

  for (const model of modelsToTry) {
    try {
      // 1. Direct Gemini Handshake (if enabled and requested for this specific task)
      if (useDirectKey && model.includes("google/gemini") && GEMINI_API_KEY) {
        try {
          console.log(`[SWARM] Attempting Direct Gemini Node Sync (AI Chat Preferred): ${model}`);
          const answer = await callDirectGemini({ prompt, imageBase64, mimeType, systemPrompt, signal: controller.signal });
          if (answer) {
             console.log(`[SWARM] Direct Gemini Handshake Success`);
             return cleanupResponse(answer);
          }
        } catch (gemErr) {
          const detail = gemErr.response?.data?.error?.message || gemErr.message;
          console.warn(`[SWARM] Direct Gemini Node jittered: ${detail}. Falling back to OpenRouter pool.`);
        }
      }

      // 2. OpenRouter Pool Handshake
      const systemContent = systemPrompt || "You are a professional medical data extraction engine. You MUST return ONLY a valid JSON object string. Extract name, age, weight, height, problems, summary, riskLevel, abnormalValues, and suggestedSpecialist.";

      const messages = [
        { role: "system", content: systemContent },
        {
          role: "user",
          content: hasImage
            ? [
                { type: "text", text: prompt || "Analyze this clinical report." },
                { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}` } }
              ]
            : prompt
        }
      ];

      const controller = new AbortController();
      // Institutional timeout protocol: 90s for vision, 60s for reasoning/text.
      const timeoutLimit = hasImage ? 90000 : 60000;
      const timeoutId = setTimeout(() => controller.abort(), timeoutLimit);

      // Implement a mini-retry for each model node
      let axiosResponse = null;
      let retries = preferredModel ? 1 : 0; // Don't retry if preferredModel, it's a direct link

      for (let attempt = 0; attempt <= retries; attempt++) {
        try {
          axiosResponse = await axios.post("https://openrouter.ai/api/v1/chat/completions", {
            model,
            messages,
            temperature: 0.1
          }, {
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json",
              "HTTP-Referer": "http://localhost:5173",
              "X-Title": "Medi Consult Institutional"
            },
            signal: controller.signal
          });
          if (axiosResponse) break;
        } catch (e) {
          if (attempt === retries) throw e;
          console.warn(`[SWARM] Node ${model} jittered. Re-initiating...`);
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      clearTimeout(timeoutId);
      const data = axiosResponse.data;
      let answer = data?.choices?.[0]?.message?.content;

      if (answer && answer.length > 5) {
        console.log(`[SWARM] Neural Handshake Success: ${model}`);
        return cleanupResponse(answer);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.error?.message || error.message;
      console.error(`[SWARM_NODE_FAIL] Node: ${model} | Error: ${errorMsg}`);
      console.log(`[SWARM_INFO] Rotating to next available node in sequence...`);
    }
  }

  return JSON.stringify({
    error: "Swarm Node Sickness",
    message: "The neural nodes are under extreme institutional load. Please wait 15 seconds and re-initiate the handshake.",
    name: "N/A",
    summary: "Neural synthesis nodes are currently saturated. This often happens with high-resolution clinical images on free nodes.",
    aiExplanation: "The neural pharmacology node is currently saturated. Clinical data mapping is on standby.",
    sideEffects: [],
    precautions: []
  });
}
