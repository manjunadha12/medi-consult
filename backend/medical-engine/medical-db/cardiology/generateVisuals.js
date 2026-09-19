import fs from 'fs';
import path from 'path';

const assetsDir = path.join(path.resolve(), 'medical-db', 'cardiology', 'assets');
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// 1. JVP Waveform SVG Diagram
const jvpSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 350" width="100%" height="350">
  <defs>
    <linearGradient id="jvpGrad" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#3b82f6" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="#3b82f6" stop-opacity="0.0"/>
    </linearGradient>
  </defs>
  <rect width="800" height="350" fill="#0f172a" rx="12"/>
  <text x="400" y="35" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">Normal Jugular Venous Pressure (JVP) Waveform</text>
  <text x="400" y="58" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12" text-anchor="middle">Atrial &amp; Ventricular Hemodynamic Cycle</text>
  
  <!-- Grid Lines -->
  <line x1="60" y1="280" x2="740" y2="280" stroke="#334155" stroke-width="1.5"/>
  <line x1="60" y1="200" x2="740" y2="200" stroke="#334155" stroke-dasharray="4,4" stroke-width="1"/>
  <line x1="60" y1="120" x2="740" y2="120" stroke="#334155" stroke-dasharray="4,4" stroke-width="1"/>
  
  <!-- Waveform Path -->
  <path d="M 80 230 Q 140 90 170 110 T 230 250 Q 260 210 280 215 T 340 270 Q 420 130 460 140 T 540 265 Q 600 240 680 230" fill="url(#jvpGrad)" stroke="#38bdf8" stroke-width="3.5" stroke-linecap="round"/>
  
  <!-- Wave Annotations -->
  <!-- 'a' Wave -->
  <circle cx="170" cy="110" r="5" fill="#ef4444"/>
  <text x="170" y="95" fill="#ef4444" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">a wave</text>
  <text x="170" y="305" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Atrial Contraction</text>
  <text x="170" y="320" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">(End-Diastole)</text>

  <!-- 'c' Wave -->
  <circle cx="280" cy="215" r="4" fill="#fbbf24"/>
  <text x="280" y="195" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" text-anchor="middle">c wave</text>
  <text x="280" y="305" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Tricuspid Bulge</text>
  <text x="280" y="320" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">(Early Systole)</text>

  <!-- 'x' Descent -->
  <circle cx="340" cy="270" r="4" fill="#a855f7"/>
  <text x="340" y="255" fill="#a855f7" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">x descent</text>
  <text x="340" y="305" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Atrial Relaxation</text>

  <!-- 'v' Wave -->
  <circle cx="460" cy="140" r="5" fill="#10b981"/>
  <text x="460" y="125" fill="#10b981" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" text-anchor="middle">v wave</text>
  <text x="460" y="305" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Venous Filling</text>
  <text x="460" y="320" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">(Late Systole)</text>

  <!-- 'y' Descent -->
  <circle cx="540" cy="265" r="4" fill="#ec4899"/>
  <text x="540" y="250" fill="#ec4899" font-family="system-ui, sans-serif" font-size="13" font-weight="bold" text-anchor="middle">y descent</text>
  <text x="540" y="305" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="11" text-anchor="middle">Ventricular Filling</text>
  <text x="540" y="320" fill="#64748b" font-family="system-ui, sans-serif" font-size="10" text-anchor="middle">(Early Diastole)</text>
</svg>`;

fs.writeFileSync(path.join(assetsDir, 'jvp_waveform.svg'), jvpSvg);

// 2. ECG 12-Lead Ischemia Map SVG
const ecgMapSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 420" width="100%" height="420">
  <rect width="800" height="420" fill="#0f172a" rx="12"/>
  <text x="400" y="35" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">12-Lead ECG Coronary Territory &amp; Ischemia Localization</text>
  
  <!-- Lead Grid -->
  <!-- Row 1: High Lateral / Lateral -->
  <rect x="50" y="70" width="150" height="65" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
  <text x="65" y="95" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">Lead I</text>
  <text x="65" y="115" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">High Lateral (LCx)</text>

  <rect x="230" y="70" width="150" height="65" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
  <text x="245" y="95" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">aVR</text>
  <text x="245" y="115" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Cavity / LMCA Sub</text>

  <rect x="410" y="70" width="150" height="65" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
  <text x="425" y="95" fill="#34d399" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">V1</text>
  <text x="425" y="115" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Septal (LAD)</text>

  <rect x="590" y="70" width="150" height="65" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
  <text x="605" y="95" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">V4</text>
  <text x="605" y="115" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Anterior (LAD)</text>

  <!-- Row 2: Inferior / Septal / Anterior -->
  <rect x="50" y="155" width="150" height="65" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
  <text x="65" y="180" fill="#f87171" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">Lead II</text>
  <text x="65" y="200" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Inferior (RCA)</text>

  <rect x="230" y="155" width="150" height="65" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
  <text x="245" y="180" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">aVL</text>
  <text x="245" y="200" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">High Lateral (LCx)</text>

  <rect x="410" y="155" width="150" height="65" rx="8" fill="#1e293b" stroke="#10b981" stroke-width="2"/>
  <text x="425" y="180" fill="#34d399" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">V2</text>
  <text x="425" y="200" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Septal (LAD)</text>

  <rect x="590" y="155" width="150" height="65" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
  <text x="605" y="180" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">V5</text>
  <text x="605" y="200" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Lateral (LCx/LAD)</text>

  <!-- Row 3: Inferior / Anterolateral -->
  <rect x="50" y="240" width="150" height="65" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
  <text x="65" y="265" fill="#f87171" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">Lead III</text>
  <text x="65" y="285" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Inferior (RCA)</text>

  <rect x="230" y="240" width="150" height="65" rx="8" fill="#1e293b" stroke="#ef4444" stroke-width="2"/>
  <text x="245" y="265" fill="#f87171" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">aVF</text>
  <text x="245" y="285" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Inferior (RCA)</text>

  <rect x="410" y="240" width="150" height="65" rx="8" fill="#1e293b" stroke="#f59e0b" stroke-width="2"/>
  <text x="425" y="265" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">V3</text>
  <text x="425" y="285" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Anterior (LAD)</text>

  <rect x="590" y="240" width="150" height="65" rx="8" fill="#1e293b" stroke="#3b82f6" stroke-width="2"/>
  <text x="605" y="265" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="16" font-weight="bold">V6</text>
  <text x="605" y="285" fill="#94a3b8" font-family="system-ui, sans-serif" font-size="12">Lateral (LCx/LAD)</text>

  <!-- Legend -->
  <rect x="50" y="325" width="700" height="70" rx="8" fill="#1e293b"/>
  <circle cx="80" cy="360" r="7" fill="#ef4444"/>
  <text x="95" y="365" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13">Inferior (II, III, aVF) — RCA</text>

  <circle cx="280" cy="360" r="7" fill="#10b981"/>
  <text x="295" y="365" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13">Septal (V1, V2) — LAD</text>

  <circle cx="460" cy="360" r="7" fill="#f59e0b"/>
  <text x="475" y="365" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13">Anterior (V3, V4) — LAD</text>

  <circle cx="630" cy="360" r="7" fill="#3b82f6"/>
  <text x="645" y="365" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13">Lateral (I, aVL, V5, V6) — LCx</text>
</svg>`;

fs.writeFileSync(path.join(assetsDir, 'ecg_ischemia_map.svg'), ecgMapSvg);

// 3. Stanford Aortic Dissection SVG
const dissectionSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 360" width="100%" height="360">
  <rect width="800" height="360" fill="#0f172a" rx="12"/>
  <text x="400" y="35" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" text-anchor="middle">Stanford Classification of Aortic Dissection</text>
  
  <!-- Stanford Type A Box -->
  <rect x="50" y="70" width="330" height="260" rx="10" fill="#1e293b" stroke="#ef4444" stroke-width="2.5"/>
  <text x="215" y="105" fill="#f87171" font-family="system-ui, sans-serif" font-size="17" font-weight="bold" text-anchor="middle">Stanford Type A (Proximal)</text>
  <text x="70" y="140" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">• Involves the Ascending Aorta</text>
  <text x="70" y="165" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">  (May propagate into arch and descending)</text>
  <text x="70" y="195" fill="#f87171" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">• SURGICAL EMERGENCY</text>
  <text x="70" y="220" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">  Immediate open surgical replacement</text>
  <text x="70" y="240" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">  Mortality ~1-2% per hour without repair</text>
  <text x="70" y="275" fill="#fbbf24" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">• Key Risks: Tamponade, Severe AR, MI</text>

  <!-- Stanford Type B Box -->
  <rect x="420" y="70" width="330" height="260" rx="10" fill="#1e293b" stroke="#3b82f6" stroke-width="2.5"/>
  <text x="585" y="105" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="17" font-weight="bold" text-anchor="middle">Stanford Type B (Distal)</text>
  <text x="440" y="140" fill="#f8fafc" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">• Confined to Descending Aorta</text>
  <text x="440" y="165" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">  (Originates distal to left subclavian artery)</text>
  <text x="440" y="195" fill="#38bdf8" font-family="system-ui, sans-serif" font-size="13" font-weight="bold">• MEDICAL MANAGEMENT FIRST-LINE</text>
  <text x="440" y="220" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">  IV Beta-Blockers (Labetalol/Esmolol)</text>
  <text x="440" y="240" fill="#cbd5e1" font-family="system-ui, sans-serif" font-size="12">  Target SBP 100-120 mmHg, HR &lt; 60 bpm</text>
  <text x="440" y="275" fill="#34d399" font-family="system-ui, sans-serif" font-size="12" font-weight="bold">• TEVAR: Endovascular repair if complicated</text>
</svg>`;

fs.writeFileSync(path.join(assetsDir, 'stanford_aortic_dissection.svg'), dissectionSvg);

console.log("Visual SVG diagrams generated successfully in cardiology/assets/ !");
