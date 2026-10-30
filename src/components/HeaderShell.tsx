"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// The header is see-through over the home page's hero picture, and turns solid charcoal once you scroll.
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const home = usePathname() === "/";
  const [top, setTop] = useState(true);
  useEffect(() => {
    const on = () => setTop(window.scrollY < 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  const clear = home && top;
  return (
    <header className={`site-header sticky top-0 z-30 text-white transition-colors duration-300 ${clear ? "is-clear" : "bg-[#1c1d1a]/95 backdrop-blur"}`}>
      {children}
    </header>
  );
}
