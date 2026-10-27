import Link from "next/link";
import { db } from "@/lib/db";
import { PageBanner } from "@/components/PageBanner";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/icons";

export const metadata = { title: "Care guides" };

const TOPICS: Record<string, { label: string; icon: keyof typeof Icon; tint: string }> = {
  planting: { label: "Planting and care", icon: "pot", tint: "bg-mint-100 text-forest-700" },
  watering: { label: "Watering", icon: "water", tint: "bg-sky-50 text-sky-700" },
  feeding: { label: "Feeding", icon: "leaf", tint: "bg-lime-50 text-lime-700" },
  troubleshooting: { label: "Plant problems", icon: "warn", tint: "bg-amber-50 text-amber-700" },
  pests: { label: "Pests", icon: "shield", tint: "bg-orange-50 text-orange-700" },
  disease: { label: "Diseases", icon: "sparkle", tint: "bg-rose-50 text-rose-700" },
  site: { label: "Your site and weather", icon: "sun", tint: "bg-yellow-50 text-yellow-700" },
  safety: { label: "Safety", icon: "shield", tint: "bg-stone-100 text-stone-700" },
  species: { label: "Specific trees", icon: "book", tint: "bg-emerald-50 text-emerald-700" },
};

const STEPS = [
  { slug: "planting-a-sapling", icon: "pot" as const, title: "Choose and plant", text: "Dig a wide pit, mix in compost and plant in the cool of the evening." },
  { slug: "watering-basics", icon: "water" as const, title: "Water and feed", text: "Water deeply but not every day, and feed with compost as the tree grows." },
  { slug: "storm-and-monsoon-protection", icon: "shield" as const, title: "Protect", text: "Stake young trees, fence them from goats and get ready for the monsoon." },
  { slug: "yellow-leaves", icon: "leaf" as const, title: "Watch and fix problems", text: "Check the leaves each week. Yellowing, spots or pests are easy to treat early." },
];

export default async function GuidesPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const guides = await db.careGuide.findMany({ where: { published: true }, orderBy: { title: "asc" } });
  const term = q?.trim().toLowerCase();
  const shown = term ? guides.filter((g) => `${g.title} ${g.symptoms} ${g.species}`.toLowerCase().includes(term)) : guides;
  const groups = Object.entries(TOPICS).map(([k, t]) => ({ key: k, ...t, items: shown.filter((g) => g.topic === k) })).filter((g) => g.items.length);
  const sectionCount = (json: string) => { try { return (JSON.parse(json) as unknown[]).length; } catch { return 0; } };

  return (
    <div className="space-y-20">
      <PageBanner
        eyebrow="Tree care made simple"
        title="Grow healthy trees,"
        accent="season after season"
        text="Practical guides for planting, watering, feeding and fixing problems, written for Bangladesh's climate. The Tree Advisor answers from these same guides."
        features={[
          { icon: <Icon.book className="h-6 w-6" />, text: `${guides.length} practical guides` },
          { icon: <Icon.calendar className="h-6 w-6" />, text: "Stage-by-stage care" },
          { icon: <Icon.shield className="h-6 w-6" />, text: "Sources named" },
        ]}
      >
        <form method="get" className="anim-rise mt-6 flex max-w-md items-center gap-2 rounded-2xl bg-white p-1.5 pl-4 shadow-[0_12px_30px_-16px_rgb(13_43_35/0.4)] ring-1 ring-stone-100" style={{ animationDelay: "400ms" }}>
          <Icon.search className="h-5 w-5 shrink-0 text-stone-400" />
          <label htmlFor="gq" className="sr-only">Search guides</label>
          <input id="gq" name="q" type="search" defaultValue={q} placeholder="Search: yellow leaves, mango, rooftop…" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
          <button className="rounded-xl bg-lime-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-600">Search</button>
        </form>
      </PageBanner>

      {/* How to grow a tree: a curved path of steps beside a photo */}
      {!term && (
        <section>
          <Reveal className="text-center">
            <h2 className="font-display text-3xl font-semibold text-forest-900 sm:text-4xl">How to grow a <span className="text-lime-600">healthy tree</span></h2>
            <p className="mt-2 text-sm text-stone-500">Four habits that keep a young tree strong. Tap a step to read the guide.</p>
          </Reveal>
          <div className="relative mt-10 grid items-center gap-8 md:grid-cols-[0.9fr_1.1fr]">
            <Reveal className="relative mx-[calc(50%-50vw)] h-64 overflow-hidden md:mx-0 md:-ml-[calc((100vw-100%)/2)] md:h-[420px] md:rounded-r-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/hero/nursery.jpg" alt="Young saplings growing in a nursery" className="banner-photo h-full w-full object-cover" />
            </Reveal>
            <div className="relative">
              <svg className="steps-curve pointer-events-none absolute -left-6 top-0 hidden h-full w-24 md:block" viewBox="0 0 100 400" preserveAspectRatio="none" aria-hidden>
                <path pathLength={1} d="M10 0 C 90 90, 90 310, 10 400" stroke="#8fd4a4" strokeWidth="2" fill="none" />
              </svg>
              <ol className="space-y-6">
                {STEPS.map((s, i) => {
                  const I = Icon[s.icon];
                  return (
                    <Reveal as="li" key={s.slug} delay={i * 140} className={`relative ${i === 1 || i === 2 ? "md:pl-14" : "md:pl-6"}`}>
                      <Link href={`/guides/${s.slug}`} className="group flex items-start gap-4">
                        <span className="step-icon grid h-14 w-14 shrink-0 place-items-center rounded-full bg-mint-100 text-forest-700 ring-4 ring-[var(--color-cream)] transition group-hover:bg-lime-500 group-hover:text-white" style={{ animationDelay: `${0.3 + i * 0.25}s` }}><I className="h-6 w-6" /></span>
                        <span>
                          <span className="block font-semibold text-forest-900 group-hover:text-lime-700">{s.title}</span>
                          <span className="mt-1 block max-w-sm text-sm text-stone-600">{s.text}</span>
                        </span>
                      </Link>
                    </Reveal>
                  );
                })}
              </ol>
            </div>
          </div>
        </section>
      )}

      {/* Guides by topic */}
      <section className="space-y-10">
        {term && <p className="text-sm text-stone-600">{shown.length} {shown.length === 1 ? "guide" : "guides"} for &quot;{q}&quot; · <Link href="/guides" className="font-medium text-lime-600 hover:underline">Show all</Link></p>}
        {groups.length === 0 && <p className="rounded-2xl bg-white p-8 text-center text-sm text-stone-600 ring-1 ring-stone-100">No guide matches. Try another word, or ask the Tree Advisor.</p>}
        {groups.map((g) => {
          const I = Icon[g.icon];
          return (
            <div key={g.key}>
              <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold text-forest-900"><span className={`grid h-9 w-9 place-items-center rounded-xl ${g.tint}`}><I className="h-5 w-5" /></span>{g.label}</h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {g.items.map((x, i) => (
                  <Reveal key={x.slug} delay={(i % 3) * 70}>
                    <Link href={`/guides/${x.slug}`} className="group flex h-full items-start gap-3 rounded-2xl bg-white p-4 ring-1 ring-stone-100 transition hover:-translate-y-1 hover:shadow-[0_18px_36px_-22px_rgb(13_43_35/0.5)]">
                      <span className="flex-1">
                        <span className="block font-medium text-forest-900 group-hover:text-lime-700">{x.title}</span>
                        <span className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                          <span className="rounded-full bg-stone-100 px-2 py-0.5 text-stone-600">{sectionCount(x.sections)} steps</span>
                          <span className={`rounded-full px-2 py-0.5 ${x.status === "REVIEWED" ? "bg-mint-100 text-forest-700" : "bg-amber-50 text-amber-800"}`}>{x.status === "REVIEWED" ? "✓ Expert-reviewed" : "Not reviewed yet"}</span>
                        </span>
                      </span>
                      <span className="mt-1 text-stone-300 transition group-hover:translate-x-1 group-hover:text-lime-600" aria-hidden>→</span>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      {/* Call to action over a photo */}
      <Reveal as="section" className="relative overflow-hidden rounded-[2rem] bg-forest-900 px-6 py-14 text-center text-white shadow-[0_30px_60px_-30px_rgb(8_32_26/0.8)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/nursery.jpg" alt="" className="banner-photo absolute inset-0 h-full w-full object-cover opacity-30" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 to-forest-900/40" aria-hidden />
        <div className="relative">
          <h2 className="font-display text-3xl font-semibold sm:text-4xl">Something wrong with your tree?</h2>
          <p className="mx-auto mt-3 max-w-lg text-mint-100/85">Describe what you see. The Tree Advisor asks a few questions, then suggests likely causes and safe next steps from these guides.</p>
          <Link href="/assistant?q=My%20tree%20has%20a%20problem" className="btn-primary btn-shine mt-6 px-6 py-3">Ask the Tree Advisor</Link>
        </div>
      </Reveal>
    </div>
  );
}
