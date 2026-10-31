import Link from "next/link";
import { festival, type Motif } from "@/lib/festivals";
import { Bunting, Fall, MOTIFS, PLACE } from "./Motifs";
import { bold, script, spooky } from "./fonts";

export type BannerSaleData = {
  name: string; badge: string; percentOff: number; message: string; theme: string;
  startsAt?: string | null; endsAt?: string | null; imageUrl?: string | null; imageOnly?: boolean; allTrees?: boolean;
};

const fmt = (d: string) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "Asia/Dhaka" });

const SLOTS = {
  hang: [{ top: "0", x: "6%", h: "64%" }, { top: "0", x: "44%", h: "48%" }, { top: "0", x: "72%", h: "40%" }],
  ground: [{ bottom: "3%", x: "3%", h: "58%" }, { bottom: "3%", x: "40%", h: "44%" }, { bottom: "3%", x: "64%", h: "36%" }],
  float: [{ top: "14%", x: "46%", h: "32%" }, { top: "38%", x: "8%", h: "26%" }, { top: "10%", x: "72%", h: "24%" }],
} as const;

function Side({ motifs, side }: { motifs: Motif[]; side: "left" | "right" }) {
  const used = { hang: 0, ground: 0, float: 0 };
  return (
    <div className={`fest-side pointer-events-none absolute inset-y-0 ${side}-0 w-[30%]`} aria-hidden>
      {motifs.map((m, i) => {
        const place = PLACE[m];
        const slot = SLOTS[place][used[place]++ % 3] as { top?: string; bottom?: string; x: string; h: string };
        const Cmp = MOTIFS[m];
        return (
          <div key={i} className="fest-pop absolute" style={{ top: slot.top, bottom: slot.bottom, [side]: slot.x, height: `calc(${slot.h} * var(--fs, 1))`, animationDelay: `${0.15 + i * 0.15}s` }}>
            <Cmp className="h-full w-auto drop-shadow-[0_6px_10px_rgb(0_0_0/0.25)]" style={side === "right" && (m === "fish" || m === "bat") ? { transform: "scaleX(-1)" } : undefined} />
          </div>
        );
      })}
    </div>
  );
}

// Big decorated sale banner, drawn for the festival the admin picked (or the admin's own image)
export function FestivalBanner({ sale, preview = false }: { sale: BannerSaleData; preview?: boolean }) {
  const f = festival(sale.theme);
  const href = "/trees?sale=1";
  const when = sale.endsAt ? (sale.startsAt ? `${fmt(sale.startsAt)} – ${fmt(sale.endsAt)}` : `Until ${fmt(sale.endsAt)}`) : "Limited time only";
  const font = f.font === "spooky" ? spooky.className : f.font === "script" ? script.className : f.font === "bold" ? bold.className : "font-display";
  const wrap = (children: React.ReactNode) => (preview ? <div>{children}</div> : <Link href={href} aria-label={`${sale.name}: ${sale.percentOff}% off. Shop the sale`} className="block">{children}</Link>);

  if (sale.imageUrl && sale.imageOnly) {
    return wrap(
        <section className="fest overflow-hidden rounded-2xl shadow-[0_1.5rem_3rem_-1.5rem_rgb(0_0_0/0.45)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={sale.imageUrl} alt={`${sale.name}: ${sale.percentOff}% off`} className="block max-h-[26rem] min-h-40 w-full object-cover" />
        </section>,
    );
  }

  return wrap(
      <section
        className="fest group relative isolate flex min-h-[17rem] items-center overflow-hidden rounded-2xl shadow-[0_1.5rem_3rem_-1.5rem_rgb(0_0_0/0.45)] sm:min-h-[19rem] lg:min-h-[21rem]"
        style={{ background: sale.imageUrl ? `linear-gradient(90deg,rgb(0 0 0/.15),rgb(0 0 0/.55) 50%,rgb(0 0 0/.15)), url(${sale.imageUrl}) center/cover` : f.bg }}
      >
        {f.fall && <Fall kind={f.fall} />}
        {!sale.imageUrl && <Side motifs={f.left} side="left" />}
        {!sale.imageUrl && <Side motifs={f.right} side="right" />}
        {f.bunting && <Bunting colors={f.bunting} className="pointer-events-none absolute inset-x-0 top-0 h-8 w-full sm:h-10" />}
        <div className="fest-text relative z-10 mx-auto flex max-w-[34rem] flex-col items-center px-6 py-9 text-center" style={{ color: f.ink }}>
          <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.25em]" style={{ color: f.soft }}>{when}</p>
          <h2 className={`${font} mt-2 text-[2.4rem] leading-[0.95] sm:text-[3.4rem] lg:text-[4rem] ${f.font === "bold" ? "uppercase tracking-wide" : ""}`} style={{ textShadow: "0 3px 0 rgb(0 0 0 / 0.18), 0 10px 30px rgb(0 0 0 / 0.25)" }}>
            {sale.name}
          </h2>
          <p className={`${bold.className} fest-pulse mt-3 flex items-end gap-2 text-[2.2rem] uppercase leading-none sm:text-[2.8rem]`}>
            {!sale.allTrees && sale.allTrees !== undefined && <span className="mb-1 text-left text-sm leading-tight">on<br />selected<br />trees</span>}
            <span style={{ color: f.accent, textShadow: "0 2px 0 rgb(0 0 0 / 0.2)" }}>{sale.percentOff}%</span>
            <span className="text-[1.4rem] sm:text-[1.7rem]">off</span>
          </p>
          {sale.message && <p className="mt-3 max-w-md text-sm leading-relaxed sm:text-[0.9375rem]" style={{ color: f.soft }}>{sale.message}</p>}
          <span className="fest-btn mt-5 inline-flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-bold uppercase tracking-wide shadow-lg transition group-hover:scale-105" style={{ background: f.accent, color: isLight(f.accent) ? "#1c1d1a" : "#ffffff" }}>
            Shop now <span aria-hidden>»</span>
          </span>
        </div>
      </section>,
  );
}

function isLight(hex: string) {
  const n = parseInt(hex.slice(1), 16);
  return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150;
}
