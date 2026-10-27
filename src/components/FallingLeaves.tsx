"use client";

import { useRef, useState } from "react";
import { usePathname } from "next/navigation";

// A few small leaves drifting down the page, slow and quiet. Tapping one makes it
// spin away with a little burst, then a fresh leaf starts falling from the top.
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

const SPARKS = [0, 72, 144, 216, 288];

export function FallingLeaves() {
  const path = usePathname() ?? "/";
  const [popping, setPopping] = useState<Record<number, boolean>>({});
  const [round, setRound] = useState<Record<number, number>>({});
  const timers = useRef<Record<number, ReturnType<typeof setTimeout>>>({});
  if (HIDDEN_ON.some((p) => path.startsWith(p))) return null;

  const pop = (i: number) => {
    if (popping[i]) return;
    setPopping((p) => ({ ...p, [i]: true }));
    clearTimeout(timers.current[i]);
    timers.current[i] = setTimeout(() => {
      setPopping((p) => ({ ...p, [i]: false }));
      setRound((r) => ({ ...r, [i]: (r[i] ?? 0) + 1 })); // remount: falls again from the top
    }, 950);
  };

  return (
    <div className="falling-leaves" aria-hidden="true">
      {LEAVES.map((l, i) => (
        <span
          key={`${i}-${round[i] ?? 0}`}
          className={`fall-leaf ${i % 2 ? "fall-leaf-sm-hide" : ""} ${popping[i] ? "is-popping" : ""}`}
          style={{ left: `${l.left}%`, animationDuration: `${l.dur}s`, animationDelay: `${round[i] ? 0 : l.delay}s`, ["--drift" as string]: `${l.drift}px` }}
          onPointerDown={() => pop(i)}
        >
          {popping[i] && SPARKS.map((a) => (
            <span key={a} className="leaf-spark" style={{ ["--a" as string]: `${a + i * 11}deg`, background: l.color }} />
          ))}
          <span className="fall-leaf-sway" style={{ animationDuration: `${(l.dur / 6).toFixed(1)}s`, animationDelay: `${l.delay / 3}s` }}>
            <svg className="fall-leaf-svg" viewBox="0 0 24 24" width={l.size} height={l.size} fill={l.color}>
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
