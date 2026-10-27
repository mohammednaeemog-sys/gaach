import Link from "next/link";
import { treePhoto } from "@/lib/photo";
import { db } from "@/lib/db";
import { readCompare } from "@/modules/catalogue/compare-list";
import { TreeCard } from "@/components/TreeCard";
import { ratingsFor } from "@/modules/reviews/queries";
import { SpeciesRow, LeafIcon } from "@/components/SpeciesRow";
import { RiseWords } from "@/components/Headline";
import { ScrollVine } from "@/components/ScrollVine";
import { Reveal } from "@/components/Reveal";
import { CountUp } from "@/components/CountUp";

// "Find your kind of tree" tiles. photo: a real photo in public/species/ used
// until the tree itself has a photo (npm run photos adds one for every tree).
const CATEGORIES = [
  { purpose: "FRUIT", title: "Fruit trees", text: "Mango, jackfruit, guava and more", bg: "from-amber-50 to-orange-100", art: "guava", photo: "/species/guava.jpg" },
  { purpose: "SHADE", title: "Shade trees", text: "Cool yards and roadsides", bg: "from-mint-100 to-mint-200", art: "hijal", photo: "/species/hijal.jpg" },
  { purpose: "ORNAMENTAL", title: "Flowering", text: "Krishnachura, jarul, sonalu", bg: "from-rose-50 to-pink-100", art: "jarul", photo: "/species/jarul.jpg" },
  { purpose: "PRIVACY", title: "Hedges and screens", text: "Kamini, hibiscus, bamboo", bg: "from-lime-50 to-emerald-100", art: "hibiscus", photo: "/species/hibiscus.jpg" },
  { purpose: "TIMBER", title: "Timber", text: "Mahogany, teak, arjun, jackfruit", bg: "from-stone-100 to-amber-100", art: "teak", photo: "/species/jackfruit.jpg" },
];

// Round photos in public/species/ for the "Popular species" row
// Soft leafy sprig used as corner decoration
function Branch({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 120 180" className={`pointer-events-none absolute ${className}`} aria-hidden="true">
      <path d="M60 178 C 58 130, 64 80, 92 10" stroke="#9fd7ae" strokeWidth="2.5" fill="none" strokeLinecap="round" />
      {[[70, 140, -40], [64, 110, 35], [72, 80, -35], [78, 52, 30], [88, 26, -25]].map(([x, y, r], i) => (
        <path key={i} d="M0 0 C 10 -14, 34 -14, 44 0 C 34 14, 10 14, 0 0Z" transform={`translate(${x} ${y}) rotate(${(r as number) + (i % 2 ? 180 : 0)})`} fill={i % 2 ? "#cdebd5" : "#b5e2c1"} opacity="0.85" />
      ))}
    </svg>
  );
}

const SPECIES_THUMBS = ["coconut", "date-palm", "guava", "hibiscus", "hijal", "amloki", "jackfruit", "jarul"];

function StatIcon({ kind }: { kind: "leaf" | "pin" | "pot" }) {
  const common = { viewBox: "0 0 24 24", className: "stat-icon h-6 w-6 shrink-0 text-[#1d5b33] sm:h-7 sm:w-7", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "leaf") return <svg {...common}><path d="M5 19 C 5 10, 11 5, 20 5 C 20 13, 14 19, 5 19Z" /><path d="M6 18 L 14 10" /></svg>;
  if (kind === "pin") return <svg {...common}><path d="M12 21 s-6-5.5-6-11 a6 6 0 0 1 12 0 c0 5.5-6 11-6 11z" /><circle cx="12" cy="10" r="2.2" /></svg>;
  return <svg {...common}><path d="M6 13 h12 l-1.6 7 h-8.8z" /><path d="M12 13 V 8" /><path d="M12 9 c-3 0-4.5-2-4.5-4 c2.5 0 4.5 1.5 4.5 4z M12 10 c2.5 0 4-1.6 4-3.5 c-2.2 0-4 1.3-4 3.5z" /></svg>;
}

function FeatureIcon({ kind }: { kind: "leaf" | "shield" | "truck" | "person" }) {
  const p = { viewBox: "0 0 24 24", className: "h-7 w-7 shrink-0 text-[#1d5b33]", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "leaf") return <svg {...p}><path d="M5 19 C 5 10, 11 5, 20 5 C 20 13, 14 19, 5 19Z" /><path d="M6 18 L 14 10" /></svg>;
  if (kind === "shield") return <svg {...p}><path d="M12 3 l7 3 v5 c0 4.5-3 8-7 10 c-4-2-7-5.5-7-10 V6z" /><path d="M9 12 l2 2 l4-4" /></svg>;
  if (kind === "truck") return <svg {...p}><path d="M3 7 h11 v9 H3z M14 10 h4 l3 3 v3 h-7z" /><circle cx="7" cy="17.5" r="1.6" /><circle cx="17" cy="17.5" r="1.6" /></svg>;
  return <svg {...p}><circle cx="12" cy="8" r="3.6" /><path d="M4.5 20 c1.2-4 4.2-6 7.5-6 s6.3 2 7.5 6" /></svg>;
}

export default async function Home({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const [treeCount, productCount, compare, all] = await Promise.all([
    db.tree.count({ where: { published: true } }),
    db.product.count({ where: { active: true, tree: { published: true } } }),
    readCompare(),
    db.tree.findMany({ where: { published: true }, include: { products: { where: { active: true } } }, orderBy: { name: "asc" } }),
  ]);
  const bySlug = (s: string) => all.find((t) => t.slug === s);
  const featured = ["mango-amrapali", "guava", "lemon", "krishnachura", "coconut", "kamini", "hibiscus", "areca-palm"]
    .map(bySlug)
    .filter((t): t is (typeof all)[number] => !!t);
  const ratings = await ratingsFor(featured.map((t) => t.id));
  // Popular species row: trees with a photo, the ones with a round thumbnail first
  const withPics = all
    .map((t) => ({ slug: t.slug, name: t.name, banglaName: t.banglaName, shape: t.shape, color: t.color, imageUrl: treePhoto(t), thumb: SPECIES_THUMBS.includes(t.slug) ? `/species/${t.slug}.jpg` : null }))
    .sort((a, b) => (a.thumb ? SPECIES_THUMBS.indexOf(a.slug) : 99) - (b.thumb ? SPECIES_THUMBS.indexOf(b.slug) : 99));
  const pictured = withPics.filter((t) => t.thumb || t.imageUrl);
  const species = pictured.length >= 4 ? pictured : withPics;
  const counts = (p: string) => all.filter((t) => t.purposes.split(",").includes(p)).length;

  return (
    <div className="space-y-20">
      <ScrollVine />
      {denied && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-800">That page is only for admins.</p>}

      {/* Hero */}
      <section className="hero-light relative -mt-6 overflow-hidden bg-[#f5f3ec] sm:-mt-10 mx-[calc(50%-50vw)]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[60%]" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/home-tree.jpg" alt="" className="hero-tree-img h-full w-full object-cover object-[62%_50%]" />
        </div>
        <div className="hero-light-fade absolute inset-0" aria-hidden />
        {[["38%", "18%", 0], ["47%", "58%", 1.4], ["6%", "88%", 2.3]].map(([l, t, d], i) => (
          <svg key={i} viewBox="0 0 24 24" className="hero-mini-leaf absolute hidden h-4 w-4 text-lime-600/50 md:block" style={{ left: l as string, top: t as string, animationDelay: `${d}s` }} aria-hidden>
            <path d="M4 20 C 4 9, 11 4, 21 4 C 21 14, 15 20, 4 20Z" fill="currentColor" />
          </svg>
        ))}

        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 pb-12 pt-12 sm:pt-16 md:pb-16">
          <div className="max-w-xl">
            <p className="hero-eyebrow flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.22em] text-forest-900/80 sm:text-xs">
              <span>Greener cities<br />healthier people</span>
              <span className="hero-eyebrow-line mt-4 h-px w-12 bg-forest-700/60" />
            </p>
            <h1 className="font-display mt-5 text-[2.8rem] font-semibold leading-[1.04] tracking-tight text-forest-900 sm:text-6xl lg:text-[4.4rem]">
              <span className="block"><RiseWords text="The right tree." start={150} step={110} /></span>
              <span className="block">
                <RiseWords text="The" start={480} step={110} />
                <span className="rise-word hero-green" style={{ animationDelay: "600ms" }}>right place.</span>
              </span>
            </h1>
            <p className="anim-rise mt-6 max-w-md text-base leading-relaxed text-stone-700 sm:text-[17px]" style={{ animationDelay: "750ms" }}>
              Discover trees that suit your district, soil, sunlight and available space. Buy healthy saplings and get expert guidance to help them thrive.
            </p>
            <div className="anim-rise mt-8 flex flex-col gap-3 sm:flex-row" style={{ animationDelay: "880ms" }}>
              <Link href="/recommend" className="hero-cta group flex items-center justify-center gap-3 rounded-xl bg-[#1d5b33] px-7 py-4 font-semibold text-white shadow-[0_14px_30px_-14px_rgb(29_91_51/0.9)] transition hover:-translate-y-0.5 hover:bg-[#174a29]">
                Find trees for my place <span className="transition group-hover:translate-x-1">→</span>
              </Link>
              <Link href="/trees" className="flex items-center justify-center rounded-xl border border-forest-900/25 bg-white/75 px-6 py-4 font-semibold text-forest-900 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white">
                Explore saplings
              </Link>
            </div>
            <ul className="anim-rise mt-8 grid max-w-xl grid-cols-2 gap-y-4 sm:grid-cols-4" style={{ animationDelay: "1000ms" }}>
              {([
                ["leaf", "Verified", "nurseries"],
                ["shield", "Healthy", "saplings"],
                ["truck", "Safe", "delivery"],
                ["person", "Expert", "guidance"],
              ] as const).map(([icon, a, b]) => (
                <li key={a} className="hero-feature flex items-center gap-2.5 text-[13px] leading-tight text-forest-900 sm:px-3 sm:first:pl-0">
                  <FeatureIcon kind={icon} />
                  <span>{a}<br />{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Numbers */}
        <div className="relative border-t border-forest-900/10 bg-[#eef3ec]/92 backdrop-blur-sm">
          <dl className="mx-auto grid max-w-[1400px] grid-cols-3 divide-x divide-forest-900/10 px-4 sm:px-6 lg:px-10 py-6">
            {([
              [treeCount, "Tree species", "leaf"],
              [64, "District profiles", "pin"],
              [productCount, "Sapling variants", "pot"],
            ] as const).map(([n, l, icon]) => (
              <div key={l} className="flex flex-col items-center justify-center gap-2 px-2 sm:flex-row sm:gap-5">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#dfe9d8] sm:h-14 sm:w-14"><StatIcon kind={icon} /></span>
                <div className="text-center sm:text-left">
                  <dt className="sr-only">{l}</dt>
                  <dd className="font-display text-3xl font-semibold text-forest-900 sm:text-4xl"><CountUp to={n} /></dd>
                  <dd className="text-xs text-stone-600 sm:text-sm">{l}</dd>
                </div>
              </div>
            ))}
          </dl>
        </div>

        {/* Popular species */}
        <div className="relative border-t border-forest-900/10 bg-white">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-5">
            <SpeciesRow items={species} tone="light" />
          </div>
        </div>
      </section>
      {/* Categories */}
      <section>
        <Reveal className="mb-6 text-center">
          <h2 className="text-3xl font-bold text-forest-900">Find your <span className="text-lime-500">kind of tree</span></h2>
          <p className="mt-2 text-stone-600">Start from what you want the tree to do for you.</p>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {CATEGORIES.map((c, i) => {
            const art = bySlug(c.art);
            return (
              <Reveal key={c.purpose} delay={i * 80} className={i === 0 ? "col-span-2 md:col-span-1" : ""}>
                <Link href={`/trees?purpose=${c.purpose}`} className={`lift group flex h-full flex-col overflow-hidden rounded-3xl bg-gradient-to-br ${c.bg} p-3 text-center`}>
                  <div className="relative mx-auto mt-2">
                    <div className="cat-photo relative h-28 w-28 overflow-hidden rounded-full bg-forest-800 shadow-[0_12px_24px_-10px_rgb(13_43_35/0.6)] ring-4 ring-white/90 sm:h-32 sm:w-32" style={{ animationDelay: `${i * 0.5}s` }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={art?.imageUrl ?? c.photo} alt={`${c.title}: ${art?.name ?? ""}`} loading="lazy" className="h-full w-full object-cover transition duration-700 group-hover:scale-115" />
                      <span className="cat-shine" aria-hidden />
                    </div>
                    <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold text-forest-900 shadow-md">{counts(c.purpose)} trees</span>
                  </div>
                  <div className="px-1.5 pb-1.5 pt-3">
                    <p className="font-semibold text-forest-900">{c.title}</p>
                    <p className="text-xs text-stone-600">{c.text}</p>
                    <p className="mt-2 text-xs font-semibold text-lime-600 transition group-hover:translate-x-1">Browse →</p>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Featured */}
      <section>
        <Reveal className="mb-6 flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-3xl font-bold text-forest-900">Featured <span className="text-lime-500">saplings</span></h2>
            <p className="mt-1 text-stone-600">Easy growers that suit most homes, rooftops and yards.</p>
          </div>
          <Link href="/trees" className="btn-secondary">See all trees</Link>
        </Reveal>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {featured.map((t, i) => (
            <Reveal key={t.id} delay={(i % 4) * 90}>
              <TreeCard tree={t} comparing={compare.includes(t.slug)} back="/" rating={ratings[t.id]} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="how-wrap relative overflow-hidden rounded-[2.5rem] px-5 py-14 sm:px-10">
        <Branch className="how-branch left-[-10px] top-6 h-40 w-28 sm:h-52 sm:w-36" />
        <Branch className="how-branch how-branch-r right-[-10px] top-10 h-40 w-28 sm:h-56 sm:w-40" />
        <Branch className="how-branch how-branch-b bottom-2 left-6 hidden h-32 w-24 sm:block" />
        <Reveal className="relative mb-10 text-center">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-forest-900 sm:text-[2.6rem]">From your rooftop to <span className="text-lime-600">a growing tree</span></h2>
          <p className="mt-2 text-stone-600">A simple, guided process to help you plan the right tree and watch it thrive.</p>
          <span className="how-underline mx-auto mt-4 block h-[3px] w-16 rounded-full bg-lime-600" />
        </Reveal>
        <div className="relative">
        <Reveal className="pointer-events-none absolute inset-x-0 top-[52px] z-0 hidden lg:block">
          <svg className="steps-vine h-14 w-full" viewBox="0 0 1000 56" preserveAspectRatio="none" aria-hidden="true">
            <path pathLength={1} d="M125 28 C 165 0, 210 56, 250 28 S 335 0, 375 28 S 460 56, 500 28 S 585 0, 625 28 S 710 56, 750 28 S 835 0, 875 28" stroke="#3aa65a" strokeWidth="2.5" strokeDasharray="1" fill="none" strokeLinecap="round" />
          </svg>
          {[25, 50, 75].map((x, i) => (
            <span key={x} aria-hidden="true" className="how-arrow absolute top-1/2 -ml-5 -mt-5 grid h-10 w-10 place-items-center rounded-full bg-forest-700 text-white shadow-lg" style={{ left: `calc(${x}% + ${((x - 50) / 25) * 14}px)`, animationDelay: `${0.9 + i * 0.35}s` }}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
            </span>
          ))}
        </Reveal>
        <ol className="relative grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-14">
          {[
            ["Pick your district", "We know the rainfall, flood, drought and salt conditions of every district.", "/recommend"],
            ["Describe the spot", "Space, sunlight, soil and what you want the tree for.", "/recommend#spot"],
            ["Get explained picks", "Each tree shows how well it matches and why it suits you.", "/recommend#results"],
            ["Buy and grow", "Cash on delivery, then a care plan for every stage of growth.", "/trees"],
          ].map(([title, text, href], i) => (
            <Reveal as="li" key={title} delay={i * 140} className="how-step group">
              <Link href={href} className="flex h-full flex-col items-center text-center">
                <span className="how-photo relative z-10 block h-36 w-36 sm:h-40 sm:w-40" style={{ animationDelay: `${i * 0.6}s` }}>
                  <span className="how-ring absolute -inset-2 rounded-full" aria-hidden="true" />
                  <span className="block h-full w-full overflow-hidden rounded-full bg-mint-100 ring-[6px] ring-white shadow-[0_18px_40px_-18px_rgb(13_43_35/0.55)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={`/steps/${i + 1}.jpg`} alt="" loading="lazy" className="how-img h-full w-full object-cover" />
                  </span>
                  <span className="how-num font-display absolute -bottom-3 left-1/2 grid h-11 w-14 place-items-center rounded-full bg-mint-50 text-lg font-semibold text-forest-700 ring-4 ring-white" style={{ animationDelay: `${0.5 + i * 0.2}s` }}>
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </span>
                <span className="how-card -mt-20 flex w-full flex-1 flex-col rounded-[2rem] bg-white/90 px-5 pb-6 pt-24 shadow-[0_20px_50px_-30px_rgb(13_43_35/0.45)] ring-1 ring-white backdrop-blur-sm">
                  <span className="font-display text-xl font-semibold text-forest-900">{title}</span>
                  <span className="mt-2 text-sm leading-relaxed text-stone-600">{text}</span>
                </span>
              </Link>
            </Reveal>
          ))}
        </ol>
        </div>
        <div className="relative mt-12 text-center">
          <Link href="/recommend" className="how-cta group inline-flex items-center gap-4 rounded-full bg-gradient-to-r from-forest-700 to-lime-600 py-2.5 pl-8 pr-2.5 text-lg font-semibold text-white shadow-[0_16px_32px_-14px_rgb(26_74_59/0.8)]">
            <span className="font-display">Start now, it takes a minute</span>
            <span className="grid h-11 w-11 place-items-center rounded-full border-2 border-white/80 transition-transform duration-300 group-hover:translate-x-1">
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </span>
          </Link>
        </div>
      </section>

    </div>
  );
}
