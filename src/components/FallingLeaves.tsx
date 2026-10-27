"use client";

import { usePathname } from "next/navigation";

// A few small leaves drifting down the page, slow and quiet. Pure CSS, no clicks blocked.
// Turned off for people who prefer less motion, and on admin, checkout and payment pages.
const LEAVES = [
  { left: 6, size: 18, dur: 26, delay: -3, drift: 60, color: "#7cc68f", shape: 0 },
  { left: 19, size: 14, dur: 32, delay: -18, drift: -40, color: "#a3d977", shape: 1 },
  { left: 34, size: 20, dur: 29, delay: -9, drift: 70, color: "#5fb57a", shape: 0 },
  { left: 52, size: 15, dur: 35, delay: -25, drift: -55, color: "#b8e08f", shape: 1 },
  { left: 67, size: 19, dur: 27, delay: -14, drift: 50, color: "#6cbf84", shape: 0 },
  { left: 81, size: 13, dur: 33, delay: -6, drift: -35, color: "#9ad48a", shape: 1 },
  { left: 93, size: 17, dur: 30, delay: -21, drift: 45, color: "#83cc95", shape: 0 },
];
const HIDDEN_ON = ["/admin", "/checkout", "/pay"];

export function FallingLeaves() {
  const path = usePathname() ?? "/";
  if (HIDDEN_ON.some((p) => path.startsWith(p))) return null;
  return (
    <div className="falling-leaves" aria-hidden="true">
      {LEAVES.map((l, i) => (
        <span
          key={i}
          className={`fall-leaf ${i % 2 ? "fall-leaf-sm-hide" : ""}`}
          style={{ left: `${l.left}%`, animationDuration: `${l.dur}s`, animationDelay: `${l.delay}s`, ["--drift" as string]: `${l.drift}px` }}
        >
          <span className="fall-leaf-sway" style={{ animationDuration: `${(l.dur / 6).toFixed(1)}s`, animationDelay: `${l.delay / 3}s` }}>
            <svg viewBox="0 0 24 24" width={l.size} height={l.size} fill={l.color}>
              {l.shape === 0 ? (
                <path d="M4 20 C 4 10, 10 4, 20 4 C 20 14, 14 20, 4 20Z M5.5 18.5 L 15 9" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="0.9" />
              ) : (
                <path d="M12 2 C 18 7, 18 15, 12 22 C 6 15, 6 7, 12 2Z M12 4 V 20" stroke="#ffffff" strokeOpacity="0.45" strokeWidth="0.9" />
              )}
            </svg>
          </span>
        </span>
      ))}
    </div>
  );
}
