"use client";

import { useEffect, useRef } from "react";

// A thin vine across the top of the page that grows as you scroll, with a leaf at its tip.
export function ScrollVine() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      ref.current?.style.setProperty("--p", String(h > 0 ? Math.min(1, window.scrollY / h) : 0));
    };
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);
  return (
    <div ref={ref} className="scroll-vine" aria-hidden>
      <div className="scroll-vine-line" />
      <svg className="scroll-vine-leaf" viewBox="0 0 20 12"><path d="M1 6 C 6 -1 15 -1 19 6 C 15 13 6 13 1 6Z" fill="#5ee07a" /><path d="M2 6 H 16" stroke="#24a847" strokeWidth="1" /></svg>
    </div>
  );
}
