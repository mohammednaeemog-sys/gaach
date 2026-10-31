// Hand-drawn SVG decorations for festival sale banners. Each one is a small inline
// drawing with its own gentle animation (swing, flicker, twinkle, float). No image files.
import type { Motif } from "@/lib/festivals";

type P = { className?: string; style?: React.CSSProperties };
const box = (vb: string, cls: string, children: React.ReactNode, style?: React.CSSProperties) => (
  <svg viewBox={vb} className={cls} style={style} aria-hidden>{children}</svg>
);

function Lantern({ className = "", style }: P) {
  return box("0 0 60 160", `fx-swing ${className}`, (
    <>
      <line x1="30" y1="0" x2="30" y2="46" stroke="#d4a537" strokeWidth="1.6" />
      <circle cx="30" cy="48" r="3.5" fill="none" stroke="#d4a537" strokeWidth="2" />
      <path d="M18 62 Q30 46 42 62 Z" fill="#e2b64c" />
      <rect x="15" y="61" width="30" height="5" rx="1.5" fill="#c9962e" />
      <path d="M17 66 H43 L46 104 Q30 118 14 104 Z" fill="#e9c46a" />
      <path d="M21 70 H39 L41 101 Q30 110 19 101 Z" className="fx-glow" fill="#ffcf5a" />
      <path d="M21 70 H39 L41 101 Q30 110 19 101 Z" fill="none" stroke="#a87a1e" strokeWidth="1.2" />
      <path d="M30 70 V108 M21 86 H39" stroke="#a87a1e" strokeWidth="1.2" />
      <path d="M24 74 Q30 82 36 74 M23 94 Q30 100 37 94" stroke="#8a5cc2" strokeWidth="2" fill="none" />
      <rect x="14" y="104" width="32" height="5" rx="2" fill="#c9962e" />
      <path d="M22 109 L30 124 L38 109 Z" fill="#e2b64c" />
      <circle cx="30" cy="128" r="3" fill="#e2b64c" />
    </>
  ), style);
}

function Crescent({ className = "", style }: P) {
  return box("0 0 100 100", `fx-float ${className}`, (
    <>
      <path d="M62 8 A42 42 0 1 0 62 92 A34 34 0 1 1 62 8 Z" fill="#f2d16b" />
      <path d="M62 8 A42 42 0 1 0 62 92 A34 34 0 1 1 62 8 Z" fill="none" stroke="#c99a2e" strokeWidth="1.5" />
      <path className="fx-twinkle" d="M78 30 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" fill="#fff3c4" />
    </>
  ), style);
}

function Star({ x, y, r, d = 0, color = "#fff3c4" }: { x: number; y: number; r: number; d?: number; color?: string }) {
  return <path className="fx-twinkle" style={{ animationDelay: `${d}s`, transformOrigin: `${x}px ${y}px` }} d={`M${x} ${y - r} Q${x} ${y} ${x + r} ${y} Q${x} ${y} ${x} ${y + r} Q${x} ${y} ${x - r} ${y} Q${x} ${y} ${x} ${y - r}Z`} fill={color} />;
}
function Stars({ className = "", style }: P) {
  return box("0 0 100 100", className, (
    <>
      <Star x={20} y={22} r={9} />
      <Star x={70} y={14} r={6} d={0.6} />
      <Star x={52} y={52} r={11} d={1.1} />
      <Star x={16} y={74} r={6} d={1.6} />
      <Star x={84} y={70} r={8} d={0.3} />
    </>
  ), style);
}

function Arch({ className = "", style }: P) {
  return box("0 0 100 140", `fx-float-slow ${className}`, (
    <>
      <path d="M10 140 V70 Q10 40 50 18 Q90 40 90 70 V140" fill="none" stroke="#e9c46a" strokeWidth="4" />
      <path d="M20 140 V72 Q20 48 50 30 Q80 48 80 72 V140" fill="#ffffff" opacity="0.08" stroke="#e9c46a" strokeWidth="1.5" />
      <path d="M50 18 V6" stroke="#e9c46a" strokeWidth="2.5" />
      <path d="M50 2 A4 4 0 1 0 54 6 A3 3 0 1 1 50 2" fill="#e9c46a" />
    </>
  ), style);
}

function Pumpkin({ className = "", style }: P) {
  return box("0 0 120 100", className, (
    <>
      <ellipse cx="60" cy="96" rx="44" ry="4" fill="#000" opacity="0.25" />
      <path d="M58 22 Q56 10 66 6 L68 10 Q62 14 63 22 Z" fill="#4c6b25" />
      <ellipse cx="38" cy="58" rx="24" ry="34" fill="#e8650f" />
      <ellipse cx="82" cy="58" rx="24" ry="34" fill="#e8650f" />
      <ellipse cx="60" cy="58" rx="26" ry="37" fill="#ff8a1e" />
      <ellipse cx="60" cy="58" rx="12" ry="36" fill="#ff9a35" opacity="0.6" />
      <g className="fx-flicker">
        <path d="M40 48 L50 38 L54 52 Z" fill="#ffe066" />
        <path d="M80 48 L70 38 L66 52 Z" fill="#ffe066" />
        <path d="M56 58 L60 52 L64 58 Z" fill="#ffe066" />
        <path d="M36 66 Q60 88 84 66 L78 70 L72 66 L66 72 L60 66 L54 72 L48 66 L42 70 Z" fill="#ffe066" />
      </g>
    </>
  ), style);
}

function Bat({ className = "", style }: P) {
  return box("0 0 120 60", `fx-fly ${className}`, (
    <path d="M60 22 Q56 12 52 18 Q44 6 30 10 Q36 14 34 20 Q20 14 4 22 Q18 26 22 36 Q30 30 38 36 Q46 30 54 38 Q58 30 60 34 Q62 30 66 38 Q74 30 82 36 Q90 30 98 36 Q102 26 116 22 Q100 14 86 20 Q84 14 90 10 Q76 6 68 18 Q64 12 60 22Z" fill="#1c1410" />
  ), style);
}

function Spider({ className = "", style }: P) {
  return box("0 0 60 140", `fx-bob ${className}`, (
    <>
      <line x1="30" y1="0" x2="30" y2="96" stroke="#e8e0d0" strokeWidth="0.8" opacity="0.7" />
      <g stroke="#1c1410" strokeWidth="2.2" fill="none" strokeLinecap="round">
        <path d="M24 104 Q12 96 6 102 M24 108 Q10 108 4 116 M26 112 Q14 118 10 128 M28 114 Q22 124 20 134" />
        <path d="M36 104 Q48 96 54 102 M36 108 Q50 108 56 116 M34 112 Q46 118 50 128 M32 114 Q38 124 40 134" />
      </g>
      <ellipse cx="30" cy="110" rx="9" ry="11" fill="#1c1410" />
      <circle cx="30" cy="98" r="6" fill="#1c1410" />
      <circle cx="27.5" cy="97" r="1.5" fill="#ff7b00" />
      <circle cx="32.5" cy="97" r="1.5" fill="#ff7b00" />
    </>
  ), style);
}

function Diya({ className = "", style }: P) {
  return box("0 0 100 90", className, (
    <>
      <ellipse cx="50" cy="40" rx="26" ry="30" className="fx-glow" fill="#ffb703" opacity="0.28" />
      <path className="fx-flame" d="M50 14 Q60 34 50 46 Q40 34 50 14Z" fill="#ffd166" />
      <path className="fx-flame" d="M50 26 Q55 37 50 44 Q45 37 50 26Z" fill="#fff6d5" />
      <path d="M10 50 Q50 46 90 50 Q86 78 50 80 Q14 78 10 50Z" fill="#b5472b" />
      <path d="M10 50 Q50 46 90 50 Q50 58 10 50Z" fill="#7a2a17" />
      <path d="M20 62 Q50 70 80 62" stroke="#f2c14e" strokeWidth="2.5" fill="none" />
      <circle cx="30" cy="66" r="2" fill="#f2c14e" /><circle cx="50" cy="70" r="2" fill="#f2c14e" /><circle cx="70" cy="66" r="2" fill="#f2c14e" />
      <path d="M90 50 Q100 46 98 40 Q94 46 88 46" fill="#b5472b" />
    </>
  ), style);
}

function Marigold({ className = "", style }: P) {
  const flower = (x: number, y: number, r: number, c1: string, c2: string, k: number) => (
    <g key={k} className="fx-spin-slow" style={{ transformOrigin: `${x}px ${y}px`, animationDelay: `${-k}s` }}>
      {Array.from({ length: 12 }).map((_, i) => <ellipse key={i} cx={x} cy={y - r * 0.55} rx={r * 0.28} ry={r * 0.5} fill={i % 2 ? c1 : c2} transform={`rotate(${i * 30} ${x} ${y})`} />)}
      <circle cx={x} cy={y} r={r * 0.32} fill="#c75000" />
    </g>
  );
  return box("0 0 100 160", `fx-swing-slow ${className}`, (
    <>
      <line x1="50" y1="0" x2="50" y2="150" stroke="#2f6b3f" strokeWidth="1.5" />
      {[16, 44, 72, 100, 128].map((y, i) => flower(50, y, 14, i % 2 ? "#ff9f1c" : "#ffbf1f", "#f77f00", i))}
      <path d="M50 150 l-6 10 M50 150 l6 10" stroke="#2f6b3f" strokeWidth="1.5" />
    </>
  ), style);
}

function Alpona({ className = "", style }: P) {
  return box("0 0 100 100", `fx-spin-slow ${className}`, (
    <g fill="none" stroke="#fff" strokeWidth="2">
      <circle cx="50" cy="50" r="46" stroke="#d62828" strokeWidth="3" />
      <circle cx="50" cy="50" r="40" strokeDasharray="2 4" stroke="#d62828" />
      {Array.from({ length: 12 }).map((_, i) => <path key={i} d="M50 50 Q44 30 50 14 Q56 30 50 50" fill="#d62828" stroke="#fff" strokeWidth="1" transform={`rotate(${i * 30} 50 50)`} />)}
      <circle cx="50" cy="50" r="12" fill="#f4a300" stroke="#fff" />
      <circle cx="50" cy="50" r="5" fill="#fff" stroke="none" />
    </g>
  ), style);
}

function Snow({ className = "", style }: P) {
  return box("0 0 100 100", `fx-spin-slow ${className}`, (
    <g stroke="#ffffff" strokeWidth="4" strokeLinecap="round" fill="none">
      {[0, 60, 120].map((a) => (
        <g key={a} transform={`rotate(${a} 50 50)`}>
          <path d="M50 8 V92" />
          <path d="M50 22 L40 12 M50 22 L60 12 M50 78 L40 88 M50 78 L60 88" />
        </g>
      ))}
    </g>
  ), style);
}

function Ornament({ className = "", style }: P) {
  return box("0 0 60 150", `fx-swing ${className}`, (
    <>
      <line x1="30" y1="0" x2="30" y2="84" stroke="#c8a24a" strokeWidth="1.4" />
      <rect x="24" y="82" width="12" height="8" rx="2" fill="#c8a24a" />
      <circle cx="30" cy="112" r="24" fill="#d6213f" />
      <path d="M8 104 Q30 112 52 104 M7 118 Q30 126 53 118" stroke="#ffd166" strokeWidth="3" fill="none" />
      <ellipse cx="21" cy="101" rx="5" ry="8" fill="#fff" opacity="0.45" transform="rotate(30 21 101)" />
    </>
  ), style);
}

function Pine({ className = "", style }: P) {
  const lights = [[50, 30, "#ffd166"], [40, 52, "#ff4d6d"], [60, 58, "#4cc9f0"], [34, 78, "#ffd166"], [66, 84, "#ff4d6d"], [50, 70, "#90ee90"], [28, 102, "#4cc9f0"], [72, 104, "#ffd166"], [48, 96, "#ff4d6d"]] as const;
  return box("0 0 100 140", className, (
    <>
      <rect x="44" y="118" width="12" height="18" fill="#6d4c3d" />
      <path d="M50 8 L80 54 H64 L88 88 H70 L96 122 H4 L30 88 H12 L36 54 H20 Z" fill="#1f7a3e" />
      <path d="M50 8 L80 54 H64 L88 88 H70 L96 122 H50 Z" fill="#17602f" />
      {lights.map(([x, y, c], i) => <circle key={i} className="fx-twinkle" style={{ animationDelay: `${i * 0.3}s`, transformOrigin: `${x}px ${y}px` }} cx={x} cy={y} r="3.5" fill={c} />)}
      <path className="fx-twinkle" d="M50 0 l3 7 7 1 -5 5 1 7 -6 -3 -6 3 1 -7 -5 -5 7 -1 Z" fill="#ffd166" style={{ transformOrigin: "50px 9px" }} />
    </>
  ), style);
}

function Candy({ className = "", style }: P) {
  return box("0 0 60 120", `fx-float ${className}`, (
    <>
      <defs><pattern id="cane" width="14" height="14" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="14" height="14" fill="#fff" /><rect width="7" height="14" fill="#d6213f" /></pattern></defs>
      <path d="M40 116 V40 Q40 14 24 14 Q10 14 10 30" fill="none" stroke="url(#cane)" strokeWidth="12" strokeLinecap="round" />
    </>
  ), style);
}

function Sun({ className = "", style }: P) {
  return box("0 0 100 100", className, (
    <>
      <g className="fx-spin-slow" style={{ transformOrigin: "50px 50px" }}>
        {Array.from({ length: 12 }).map((_, i) => <path key={i} d="M50 2 L54 18 H46 Z" fill="#fff3b0" transform={`rotate(${i * 30} 50 50)`} />)}
      </g>
      <circle cx="50" cy="50" r="26" fill="#ffe066" />
      <circle cx="50" cy="50" r="20" fill="#fff3b0" opacity="0.6" />
    </>
  ), style);
}

function Mango({ className = "", style }: P) {
  return box("0 0 100 100", `fx-swing-slow ${className}`, (
    <>
      <path d="M50 4 V20" stroke="#5a3b1e" strokeWidth="3" />
      <path d="M50 14 Q72 2 86 16 Q66 22 50 14Z" fill="#2f8f3f" />
      <path d="M50 20 Q82 20 82 56 Q82 94 48 94 Q20 92 22 62 Q24 36 50 20Z" fill="#ffb703" />
      <path d="M50 20 Q30 36 30 62 Q30 84 48 92 Q20 92 22 62 Q24 36 50 20Z" fill="#fb8500" opacity="0.5" />
      <ellipse cx="62" cy="44" rx="7" ry="12" fill="#fff" opacity="0.35" transform="rotate(-20 62 44)" />
    </>
  ), style);
}

function Cloud({ className = "", style }: P) {
  return box("0 0 120 70", `fx-drift ${className}`, (
    <path d="M24 62 Q4 62 6 46 Q8 32 24 34 Q26 14 46 14 Q62 14 68 28 Q76 20 88 24 Q100 28 100 40 Q116 40 116 52 Q116 62 102 62 Z" fill="#ffffff" opacity="0.92" />
  ), style);
}

function Umbrella({ className = "", style }: P) {
  return box("0 0 100 120", `fx-swing-slow ${className}`, (
    <>
      <path d="M8 50 Q50 -4 92 50 Q85 44 78 50 Q71 44 64 50 Q57 44 50 50 Q43 44 36 50 Q29 44 22 50 Q15 44 8 50Z" fill="#ffd166" />
      <path d="M50 4 Q36 24 36 50 Q43 44 50 50 Q57 44 64 50 Q64 24 50 4Z" fill="#ef476f" />
      <path d="M50 50 V104 Q50 114 40 112" stroke="#3a3a3a" strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </>
  ), style);
}

function Flag({ className = "", style }: P) {
  return box("0 0 120 130", className, (
    <>
      <rect x="10" y="4" width="4" height="126" rx="2" fill="#d9d9d9" />
      <g className="fx-wave" style={{ transformOrigin: "14px 30px" }}>
        <path d="M14 8 Q50 0 70 8 T114 8 V68 Q90 60 70 68 T14 68 Z" fill="#006a4e" />
        <circle cx="58" cy="38" r="17" fill="#f42a41" />
      </g>
    </>
  ), style);
}

function Minar({ className = "", style }: P) {
  return box("0 0 140 110", className, (
    <>
      <circle cx="70" cy="44" r="26" fill="#e63946" />
      <g fill="none" stroke="#ffffff" strokeWidth="4">
        <path d="M58 108 V30 Q58 16 70 12 Q82 16 82 30 V108" />
        <path d="M62 30 H78 M62 52 H78 M62 74 H78" strokeWidth="2" />
        <path d="M40 108 V46 H52 V108 M88 108 V46 H100 V108" />
        <path d="M22 108 V60 H32 V108 M108 108 V60 H118 V108" />
      </g>
      <rect x="10" y="104" width="120" height="6" fill="#ffffff" />
    </>
  ), style);
}

function Lotus({ className = "", style }: P) {
  return box("0 0 120 80", `fx-float-slow ${className}`, (
    <>
      <path d="M60 70 Q30 70 10 52 Q34 48 60 70Z" fill="#f7a1c4" />
      <path d="M60 70 Q90 70 110 52 Q86 48 60 70Z" fill="#f7a1c4" />
      <path d="M60 70 Q34 56 30 26 Q52 40 60 70Z" fill="#f48fb1" />
      <path d="M60 70 Q86 56 90 26 Q68 40 60 70Z" fill="#f48fb1" />
      <path d="M60 70 Q46 44 60 10 Q74 44 60 70Z" fill="#fce4ec" />
      <ellipse cx="60" cy="74" rx="44" ry="5" fill="#2e7d32" opacity="0.6" />
    </>
  ), style);
}

function Heart({ className = "", style }: P) {
  return box("0 0 100 90", `fx-pulse ${className}`, (
    <path d="M50 86 Q8 56 8 30 Q8 8 30 8 Q44 8 50 22 Q56 8 70 8 Q92 8 92 30 Q92 56 50 86Z" fill="#e63946" />
  ), style);
}

function Firework({ className = "", style }: P) {
  const colors = ["#ffd166", "#ef476f", "#06d6a0", "#4cc9f0"];
  return box("0 0 100 100", className, (
    <g className="fx-burst" style={{ transformOrigin: "50px 50px" }}>
      {Array.from({ length: 16 }).map((_, i) => (
        <g key={i} transform={`rotate(${i * 22.5} 50 50)`}>
          <line x1="50" y1="36" x2="50" y2="10" stroke={colors[i % 4]} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="50" cy="6" r="2.5" fill={colors[(i + 1) % 4]} />
        </g>
      ))}
    </g>
  ), style);
}

function Leaf({ className = "", style }: P) {
  return box("0 0 100 100", `fx-float ${className}`, (
    <>
      <path d="M12 88 C12 44 40 14 90 10 C88 58 58 88 12 88Z" fill="#7fb65a" />
      <path d="M14 86 L74 28" stroke="#4e7d33" strokeWidth="2.5" />
    </>
  ), style);
}

function Kite({ className = "", style }: P) {
  return box("0 0 100 140", `fx-swing-slow ${className}`, (
    <>
      <path d="M50 4 L88 46 L50 96 L12 46 Z" fill="#d62828" />
      <path d="M50 4 L88 46 L50 46 Z" fill="#f4a300" />
      <path d="M12 46 L50 96 L50 46 Z" fill="#f4a300" />
      <path d="M50 4 V96 M12 46 H88" stroke="#fff" strokeWidth="1.5" />
      <path d="M50 96 Q40 108 52 116 Q64 124 50 136" stroke="#d62828" strokeWidth="2" fill="none" />
      <path d="M44 110 l8 -4 -2 8Z M46 126 l8 -2 -4 8Z" fill="#f4a300" />
    </>
  ), style);
}

function Fish({ className = "", style }: P) {
  return box("0 0 140 60", `fx-swim ${className}`, (
    <>
      <path d="M10 30 Q40 2 92 14 Q110 20 116 30 Q110 40 92 46 Q40 58 10 30Z" fill="#cfd8dc" />
      <path d="M10 30 Q40 2 92 14 Q110 20 116 30 Q60 30 10 30Z" fill="#eceff1" />
      <path d="M116 30 L136 12 L132 30 L136 48 Z" fill="#b0bec5" />
      <circle cx="28" cy="27" r="3" fill="#263238" />
      <path d="M40 22 Q46 30 40 38" stroke="#90a4ae" strokeWidth="1.5" fill="none" />
    </>
  ), style);
}

function Trident({ className = "", style }: P) {
  return box("0 0 60 160", `fx-float-slow ${className}`, (
    <g fill="#d4a537">
      <rect x="27" y="40" width="6" height="118" rx="3" />
      <path d="M30 2 Q38 18 33 40 H27 Q22 18 30 2Z" />
      <path d="M4 14 Q4 40 27 44 V38 Q12 34 12 16Z" />
      <path d="M56 14 Q56 40 33 44 V38 Q48 34 48 16Z" />
      <rect x="20" y="58" width="20" height="5" rx="2" />
      <path d="M33 66 Q48 72 40 86" stroke="#e63946" strokeWidth="3" fill="none" />
    </g>
  ), style);
}

function Palash({ className = "", style }: P) {
  return box("0 0 100 100", `fx-swing-slow ${className}`, (
    <>
      <path d="M50 0 Q46 30 50 50" stroke="#5a3b1e" strokeWidth="2.5" fill="none" />
      {[[50, 50, 0], [38, 40, -40], [62, 40, 40], [44, 64, -15], [58, 66, 20]].map(([x, y, r], i) => (
        <path key={i} d={`M${x} ${y} q-4 -12 4 -20 q-2 14 12 18 q-10 6 -16 2z`} fill={i % 2 ? "#e63946" : "#ff5d3a"} transform={`rotate(${r} ${x} ${y})`} />
      ))}
    </>
  ), style);
}

function Gift({ className = "", style }: P) {
  return box("0 0 100 100", className, (
    <>
      <rect x="12" y="40" width="76" height="56" rx="3" fill="#d6213f" />
      <rect x="8" y="30" width="84" height="16" rx="3" fill="#e63950" />
      <rect x="44" y="30" width="12" height="66" fill="#ffd166" />
      <path d="M50 30 Q30 6 22 18 Q18 28 50 30 Q82 28 78 18 Q70 6 50 30Z" fill="#ffd166" />
    </>
  ), style);
}

function Confetti({ className = "", style }: P) {
  const c = ["#ffd166", "#ef476f", "#06d6a0", "#4cc9f0", "#ffffff"];
  return box("0 0 100 100", className, (
    <>{Array.from({ length: 14 }).map((_, i) => <rect key={i} className="fx-twinkle" style={{ animationDelay: `${i * 0.2}s`, transformOrigin: `${(i * 37) % 90 + 5}px ${(i * 53) % 90 + 5}px` }} x={(i * 37) % 90} y={(i * 53) % 90} width="6" height="10" rx="1" fill={c[i % 5]} transform={`rotate(${i * 40} ${(i * 37) % 90 + 3} ${(i * 53) % 90 + 5})`} />)}</>
  ), style);
}

export const MOTIFS: Record<Motif, (p: P) => React.ReactElement> = {
  lantern: Lantern, crescent: Crescent, stars: Stars, arch: Arch, bunting: Stars, pumpkin: Pumpkin, bat: Bat, spider: Spider,
  diya: Diya, marigold: Marigold, alpona: Alpona, snow: Snow, ornament: Ornament, pine: Pine, candy: Candy, sun: Sun,
  mango: Mango, cloud: Cloud, rain: Cloud, umbrella: Umbrella, flag: Flag, minar: Minar, lotus: Lotus, heart: Heart,
  firework: Firework, leaf: Leaf, kite: Kite, fish: Fish, trident: Trident, palash: Palash, confetti: Confetti, gift: Gift,
};

// Where each decoration sits: hanging from the top, standing on the bottom, or floating
export const PLACE: Record<Motif, "hang" | "ground" | "float"> = {
  lantern: "hang", ornament: "hang", spider: "hang", marigold: "hang",
  pumpkin: "ground", diya: "ground", pine: "ground", gift: "ground", minar: "ground", flag: "ground", lotus: "ground", trident: "ground",
  crescent: "float", stars: "float", arch: "ground", bunting: "float", bat: "float", alpona: "float", snow: "float", candy: "float",
  sun: "float", mango: "float", cloud: "float", rain: "float", umbrella: "ground", heart: "float", firework: "float", leaf: "float",
  kite: "float", fish: "float", palash: "hang", confetti: "float",
};

export function Bunting({ colors, className = "" }: { colors: string[]; className?: string }) {
  const n = 22;
  return (
    <svg viewBox="0 0 440 40" preserveAspectRatio="none" className={className} aria-hidden>
      <path d="M0 4 Q110 20 220 6 T440 4" fill="none" stroke="#3b2a1a" strokeWidth="1.2" />
      {Array.from({ length: n }).map((_, i) => {
        const x = (i / n) * 440 + 4;
        const y = 4 + Math.sin((i / n) * Math.PI * 2) * 5 + 4;
        return <path key={i} className="fx-flag" style={{ animationDelay: `${(i % 5) * 0.25}s`, transformOrigin: `${x + 8}px ${y}px` }} d={`M${x} ${y} H${x + 16} L${x + 8} ${y + 22} Z`} fill={colors[i % colors.length]} />;
      })}
    </svg>
  );
}

// Drifting snow, rain, petals, leaves, confetti, twinkling stars or rising embers
export function Fall({ kind, count = 18 }: { kind: string; count?: number }) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {Array.from({ length: count }).map((_, i) => {
        const left = (i * 37 + 7) % 100;
        const delay = -((i * 1.7) % 9);
        const dur = kind === "rain" ? 0.9 + (i % 4) * 0.2 : 6 + (i % 5) * 1.6;
        const size = 0.35 + (i % 4) * 0.15;
        const extra = kind === "stars" ? { top: `${(i * 23 + 5) % 90}%` } : {};
        return <span key={i} className={`fall fall-${kind}`} style={{ ...extra, left: `${left}%`, animationDelay: `${delay}s`, animationDuration: `${dur}s`, width: `${size}rem`, height: `${size}rem`, ["--c" as string]: ["#ffd166", "#ef476f", "#06d6a0", "#4cc9f0", "#ffffff"][i % 5] }} />;
      })}
    </div>
  );
}
