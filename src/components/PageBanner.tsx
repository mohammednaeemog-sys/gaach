import { LeafIcon } from "./SpeciesRow";

type Feature = { icon: React.ReactNode; text: string };

// Shared page header in the style of the home page: serif title on the left,
// a nursery photo on the right with a soft curved edge, and small feature notes.
export function PageBanner({ eyebrow, title, accent, text, features = [], photo = "/hero/nursery.jpg", children }: {
  eyebrow: string; title: string; accent: string; text: string; features?: Feature[]; photo?: string; children?: React.ReactNode;
}) {
  return (
    <section className="page-banner relative -mt-6 overflow-hidden bg-[#f3efe4] sm:-mt-10 mx-[calc(50%-50vw)]">
      <div className="banner-photo-wrap absolute inset-y-0 right-0 hidden w-[56%] md:block" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" className="banner-photo h-full w-full object-cover" />
      </div>
      {[["8%", "18%", 0], ["44%", "70%", 1.2], ["93%", "12%", 2.1]].map(([l, t, d], i) => (
        <svg key={i} viewBox="0 0 24 24" className="hero-mini-leaf absolute hidden h-5 w-5 text-lime-500/70 md:block" style={{ left: l as string, top: t as string, animationDelay: `${d}s` }} aria-hidden>
          <path d="M4 20 C 4 9, 11 4, 21 4 C 21 14, 15 20, 4 20Z" fill="currentColor" />
        </svg>
      ))}
      <div className="relative mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-[1.1fr_1fr] md:py-14">
        <div>
          <p className="hero-eyebrow flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-lime-600"><LeafIcon className="h-4 w-4 text-lime-500" /> {eyebrow}</p>
          <h1 className="font-display mt-3 text-4xl font-semibold leading-[1.08] text-forest-900 sm:text-5xl">
            <span className="anim-rise block" style={{ animationDelay: "80ms" }}>{title}</span>
            <span className="anim-rise block text-lime-600" style={{ animationDelay: "200ms" }}>{accent}</span>
          </h1>
          <p className="anim-rise mt-4 max-w-md text-[15px] text-stone-600" style={{ animationDelay: "320ms" }}>{text}</p>
          {children}
        </div>
        {features.length > 0 && (
          <div className="flex items-end md:justify-end">
            <div className="banner-features anim-rise grid w-full grid-cols-3 divide-x divide-stone-200/80 rounded-2xl bg-white/85 p-3 shadow-[0_20px_40px_-24px_rgb(13_43_35/0.5)] ring-1 ring-white backdrop-blur md:max-w-md" style={{ animationDelay: "450ms" }}>
              {features.map((f) => (
                <div key={f.text} className="flex flex-col items-start gap-1.5 px-3 text-xs font-medium text-forest-900">
                  <span className="text-lime-600">{f.icon}</span>
                  {f.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
