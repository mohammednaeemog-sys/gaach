"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

// Home hero: three photos that cross-fade with a slow zoom. The text stays; the picture changes.
const SLIDES = [
  { src: "/hero/slide-1.jpg", alt: "A young tree on a Dhaka rooftop at sunset" },
  { src: "/hero/slide-2.jpg", alt: "Sunlight through a big tree above a river and the city" },
  { src: "/hero/slide-3.jpg", alt: "An orange sunset over the city skyline and a bridge, framed by trees" },
];
const SECONDS = 4;

export function HeroSlider({ onFilm }: { onFilm?: boolean }) {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [filmOpen, setFilmOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const go = useCallback((n: number) => setI(((n % SLIDES.length) + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    timer.current = setTimeout(() => go(i + 1), SECONDS * 1000);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [i, paused, go]);

  return (
    <section
      className="home-hero relative isolate overflow-hidden bg-[#1c1d1a] text-[#f6f2ea]"
      aria-roledescription="carousel"
      aria-label="Gaach highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {SLIDES.map((s, n) => (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={s.src}
          src={s.src}
          alt={n === i ? s.alt : ""}
          aria-hidden={n !== i}
          fetchPriority={n === 0 ? "high" : "auto"}
          loading="eager"
          className={`home-hero-img absolute inset-0 -z-10 h-full w-full object-cover ${n === i ? "is-on" : ""}`}
        />
      ))}
      <div className="home-hero-shade absolute inset-0 -z-10" aria-hidden />

      <div className="mx-auto flex h-full max-w-[87.5rem] flex-col justify-end px-4 pb-8 pt-28 sm:px-6 sm:pb-10 lg:px-10">
        <div className="grid items-end gap-8 lg:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <p className="hh-in text-xs font-medium uppercase tracking-[0.22em] text-[#f6f2ea]/85" style={{ animationDelay: "100ms" }}>Greener Bangladesh</p>
            <h1 className="font-display mt-4 text-[2.9rem] font-medium leading-[0.98] tracking-tight sm:text-6xl lg:text-[4.4rem]">
              {["More Trees", "Brighter", "Tomorrows"].map((line, n) => (
                <span key={line} className="hh-line block overflow-hidden pb-1"><span className="block" style={{ animationDelay: `${250 + n * 140}ms` }}>{line}</span></span>
              ))}
            </h1>
            <p className="hh-in mt-5 max-w-md text-[0.9375rem] leading-relaxed text-[#f6f2ea]/90 sm:text-base" style={{ animationDelay: "700ms" }}>
              Discover a wide range of trees for your home, rooftop, garden and community. Plant with confidence and be part of a healthier Bangladesh.
            </p>
            <div className="hh-in mt-7 flex flex-wrap items-center gap-x-6 gap-y-4" style={{ animationDelay: "850ms" }}>
              <Link href="/trees" className="hh-btn group inline-flex items-center gap-3 rounded-sm bg-[#f6f2ea] px-6 py-3.5 text-[0.9375rem] font-medium text-[#1c1d1a] transition hover:bg-white">
                Explore Trees <span className="transition group-hover:translate-x-1" aria-hidden>→</span>
              </Link>
              <button type="button" onClick={() => setFilmOpen(true)} className="group inline-flex items-center gap-3 text-[0.9375rem] text-[#f6f2ea]">
                <span className="hh-play grid h-12 w-12 place-items-center rounded-full border border-[#f6f2ea]/80 transition group-hover:bg-[#f6f2ea] group-hover:text-[#1c1d1a]">
                  <svg viewBox="0 0 24 24" className="ml-0.5 h-4 w-4" fill="currentColor" aria-hidden><path d="M7 4.5v15l12-7.5z" /></svg>
                </span>
                Why Trees Matter — Watch the Film
              </button>
            </div>
            {/* Slide picker: 01 ——— 02 03 */}
            <div className="hh-in mt-8 flex items-center gap-4 text-sm" style={{ animationDelay: "1000ms" }} role="tablist" aria-label="Choose a picture">
              {SLIDES.map((s, n) => (
                <button
                  key={s.src}
                  type="button"
                  role="tab"
                  aria-selected={n === i}
                  aria-label={`Picture ${n + 1}`}
                  onClick={() => go(n)}
                  className={`flex items-center gap-3 tabular-nums transition ${n === i ? "text-[#f6f2ea]" : "text-[#f6f2ea]/50 hover:text-[#f6f2ea]/80"}`}
                >
                  {String(n + 1).padStart(2, "0")}
                  {n === i && (
                    <span className="relative block h-px w-14 bg-[#f6f2ea]/30 sm:w-20" aria-hidden>
                      <span key={`${i}-${paused}`} className={`hh-progress absolute inset-y-0 left-0 bg-[#f6f2ea] ${paused ? "is-paused" : ""}`} style={{ animationDuration: `${SECONDS}s` }} />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <ul className="hh-in hidden self-start border-l border-[#f6f2ea]/70 pl-4 text-sm leading-6 text-[#f6f2ea]/90 lg:mb-40 lg:block [text-shadow:0_1px_0.6rem_rgb(0_0_0/0.7)]" style={{ animationDelay: "1150ms" }}>
            <li>Homes</li>
            <li>Communities</li>
            <li>Cleaner Air</li>
            <li>A Greener Bangladesh</li>
          </ul>
        </div>
      </div>

      {filmOpen && createPortal(<FilmModal onClose={() => setFilmOpen(false)} ready={!!onFilm} />, document.body)}
    </section>
  );
}

// Plays /film/why-trees-matter-1080p.mp4 once it exists; until then says it is coming.
function FilmModal({ onClose, ready }: { onClose: () => void; ready: boolean }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", k); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="film-modal fixed inset-0 z-50 grid place-items-center bg-black/85 p-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-label="Why Trees Matter film" onClick={onClose}>
      <div className="relative w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
        <button type="button" onClick={onClose} className="absolute -top-11 right-0 text-sm text-[#f6f2ea]/80 hover:text-white" aria-label="Close the film">Close ×</button>
        {ready ? (
          <video className="aspect-video w-full rounded-md bg-black" controls autoPlay playsInline poster="/film/poster.jpg">
            <source src="/film/why-trees-matter-1080p.mp4" type="video/mp4" />
            <track kind="captions" src="/film/why-trees-matter.vtt" srcLang="en" label="English" default />
          </video>
        ) : (
          <div className="grid aspect-video w-full place-items-center rounded-md bg-[#1c1d1a] p-8 text-center text-[#f6f2ea]">
            <div>
              <p className="font-display text-3xl sm:text-4xl">Why Trees Matter</p>
              <p className="mx-auto mt-3 max-w-md text-[#f6f2ea]/75">Our short film is being made. Soon you&apos;ll see why every tree we plant and protect matters for Bangladesh.</p>
              <Link href="/trees" className="mt-6 inline-flex items-center gap-2 text-[#8fb573] hover:text-[#a9cc8c]">Explore Trees →</Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
