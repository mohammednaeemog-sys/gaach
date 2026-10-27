// Small line icons shared by the shop pages.
type P = { className?: string };
const base = (className = "h-5 w-5") => ({ viewBox: "0 0 24 24", className, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const Icon = {
  leaf: ({ className }: P) => <svg {...base(className)}><path d="M5 19 C 5 10, 11 5, 20 5 C 20 13, 14 19, 5 19Z" /><path d="M6 18 L 14 10" /></svg>,
  shield: ({ className }: P) => <svg {...base(className)}><path d="M12 3l7 3v5c0 5-3.5 8.5-7 10-3.5-1.5-7-5-7-10V6z" /><path d="M9 12l2 2 4-4" /></svg>,
  truck: ({ className }: P) => <svg {...base(className)}><path d="M3 6h11v10H3z" /><path d="M14 9h4l3 3v4h-7" /><circle cx="7" cy="18" r="1.6" /><circle cx="17" cy="18" r="1.6" /></svg>,
  search: ({ className }: P) => <svg {...base(className)}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>,
  grid: ({ className }: P) => <svg {...base(className)}><rect x="4" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" /><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" /><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" /></svg>,
  list: ({ className }: P) => <svg {...base(className)}><path d="M9 6h11M9 12h11M9 18h11" /><circle cx="4.5" cy="6" r="1" /><circle cx="4.5" cy="12" r="1" /><circle cx="4.5" cy="18" r="1" /></svg>,
  water: ({ className }: P) => <svg {...base(className)}><path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z" /></svg>,
  sun: ({ className }: P) => <svg {...base(className)}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>,
  ruler: ({ className }: P) => <svg {...base(className)}><path d="M4 16L16 4l4 4L8 20z" /><path d="M8 12l1.5 1.5M11 9l1.5 1.5M14 6l1.5 1.5" /></svg>,
  pot: ({ className }: P) => <svg {...base(className)}><path d="M6 13h12l-1.6 7H7.6z" /><path d="M12 13V8" /><path d="M12 9c-3 0-4.5-2-4.5-4 2.5 0 4.5 1.5 4.5 4zM12 10c2.5 0 4-1.6 4-3.5-2.2 0-4 1.3-4 3.5z" /></svg>,
  pin: ({ className }: P) => <svg {...base(className)}><path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></svg>,
  soil: ({ className }: P) => <svg {...base(className)}><path d="M3 15h18M3 19h18" /><path d="M7 15c0-3 2-5 5-5s5 2 5 5" /><path d="M12 10V6" /></svg>,
  chat: ({ className }: P) => <svg {...base(className)}><path d="M4 5h16v11H9l-5 4z" /></svg>,
  calendar: ({ className }: P) => <svg {...base(className)}><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 10h16M9 3v4M15 3v4" /></svg>,
  sparkle: ({ className }: P) => <svg {...base(className)}><path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" /></svg>,
  scale: ({ className }: P) => <svg {...base(className)}><path d="M12 4v16M5 20h14" /><path d="M4 9l3-5 3 5a3 3 0 0 1-6 0zM14 9l3-5 3 5a3 3 0 0 1-6 0z" /><path d="M7 4h10" /></svg>,
  check: ({ className }: P) => <svg {...base(className)}><path d="M5 12l4 4 10-10" /></svg>,
  warn: ({ className }: P) => <svg {...base(className)}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17v.5" /></svg>,
  book: ({ className }: P) => <svg {...base(className)}><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" /><path d="M4 19V5" /></svg>,
  trash: ({ className }: P) => <svg {...base(className)}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></svg>,
};
