import Link from "next/link";
import { db } from "@/lib/db";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/icons";

export const metadata = { title: "Care guides" };

// Six cards on the page; each groups one or more guide topics
const CARDS: { key: string; label: string; topics: string[]; icon: keyof typeof Icon; tint: string }[] = [
  { key: "planting", label: "Planting and care", topics: ["planting", "watering", "feeding"], icon: "sprout", tint: "bg-[#e6ebdf] text-[#2f6b3f]" },
  { key: "pests", label: "Pests", topics: ["pests"], icon: "bug", tint: "bg-[#fbeedd] text-[#c46a1c]" },
  { key: "disease", label: "Problems and diseases", topics: ["disease", "troubleshooting"], icon: "medic", tint: "bg-[#fbe6e3] text-[#c43d34]" },
  { key: "site", label: "Your site and weather", topics: ["site"], icon: "sun", tint: "bg-[#fdf2d9] text-[#cf8d12]" },
  { key: "safety", label: "Safety", topics: ["safety"], icon: "shield", tint: "bg-[#e3ece4] text-[#1d5b33]" },
  { key: "species", label: "Specific trees", topics: ["species"], icon: "leaf", tint: "bg-[#e3ece4] text-[#1d5b33]" },
];

const STEPS = [
  { slug: "planting-a-sapling", icon: "sprout" as const, title: "Choose and plant", text: "Dig a wide pit, mix in compost and plant in the cool of the evening." },
  { slug: "watering-basics", icon: "water" as const, title: "Water and feed", text: "Water deeply but not every day, and feed with compost as the tree grows." },
  { slug: "storm-and-monsoon-protection", icon: "shield" as const, title: "Protect", text: "Stake young trees, fence them from goats and get ready for the monsoon." },
  { slug: "yellow-leaves", icon: "leaf" as const, title: "Watch and fix problems", text: "Check the leaves each week. Yellowing, spots or pests are easy to treat early." },
];

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ q?: string; topic?: string }> }) {
  const { q, topic } = await searchParams;
  const guides = await db.careGuide.findMany({ where: { published: true }, orderBy: { title: "asc" } });
  const term = q?.trim().toLowerCase();
  const openCard = CARDS.find((c) => c.key === topic);
  const shown = term ? guides.filter((g) => `${g.title} ${g.symptoms} ${g.species}`.toLowerCase().includes(term)) : guides;
  const cards = CARDS.map((c) => ({ ...c, items: shown.filter((g) => c.topics.includes(g.topic)) })).filter((c) => c.items.length && (!openCard || c.key === openCard.key));
  const steps = (json: string) => { try { return (JSON.parse(json) as unknown[]).length; } catch { return 0; } };
  const perCard = openCard || term ? 50 : 3;

  return (
    <div className="guides-page">
      {/* Hero: text and search on the left, a planting table photo on the right */}
      <section className="guides-hero relative -mt-6 overflow-hidden sm:-mt-10 mx-[calc(50%-50vw)]">
        <div className="guides-hero-photo absolute inset-y-0 right-0 hidden w-[56%] md:block" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/guides-tools.jpg" alt="" className="h-full w-full object-cover object-left" />
        </div>
        <div className="relative mx-auto max-w-[87.5rem] px-4 pb-10 pt-10 sm:px-6 sm:pt-12 lg:px-10 md:pb-12">
          <div className="max-w-[34rem]">
            <p className="anim-rise flex items-center gap-3 text-[0.6875rem] font-medium uppercase tracking-[0.22em] text-forest-900">Tree care made simple <span className="h-px w-10 bg-forest-900/50" /></p>
            <h1 className="font-display mt-3 text-[2.4rem] font-semibold leading-[1.04] text-forest-900 sm:text-5xl lg:text-[3.3rem]">
              <span className="hh-line block overflow-hidden pb-1"><span className="block" style={{ animationDelay: "80ms" }}>Grow healthy trees,</span></span>
              <span className="hh-line block overflow-hidden pb-1"><span className="block text-[#1d5b33]" style={{ animationDelay: "220ms" }}>season after season</span></span>
            </h1>
            <p className="anim-rise mt-3 text-[0.9375rem] leading-relaxed text-stone-600" style={{ animationDelay: "340ms" }}>Practical guides for planting, watering, feeding and fixing problems, written for Bangladesh&apos;s climate. The Tree Advisor answers from these same guides.</p>
            <form method="get" className="anim-rise mt-5 flex items-center gap-2 rounded-xl bg-white p-1.5 pl-4 shadow-[0_0.75rem_1.875rem_-1.2rem_rgb(28_29_26/0.45)] ring-1 ring-stone-200 transition focus-within:ring-2 focus-within:ring-[#1d5b33]/40" style={{ animationDelay: "440ms" }}>
              <Icon.search className="h-5 w-5 shrink-0 text-stone-500" />
              <label htmlFor="gq" className="sr-only">Search guides</label>
              <input id="gq" name="q" type="search" defaultValue={q} placeholder="Search guides (e.g. yellow leaves, mango, rooftop, pests...)" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
              <button className="rounded-lg bg-[#183d27] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d5b33]">Search</button>
            </form>
            <ul className="anim-rise mt-5 flex flex-wrap gap-y-3" style={{ animationDelay: "540ms" }}>
              {([[Icon.book, `${guides.length} practical`, "guides"], [Icon.leaf, "Stage-by-stage", "care"], [Icon.doc, "Trusted local", "knowledge"]] as const).map(([Ic, a1, b1], i) => (
                <li key={a1} className={`flex items-center gap-3 pr-5 text-[0.8125rem] leading-tight text-stone-600 ${i ? "border-l border-stone-300 pl-5" : ""}`}>
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-[#ebe7dc] text-forest-900"><Ic className="h-5 w-5" /></span>
                  <span>{a1}<br />{b1}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/guides-tools.jpg" alt="" aria-hidden className="h-56 w-full object-cover object-[60%_50%] md:hidden" />
      </section>

      {/* How to grow a healthy tree: four steps in a row */}
      {!term && !openCard && (
        <section className="mt-12">
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-semibold text-forest-900 sm:text-[2.3rem]">How to grow a <span className="text-[#1d5b33]">healthy tree</span></h2>
            <p className="mt-1.5 text-stone-500">Four habits that keep a young tree strong. Tap a step to read the guide.</p>
          </Reveal>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4 lg:gap-0">
            {STEPS.map((s, i) => {
              const I = Icon[s.icon];
              return (
                <Reveal as="li" key={s.slug} delay={i * 120} className={`lg:px-5 ${i ? "lg:border-l lg:border-stone-200" : "lg:pl-0"}`}>
                  <Link href={`/guides/${s.slug}`} className="group flex items-start gap-3">
                    <span className="mt-1 grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[#183d27] text-xs font-semibold text-white">{i + 1}</span>
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e6ebdf] text-[#1d5b33] transition duration-300 group-hover:scale-110 group-hover:bg-[#1d5b33] group-hover:text-white"><I className="h-6 w-6" /></span>
                    <span>
                      <span className="font-display block text-lg font-semibold text-forest-900 group-hover:text-[#1d5b33]">{s.title}</span>
                      <span className="mt-1 block text-sm leading-relaxed text-stone-500">{s.text}</span>
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ol>
        </section>
      )}

      {/* Browse all guides: six topic cards */}
      <section className="mt-14">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 className="font-display flex items-center gap-4 text-2xl font-semibold text-forest-900 sm:text-[1.9rem]">
            {term ? <>Guides for &ldquo;{q}&rdquo;</> : openCard ? openCard.label : "Browse all guides"} <span className="h-px w-10 bg-forest-900/40" aria-hidden />
          </h2>
          {term || openCard ? <Link href="/guides" className="flex items-center gap-1 text-sm font-medium text-[#1d5b33] hover:underline">Show all guides <Icon.arrow className="h-4 w-4" /></Link> : <p className="text-sm text-stone-500">Find practical guides for every stage, problem and environment.</p>}
        </div>
        {cards.length === 0 && <p className="mt-5 rounded-2xl bg-white p-8 text-center text-sm text-stone-600 ring-1 ring-stone-200/70">No guide matches. Try another word, or ask the Tree Advisor.</p>}
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {cards.map((c, ci) => {
            const I = Icon[c.icon];
            return (
              <Reveal key={c.key} delay={(ci % 3) * 90} className="guide-card lift relative overflow-hidden rounded-xl bg-white p-5 ring-1 ring-stone-200/70">
                <I className="guide-card-mark" />
                <div className="relative flex items-center gap-3">
                  <span className={`grid h-10 w-10 place-items-center rounded-full ${c.tint}`}><I className="h-5 w-5" /></span>
                  <h3 className="font-display flex-1 text-lg font-semibold text-forest-900">{c.label}</h3>
                  <Link href={`/guides?topic=${c.key}`} className="flex items-center gap-1.5 text-sm text-forest-900 hover:text-[#1d5b33]">{c.items.length} {c.items.length === 1 ? "guide" : "guides"} <Icon.arrow className="h-4 w-4" /></Link>
                </div>
                <ul className="relative mt-3">
                  {c.items.slice(0, perCard).map((g) => (
                    <li key={g.slug} className="border-b border-stone-100 last:border-0">
                      <Link href={`/guides/${g.slug}`} className="group flex items-center gap-3 py-2 text-sm text-stone-700 hover:text-[#1d5b33]">
                        <span className="min-w-0 flex-1 truncate">{g.title}</span>
                        <span className="text-xs text-stone-400">{steps(g.sections)} steps</span>
                        <Icon.chev className="h-4 w-4 text-stone-400 transition group-hover:translate-x-0.5 group-hover:text-[#1d5b33]" />
                      </Link>
                    </li>
                  ))}
                </ul>
                {!openCard && !term && <Link href={`/guides?topic=${c.key}`} className="relative mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[#1d5b33] hover:underline">View all {c.label.toLowerCase()} guides <Icon.arrow className="h-4 w-4" /></Link>}
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Ask the Tree Advisor banner */}
      <Reveal as="section" className="guides-banner relative mt-12 overflow-hidden rounded-2xl bg-[#0e2a1c] text-white">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/guides-leaves-l.jpg" alt="" aria-hidden className="guides-banner-l absolute inset-y-0 left-0 h-full w-auto object-cover" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/guides-leaves-r.jpg" alt="" aria-hidden className="guides-banner-r absolute inset-y-0 right-0 h-full w-auto object-cover" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_55%_120%_at_50%_50%,#0e2a1c_45%,transparent_100%)]" aria-hidden />
        <div className="relative flex flex-col items-center gap-4 px-6 py-7 text-center lg:flex-row lg:justify-center lg:gap-8 lg:px-16 xl:px-36 lg:text-left">
          <h2 className="font-display text-[1.7rem] font-medium sm:text-3xl lg:whitespace-nowrap">Something wrong with your tree?</h2>
          <p className="max-w-md text-sm text-white/80 lg:min-w-[18rem] lg:flex-1 lg:border-l lg:border-white/25 lg:pl-8">Describe what you see. The Tree Advisor asks a few questions, then suggests likely causes and safe next steps from these guides.</p>
          <Link href="/assistant?q=My%20tree%20has%20a%20problem" className="group inline-flex shrink-0 items-center gap-2 rounded-full bg-[#4f9a4a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#5fae58]">Ask the Tree Advisor <Icon.arrow className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
        </div>
      </Reveal>
    </div>
  );
}
