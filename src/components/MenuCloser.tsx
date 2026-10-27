"use client";

import { useEffect } from "react";

// Closes the header menu when you pick a link or click anywhere else.
export function MenuCloser() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      document.querySelectorAll<HTMLDetailsElement>("details.menu[open]").forEach((d) => {
        if (!d.contains(target) || target.closest(".menu-panel a")) d.removeAttribute("open");
      });
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") document.querySelectorAll<HTMLDetailsElement>("details.menu[open]").forEach((d) => d.removeAttribute("open"));
    };
    document.addEventListener("click", onClick);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("click", onClick); document.removeEventListener("keydown", onKey); };
  }, []);
  return null;
}
