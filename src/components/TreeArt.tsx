// Shows the tree's photo, or a potted-sapling illustration when no photo exists.
// The illustration is inline SVG, so it costs no image download (NFR-2.3).
type Props = { shape: string; color: string; name: string; imageUrl?: string | null; className?: string; animate?: boolean };

function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const c = (v: number) => Math.max(0, Math.min(255, v + amt));
  return `rgb(${c(n >> 16)}, ${c((n >> 8) & 255)}, ${c(n & 255)})`;
}

export function TreeArt({ shape, color, name, imageUrl, className = "", animate = true }: Props) {
  if (imageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={imageUrl} alt={`${name} photo`} loading="lazy" decoding="async" className={`lift-img h-full w-full object-cover ${className}`} />;
  }
  const dark = shade(color, -35);
  const light = shade(color, 45);
  const stem = "#6d4c3d";
  const sway = animate ? "anim-sway" : "";
  return (
    <svg viewBox="0 0 120 120" role="img" aria-label={`${name} illustration`} className={`lift-img h-full w-full ${className}`}>
      <ellipse cx="60" cy="112" rx="26" ry="3.5" fill="#000" opacity="0.08" />
      <g className={sway}>
        {shape === "palm" && (
          <g>
            <path d="M60 92 C59 76 61 62 60 48" stroke={stem} strokeWidth="3" fill="none" strokeLinecap="round" />
            {[-75, -45, -15, 15, 45, 75, 180, 205, 155].map((a, i) => (
              <path key={a} d="M60 48 q14 -10 30 2" transform={`rotate(${a} 60 48)`} stroke={i % 2 ? color : dark} strokeWidth="4.5" fill="none" strokeLinecap="round" />
            ))}
          </g>
        )}
        {shape === "tall" && (
          <g>
            <path d="M60 92 L60 60" stroke={stem} strokeWidth="3.5" strokeLinecap="round" />
            <ellipse cx="60" cy="46" rx="17" ry="30" fill={dark} />
            <ellipse cx="57" cy="43" rx="14" ry="26" fill={color} />
            <ellipse cx="52" cy="34" rx="5" ry="10" fill={light} opacity="0.55" />
          </g>
        )}
        {shape === "spreading" && (
          <g>
            <path d="M60 92 L60 58 M60 70 L48 56 M60 66 L73 54" stroke={stem} strokeWidth="3" fill="none" strokeLinecap="round" />
            <ellipse cx="60" cy="48" rx="40" ry="15" fill={dark} />
            <ellipse cx="58" cy="44" rx="34" ry="12" fill={color} />
            <ellipse cx="46" cy="40" rx="10" ry="4" fill={light} opacity="0.55" />
          </g>
        )}
        {shape === "shrub" && (
          <g>
            <circle cx="46" cy="70" r="15" fill={dark} />
            <circle cx="74" cy="70" r="15" fill={dark} />
            <circle cx="60" cy="56" r="19" fill={color} />
            <circle cx="47" cy="66" r="12" fill={color} />
            <circle cx="73" cy="66" r="12" fill={color} />
            <circle cx="53" cy="50" r="6" fill={light} opacity="0.55" />
          </g>
        )}
        {shape === "columnar" && (
          <g>
            {[44, 52, 60, 68, 76].map((x, i) => (
              <g key={x}>
                <path d={`M${x} 92 C${x - 2} 66 ${x + 3} 40 ${x + (i - 2) * 4} 16`} stroke={i % 2 ? color : dark} strokeWidth="3.5" fill="none" strokeLinecap="round" />
                <path d={`M${x + (i - 2) * 2} 40 l8 -5`} stroke={light} strokeWidth="2.5" strokeLinecap="round" />
              </g>
            ))}
          </g>
        )}
        {(shape === "round" || !["palm", "tall", "spreading", "shrub", "columnar"].includes(shape)) && (
          <g>
            <path d="M60 92 L60 62" stroke={stem} strokeWidth="3.5" strokeLinecap="round" />
            <circle cx="60" cy="46" r="26" fill={dark} />
            <circle cx="57" cy="43" r="23" fill={color} />
            <circle cx="49" cy="36" r="8" fill={light} opacity="0.55" />
          </g>
        )}
      </g>
      {/* nursery pot */}
      <path d="M40 90 H80 L76 112 H44 Z" fill="#c9714a" />
      <path d="M38 86 H82 V93 H38 Z" rx="2" fill="#d98760" />
      <path d="M44 96 H76" stroke="#b5603b" strokeWidth="1.5" opacity="0.5" />
    </svg>
  );
}
