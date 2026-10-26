"use client";

import { useEffect, useState } from "react";

// Whole-page zoom steps; 1.12 is the default reading size.
const STEPS = [1, 1.12, 1.25, 1.4, 1.6];
const DEFAULT = 1; // index of 1.12
const KEY = "cockpit-text-zoom";

function apply(i: number) {
  document.documentElement.style.setProperty("--text-zoom", String(STEPS[i]));
  try {
    localStorage.setItem(KEY, String(STEPS[i]));
  } catch {}
}

export function TextSize() {
  const [i, setI] = useState(DEFAULT);

  useEffect(() => {
    try {
      const saved = Number(localStorage.getItem(KEY));
      const found = STEPS.indexOf(saved);
      if (found >= 0) setI(found);
    } catch {}
  }, []);

  const step = (d: number) => {
    const next = Math.min(STEPS.length - 1, Math.max(0, i + d));
    setI(next);
    apply(next);
  };

  return (
    <div className="text-size" role="group" aria-label="Text size">
      <button className="lock-btn" onClick={() => step(-1)} disabled={i === 0} aria-label="Smaller text">
        A−
      </button>
      <button className="lock-btn" onClick={() => step(1)} disabled={i === STEPS.length - 1} aria-label="Larger text">
        A+
      </button>
    </div>
  );
}
