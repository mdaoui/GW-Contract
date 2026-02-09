import React, { useEffect, useRef, useState } from "react";
import SignaturePadLib from "signature_pad";

export default function SignaturePad({ onChange, apiRef }) {
  const canvasRef = useRef(null);
  const padRef = useRef(null);
  const [hasInk, setHasInk] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const pad = new SignaturePadLib(canvas);
    padRef.current = pad;

    const resize = () => {
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(ratio, ratio);
      pad.clear();
      setHasInk(false);
      onChange?.(null);
    };

    resize();
    window.addEventListener("resize", resize);

    pad.onEnd = () => {
      const empty = pad.isEmpty();
      setHasInk(!empty);
      onChange?.(empty ? null : pad.toDataURL("image/png"));
    };

    if (apiRef) {
      apiRef.current = {
        getDataUrl: () => (pad.isEmpty() ? null : pad.toDataURL("image/png")),
        clear: () => pad.clear(),
        isEmpty: () => pad.isEmpty(),
      };
    }

    return () => {
      window.removeEventListener("resize", resize);
      if (typeof pad.off === "function") pad.off();
      if (apiRef) apiRef.current = null;
    };
  }, [onChange, apiRef]);

  const clear = () => {
    const pad = padRef.current;
    pad.clear();
    setHasInk(false);
    onChange?.(null);
  };

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div
        style={{
          border: "1px solid #ccc",
          borderRadius: 8,
          height: 160,
          overflow: "hidden",
          background: "#fff",
        }}
      >
        <canvas
          ref={canvasRef}
          style={{ width: "100%", height: "100%", display: "block" }}
        />
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <button type="button" onClick={clear}>
          Clear
        </button>
        <span style={{ fontSize: 12, color: "#94a3b8" }}>
          {hasInk ? "Signature captured" : "Draw your signature above"}
        </span>
      </div>
    </div>
  );
}
