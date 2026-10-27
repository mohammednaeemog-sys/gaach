"use client";

import { useRef } from "react";

// A GET filter form that applies itself as soon as a box is ticked or a
// value changes, so there is no separate "Apply" step.
export function AutoSubmitForm({ children, className = "", action }: { children: React.ReactNode; className?: string; action: string }) {
  const ref = useRef<HTMLFormElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  return (
    <form
      ref={ref}
      method="get"
      action={action}
      className={className}
      onChange={(e) => {
        const t = e.target as unknown as HTMLInputElement;
        clearTimeout(timer.current);
        // typed numbers wait a moment; ticks and selects apply at once
        timer.current = setTimeout(() => ref.current?.requestSubmit(), t.type === "number" || t.type === "search" || t.type === "text" ? 700 : 0);
      }}
    >
      {children}
    </form>
  );
}
