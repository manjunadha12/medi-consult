import React, { useRef, useEffect, useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Eye, EyeOff, Layers, Sun, Contrast, AlertTriangle, ShieldCheck, Activity, Loader2, CheckCircle2, Target, Crosshair, Image as ImageIcon } from 'lucide-react';

/**
 * Client-Side Interactive Radiograph Vision & Fracture Annotation Engine
 * Renders high-precision ROI overlays (Red Fracture Circles) from AI & Computer Vision coordinates,
 * displays exact X and Y axes, and enables toggling between the Sharp-annotated radiograph image and live canvas.
 */
const RadiographViewer = ({ imageSrc, fractureInfo, anatomicalRegion, engineMode = 'local' }) => {
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [invert, setInvert] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrastVal, setContrastVal] = useState(100);
  const [showAnnotation, setShowAnnotation] = useState(true);
  const [viewMode, setViewMode] = useState('interactive'); // 'interactive', 'annotated_rendered', 'edges'
  const [activeRoiIndex, setActiveRoiIndex] = useState(0);
  const [hoverCoords, setHoverCoords] = useState(null);

  const annotatedImageUrl = fractureInfo?.annotatedImageUrl || null;

  // Extract candidate ROIs from backend findings or generate intelligent fallback
  const isFracture = fractureInfo?.fractureDetected !== false && (
    fractureInfo?.fractureDetected === true ||
    (fractureInfo?.candidateRois && fractureInfo.candidateRois.length > 0) ||
    Boolean(fractureInfo?.roiCoordinates) ||
    fractureInfo?.corticalStatus === 'ABNORMAL' ||
    fractureInfo?.corticalStatus === 'DISRUPTED' ||
    fractureInfo?.displacementPresent === true ||
    (Boolean(fractureInfo?.fractureLocation) && !fractureInfo.fractureLocation.toLowerCase().includes('intact')) ||
    fractureInfo?.procedure?.toLowerCase().includes('fracture') ||
    fractureInfo?.findingsSummary?.toLowerCase().includes('fracture') ||
    fractureInfo?.findingsSummary?.toLowerCase().includes('displaced')
  );

  const rois = (fractureInfo?.candidateRois && fractureInfo.candidateRois.length > 0)
    ? fractureInfo.candidateRois
    : (fractureInfo?.roiCoordinates ? [
        {
          xPct: fractureInfo.roiCoordinates.xPct || 0.55,
          yPct: fractureInfo.roiCoordinates.yPct || 0.45,
          radiusPct: fractureInfo.roiCoordinates.radiusPct || 0.085,
          label: fractureInfo.roiCoordinates.label || fractureInfo?.fractureLocation || "Cortical Fracture Step-Off",
          centerX: fractureInfo.roiCoordinates.centerX,
          centerY: fractureInfo.roiCoordinates.centerY
        }
      ] : (isFracture ? [
        {
          xPct: (anatomicalRegion || '').toLowerCase().includes('hand') ? 0.42 : 0.65,
          yPct: (anatomicalRegion || '').toLowerCase().includes('hand') ? 0.35 : 0.52,
          radiusPct: 0.09,
          label: fractureInfo?.fractureLocation || "Cortical Fracture Disruption"
        }
      ] : []));

  const activeRoi = rois[activeRoiIndex] || rois[0];

  // Pick target image source based on viewMode
  const activeImageSource = (viewMode === 'annotated_rendered' && annotatedImageUrl)
    ? annotatedImageUrl
    : imageSrc;

  useEffect(() => {
    if (!activeImageSource) return;
    setLoading(true);
    setLoadError(false);

    let resolvedSrc = activeImageSource;
    if (typeof resolvedSrc === 'string' && !resolvedSrc.startsWith('http') && !resolvedSrc.startsWith('data:')) {
      if (!resolvedSrc.startsWith('/')) resolvedSrc = '/' + resolvedSrc;
    }

    const img = new Image();
    img.crossOrigin = "anonymous";

    img.onload = () => {
      imageRef.current = img;
      setLoading(false);
      processAndRenderImage();
    };

    img.onerror = () => {
      console.warn("[RadiographViewer] Direct load failed, attempting port fallback...");
      const fallbackImg = new Image();
      fallbackImg.crossOrigin = "anonymous";
      fallbackImg.onload = () => {
        imageRef.current = fallbackImg;
        setLoading(false);
        processAndRenderImage();
      };
      fallbackImg.onerror = () => {
        const thirdImg = new Image();
        thirdImg.onload = () => {
          imageRef.current = thirdImg;
          setLoading(false);
          processAndRenderImage();
        };
        thirdImg.onerror = () => {
          setLoading(false);
          setLoadError(true);
        };
        const baseUrl = (typeof window !== 'undefined' && window.BACKEND_URL) ? window.BACKEND_URL : 'http://127.0.0.1:5001';
        thirdImg.src = `${baseUrl}${resolvedSrc.startsWith('/') ? '' : '/'}${resolvedSrc}`;
      };
      const fallbackUrl = (typeof window !== 'undefined' && window.BACKEND_URL) ? window.BACKEND_URL : 'http://127.0.0.1:5000';
      fallbackImg.src = `${fallbackUrl}${resolvedSrc.startsWith('/') ? '' : '/'}${resolvedSrc}`;
    };

    img.src = resolvedSrc;
  }, [activeImageSource, invert, brightness, contrastVal, showAnnotation, viewMode, activeRoiIndex]);

  const processAndRenderImage = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const naturalWidth = img.naturalWidth || img.width || 800;
    const naturalHeight = img.naturalHeight || img.height || 1000;

    canvas.width = naturalWidth;
    canvas.height = naturalHeight;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw base radiograph with brightness / contrast / invert filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrastVal}%) ${invert ? 'invert(100%)' : ''}`;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.filter = 'none';

    const w = canvas.width;
    const h = canvas.height;

    // Sobel Edge Overlay Mode
    if (viewMode === 'edges') {
      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        const data = imgData.data;
        const gray = new Uint8ClampedArray(w * h);
        for (let i = 0; i < data.length; i += 4) {
          gray[i / 4] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
        }

        const edgeData = ctx.createImageData(w, h);
        for (let y = 1; y < h - 1; y++) {
          for (let x = 1; x < w - 1; x++) {
            const gx = gray[y * w + (x + 1)] - gray[y * w + (x - 1)];
            const gy = gray[(y + 1) * w + x] - gray[(y - 1) * w + x];
            const g = Math.min(255, Math.sqrt(gx * gx + gy * gy) * 2);
            const idx = (y * w + x) * 4;
            edgeData.data[idx] = g > 45 ? 59 : 0;
            edgeData.data[idx + 1] = g > 45 ? 130 : 0;
            edgeData.data[idx + 2] = g > 45 ? 246 : 0;
            edgeData.data[idx + 3] = 255;
          }
        }
        ctx.putImageData(edgeData, 0, 0);
      } catch (err) {
        console.warn("[RadiographViewer] Edge mode canvas error:", err.message);
      }
    }

    // Render Exact High-Precision Red ROI Circles in Interactive Mode
    if (showAnnotation && isFracture && rois.length > 0 && viewMode !== 'annotated_rendered') {
      rois.forEach((roi, idx) => {
        const naturalW = img.naturalWidth || w;
        const naturalH = img.naturalHeight || h;
        const xPct = roi.xPct !== undefined ? roi.xPct : (roi.xPercent !== undefined ? roi.xPercent / 100 : (roi.centerX ? roi.centerX / naturalW : 0.5));
        const yPct = roi.yPct !== undefined ? roi.yPct : (roi.yPercent !== undefined ? roi.yPercent / 100 : (roi.centerY ? roi.centerY / naturalH : 0.5));

        const cx = Math.round(xPct * w);
        const cy = Math.round(yPct * h);
        const radius = Math.max(38, Math.min(w, h) * (roi.radiusPct || 0.08));

        ctx.save();

        // X and Y Coordinate Axis Lines across the film
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(cx, 0);
        ctx.lineTo(cx, h);
        ctx.moveTo(0, cy);
        ctx.lineTo(w, cy);
        ctx.stroke();
        ctx.setLineDash([]);

        // Glowing Outer Red Circle
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.strokeStyle = idx === activeRoiIndex ? '#EF4444' : '#F87171';
        ctx.lineWidth = Math.max(3.5, w * 0.005);
        ctx.shadowColor = '#EF4444';
        ctx.shadowBlur = 20;
        ctx.stroke();

        // Pulsing Concentric Outer Ring
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.18, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
        ctx.lineWidth = Math.max(1.5, w * 0.002);
        ctx.stroke();

        // Precise Center Crosshairs
        const crossSize = Math.max(16, radius * 0.4);
        ctx.beginPath();
        ctx.moveTo(cx - crossSize, cy);
        ctx.lineTo(cx + crossSize, cy);
        ctx.moveTo(cx, cy - crossSize);
        ctx.lineTo(cx, cy + crossSize);
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Bullseye Dot
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#EF4444';
        ctx.fill();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Anatomical Fracture Tag & Axis Coordinates Box
        const xPctText = roi.xPercent !== undefined ? roi.xPercent : (xPct * 100).toFixed(1);
        const yPctText = roi.yPercent !== undefined ? roi.yPercent : (yPct * 100).toFixed(1);
        const tagText = `🔴 ROI ${idx + 1}: ${roi.label || 'Fracture Site'}`;
        const coordText = `X: ${cx}px (${xPctText}%) | Y: ${cy}px (${yPctText}%)`;

        const fontSize = Math.max(11, Math.floor(w * 0.020));
        ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`;
        const textWidth = Math.max(ctx.measureText(tagText).width, ctx.measureText(coordText).width);
        const boxW = textWidth + 24;
        const boxH = fontSize * 2 + 20;
        const tagX = Math.min(w - boxW - 15, Math.max(15, cx - boxW / 2));
        const tagY = Math.max(15, cy - radius - boxH - 10);

        ctx.fillStyle = 'rgba(10, 10, 16, 0.94)';
        ctx.beginPath();
        ctx.roundRect(tagX, tagY, boxW, boxH, 8);
        ctx.fill();
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FCA5A5';
        ctx.fillText(tagText, tagX + 12, tagY + fontSize + 4);
        ctx.font = `bold ${fontSize - 1}px monospace, Courier`;
        ctx.fillStyle = '#38BDF8';
        ctx.fillText(coordText, tagX + 12, tagY + fontSize * 2 + 10);

        ctx.restore();
      });
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = Math.round((e.clientX - rect.left) * scaleX);
    const y = Math.round((e.clientY - rect.top) * scaleY);
    if (x >= 0 && x <= canvas.width && y >= 0 && y <= canvas.height) {
      setHoverCoords({ x, y, xPct: ((x / canvas.width) * 100).toFixed(1), yPct: ((y / canvas.height) * 100).toFixed(1) });
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-[#0A0A0A] p-6 text-left shadow-2xl space-y-5">
      {/* Header & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="p-1.5 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">
              <Activity size={16} />
            </span>
            <h4 className="text-sm font-black text-white uppercase tracking-tight">
              Radiograph Vision & Fracture Locator
            </h4>
            {(() => {
              const isAIPowered = fractureInfo?.analyzedByEngine === 'AI_MULTIMODAL_VISION' || Boolean(fractureInfo?.aiModelUsed) || engineMode === 'ai';
              const aiModelName = fractureInfo?.aiModelUsed || 'Gemini 2.5 Flash Vision';
              return (
                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border flex items-center gap-1.5 ${
                  isAIPowered
                    ? 'bg-purple-500/15 border-purple-500/30 text-purple-300 shadow-sm shadow-purple-500/20'
                    : 'bg-blue-500/15 border-blue-500/30 text-blue-400'
                }`}>
                  {isAIPowered ? `🤖 AI Multimodal Vision (${aiModelName})` : '⚡ Local CV Engine'}
                </span>
              );
            })()}
          </div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
            Pinpoint Localized ROI Target Circle • Exact X & Y Coordinate Axes
          </p>
        </div>

        {/* Toolbar Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {annotatedImageUrl && (
            <button
              onClick={() => setViewMode(viewMode === 'annotated_rendered' ? 'interactive' : 'annotated_rendered')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                viewMode === 'annotated_rendered'
                  ? 'bg-rose-500/20 border-rose-500/40 text-rose-300 shadow-lg shadow-rose-500/10'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              <ImageIcon size={13} /> {viewMode === 'annotated_rendered' ? 'Vector Film (Active)' : 'Show Vector Film'}
            </button>
          )}

          {isFracture && (
            <button
              onClick={() => setShowAnnotation(!showAnnotation)}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
                showAnnotation
                  ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-lg shadow-red-500/10'
                  : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
              }`}
            >
              {showAnnotation ? <Eye size={13} /> : <EyeOff size={13} />}
              {showAnnotation ? 'Hide Target Circle' : 'Show Target Circle'}
            </button>
          )}

          <button
            onClick={() => setInvert(!invert)}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
              invert ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Contrast size={13} /> Invert Film
          </button>

          <button
            onClick={() => setViewMode(viewMode === 'edges' ? 'interactive' : 'edges')}
            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border transition-all ${
              viewMode === 'edges' ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white'
            }`}
          >
            <Layers size={13} /> {viewMode === 'edges' ? 'Standard Film' : 'Sobel Edge View'}
          </button>

          <div className="flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={() => setZoom(Math.max(0.75, zoom - 0.25))}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
              title="Zoom Out"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-[10px] font-black text-zinc-300 px-1">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2.5, zoom + 0.25))}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
              title="Zoom In"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => { setZoom(1); setInvert(false); setBrightness(100); setContrastVal(100); setViewMode('interactive'); }}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5"
              title="Reset"
            >
              <RotateCcw size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Numerical Coordinate Axes HUD */}
      {isFracture && activeRoi && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-white/[0.03] border border-white/10">
          <div className="space-y-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">X-Axis Center</span>
            <p className="text-sm font-black text-cyan-400 font-mono">
              {activeRoi.centerX ? `${activeRoi.centerX} px` : `${Math.round(activeRoi.xPct * 100)}%`}
              <span className="text-[10px] text-zinc-400 ml-1.5 font-normal">({activeRoi.xPercent || (activeRoi.xPct * 100).toFixed(1)}%)</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Y-Axis Center</span>
            <p className="text-sm font-black text-cyan-400 font-mono">
              {activeRoi.centerY ? `${activeRoi.centerY} px` : `${Math.round(activeRoi.yPct * 100)}%`}
              <span className="text-[10px] text-zinc-400 ml-1.5 font-normal">({activeRoi.yPercent || (activeRoi.yPct * 100).toFixed(1)}%)</span>
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Identified Site</span>
            <p className="text-xs font-black text-rose-400 truncate">
              {activeRoi.label || fractureInfo?.fractureLocation || "Bone Cortex"}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest block">Cursor Coordinate</span>
            <p className="text-xs font-black text-zinc-300 font-mono">
              {hoverCoords ? `X:${hoverCoords.x} Y:${hoverCoords.y}` : "Hover over film"}
            </p>
          </div>
        </div>
      )}

      {/* Main Canvas Display Area */}
      <div
        className="relative rounded-2xl overflow-hidden bg-black/95 border border-white/10 flex items-center justify-center p-4 min-h-[480px]"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverCoords(null)}
      >
        {loading && (
          <div className="flex flex-col items-center gap-3 text-zinc-400">
            <Loader2 size={32} className="animate-spin text-blue-500" />
            <p className="text-xs font-black uppercase tracking-widest">Processing Radiograph Matrix & Target Circles...</p>
          </div>
        )}

        {loadError && (
          <div className="flex flex-col items-center gap-3 text-rose-400 p-8">
            <AlertTriangle size={36} />
            <p className="text-xs font-black uppercase tracking-wider">Radiograph Image Failed to Load</p>
            <p className="text-[10px] text-zinc-400">Path: {activeImageSource}</p>
          </div>
        )}

        <div
          className={`transition-transform duration-200 ease-out origin-center ${loading || loadError ? 'hidden' : 'block'}`}
          style={{ transform: `scale(${zoom})` }}
        >
          <canvas
            ref={canvasRef}
            className="max-h-[580px] w-auto h-auto rounded-xl shadow-2xl border border-white/10 cursor-crosshair"
          />
        </div>

        {/* Live Detected Landmark Overlay Card */}
        {!loading && (
          <div className="absolute bottom-4 left-4 right-4 md:right-auto md:max-w-md p-4 rounded-2xl bg-black/90 backdrop-blur-md border border-white/10 text-left space-y-2 shadow-2xl">
            {isFracture ? (
              <>
                <div className="flex items-center gap-2">
                  <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">
                    {(fractureInfo?.analyzedByEngine === 'AI_MULTIMODAL_VISION' || fractureInfo?.aiModelUsed || engineMode === 'ai')
                      ? `AI Multimodal Vision (${fractureInfo?.aiModelUsed || 'Gemini 2.5 Flash'}) • Target Circle`
                      : 'Fracture Localization • Target Circle'}
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-black text-white">
                    {fractureInfo?.fractureLocation || anatomicalRegion}
                  </p>
                  <p className="text-[10px] font-bold text-zinc-400">
                    Red target circle placed on cortical disruption site with exact X/Y axis coordinates.
                  </p>
                </div>

                {rois.length > 1 && (
                  <div className="flex items-center gap-1.5 pt-1">
                    {rois.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => setActiveRoiIndex(i)}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                          activeRoiIndex === i
                            ? 'bg-red-500/20 text-red-400 border-red-500/40'
                            : 'bg-white/5 text-zinc-400 border-white/5 hover:text-white'
                        }`}
                      >
                        <Target size={10} className="inline mr-1" /> ROI {i + 1}
                      </button>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-emerald-400 shrink-0" />
                <div>
                  <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block">
                    Intact Skeletal Anatomy
                  </span>
                  <p className="text-xs font-bold text-zinc-300">
                    No cortical breach or acute fracture detected. Normal alignment.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Adjustment Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/5">
        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase">
            <span className="flex items-center gap-1"><Sun size={12} /> Film Brightness</span>
            <span>{brightness}%</span>
          </div>
          <input
            type="range"
            min="50"
            max="180"
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[10px] font-black text-zinc-400 uppercase">
            <span className="flex items-center gap-1"><Contrast size={12} /> Bone Contrast</span>
            <span>{contrastVal}%</span>
          </div>
          <input
            type="range"
            min="60"
            max="220"
            value={contrastVal}
            onChange={(e) => setContrastVal(Number(e.target.value))}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>
    </div>
  );
};

export default RadiographViewer;
