import React, { useState, useRef } from "react";
import { ZoomIn, Crosshair, Sparkles } from "lucide-react";

export default function DermatoscopeLens({ imageUrl, alt = "Skin Lesion" }) {
  const [lensActive, setLensActive] = useState(false);
  const [lensPos, setLensPos] = useState({ x: 0, y: 0, bgX: 0, bgY: 0 });
  const imgRef = useRef(null);

  const ZOOM = 2.5;
  const LENS_SIZE = 150; // px diameter

  const handleMouseMove = (e) => {
    if (!imgRef.current) return;
    const rect = imgRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x < 0 || x > rect.width || y < 0 || y > rect.height) {
      setLensActive(false);
      return;
    }

    const bgX = (x / rect.width) * 100;
    const bgY = (y / rect.height) * 100;

    setLensPos({
      x,
      y,
      bgX,
      bgY
    });
    setLensActive(true);
  };

  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-black/5 select-none cursor-crosshair group shadow-inner"
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setLensActive(false)}
    >
      <img
        ref={imgRef}
        src={imageUrl}
        alt={alt}
        className="w-full h-full object-contain max-h-96 mx-auto rounded-xl"
      />

      {/* Floating Instructions badge */}
      <div className="absolute top-2 left-2 bg-slate-900/80 backdrop-blur-md text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center space-x-1 pointer-events-none opacity-80 group-hover:opacity-100 transition-opacity">
        <Crosshair className="w-3 h-3 text-sky-400" />
        <span>Dermatoscope 2.5x Loupe (Hover to Magnify)</span>
      </div>

      {/* Circular Magnifying Lens */}
      {lensActive && (
        <div
          style={{
            width: `${LENS_SIZE}px`,
            height: `${LENS_SIZE}px`,
            left: `${lensPos.x - LENS_SIZE / 2}px`,
            top: `${lensPos.y - LENS_SIZE / 2}px`,
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: `${ZOOM * 100}%`,
            backgroundPosition: `${lensPos.bgX}% ${lensPos.bgY}%`,
          }}
          className="absolute pointer-events-none rounded-full border-4 border-sky-400/90 shadow-2xl overflow-hidden z-30 ring-4 ring-black/40"
        >
          {/* Millimeter Reticle Crosshairs */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-full h-[1px] bg-sky-400/60" />
            <div className="h-full w-[1px] bg-sky-400/60 absolute" />
            {/* Center target circle */}
            <div className="w-8 h-8 rounded-full border border-sky-400/80 absolute" />
            <span className="absolute bottom-1 right-3 text-[9px] font-mono text-sky-200 font-bold bg-black/60 px-1 rounded">
              1mm
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

