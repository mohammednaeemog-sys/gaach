import Link from "next/link";
import { LeafIcon } from "@/components/SpeciesRow";

// Simple layout for About and the policy pages
export function InfoPage({ eyebrow, title, intro, updated, children }: {
  eyebrow: string; title: string; intro?: string; updated?: string; children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl">
      <nav className="text-xs text-stone-500" aria-label="Breadcrumb">
        <Link href="/" className="hover:underline">Home</Link> <span aria-hidden>/</span> <span>{title}</span>
      </nav>
      <p className="mt-6 flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-lime-600">
        <LeafIcon className="h-4 w-4 text-lime-500" /> {eyebrow}
      </p>
      <h1 className="font-display anim-rise mt-2 text-4xl font-semibold text-forest-900 sm:text-5xl">{title}</h1>
      {intro && <p className="anim-rise mt-4 text-[0.9375rem] text-stone-600" style={{ animationDelay: "120ms" }}>{intro}</p>}
      {updated && <p className="mt-2 text-xs text-stone-400">Last updated {updated}</p>}
      <div className="prose-page card anim-rise mt-8 p-6 sm:p-8" style={{ animationDelay: "220ms" }}>{children}</div>
      <p className="mt-6 text-sm text-stone-500">
        Questions? <Link href="/contact" className="font-medium text-forest-700 underline">Contact us</Link> and we&apos;ll help.
      </p>
    </div>
  );
}
