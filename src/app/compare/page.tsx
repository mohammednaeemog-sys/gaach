import Link from "next/link";
import { livePromotions, treePrices } from "@/modules/shop/pricing";
import { treePhoto } from "@/lib/photo";
import { db } from "@/lib/db";
import { readCompare } from "@/modules/catalogue/compare-list";
import { clearCompare, toggleCompare } from "@/modules/catalogue/compare";
import { TreeArt } from "@/components/TreeArt";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/icons";
import { spaceTag } from "@/components/TreeCard";
import { label, splitList } from "@/lib/constants";
import { taka } from "@/lib/format";

export const metadata = { title: "Compare trees" };

// Small fruit pictures for the quick-add chips
const FRUIT: Record<string, string> = { "mango-amrapali": "/fruit/mango.jpg", jackfruit: "/fruit/jackfruit.jpg", guava: "/fruit/guava.jpg", lemon: "/fruit/lemon.jpg", papaya: "/fruit/papaya.jpg" };

const LEVEL = { LOW: 1, MEDIUM: 2, HIGH: 3, SLOW: 1, FAST: 3 } as Record<string, number>;

function Meter({ value }: { value: string }) {
  const n = LEVEL[value] ?? 0;
  return (
    <span className="inline-flex items-center gap-2">
      <span className="flex gap-1" aria-hidden>{[1, 2, 3].map((i) => <span key={i} className={`h-2 w-5 rounded-full ${i <= n ? "bg-lime-500" : "bg-stone-200"}`} />)}</span>
      <span>{label(value)}</span>
    </span>
  );
}

function Bar({ value, max, unit }: { value: number; max: number; unit: string }) {
  return (
    <span className="block">
      <span className="font-semibold text-forest-900">{value} {unit}</span>
      <span className="mt-1 block h-1.5 overflow-hidden rounded-full bg-stone-100"><span className="score-bar block h-full rounded-full bg-lime-500" style={{ width: `${Math.max(6, (value / max) * 100)}%` }} /></span>
    </span>
  );
}

function RemoveButton({ slug, name }: { slug: string; name: string }) {
  return (
    <form action={toggleCompare} className="absolute right-2 top-2 z-10">
      <input type="hidden" name="slug" value={slug} />
      <button aria-label={`Remove ${name} from comparison`} className="grid h-7 w-7 place-items-center rounded-full bg-white/95 text-stone-500 shadow ring-1 ring-black/5 hover:text-red-600">×</button>
    </form>
  );
}

// Splits "Mango (Amrapali, dwarf)" into the name and the variety
const nameParts = (n: string) => { const m = n.match(/^(.*?)\s*\((.*)\)$/); return m ? [m[1], `(${m[2]})`] : [n, ""]; };

const HERO_CARDS = [
  { name: "Mango", note: "Fast growing", x: "21.9%", icon: <Icon.leaf className="h-[1.6cqw] w-[1.6cqw] text-[#4a7339]" /> },
  { name: "Krishnachura", note: "Ornamental", x: "47.5%", icon: <Icon.flower className="h-[1.6cqw] w-[1.6cqw] text-[#d1452f]" /> },
  { name: "Neem", note: "Low maintenance", x: "74.3%", icon: <Icon.shield className="h-[1.6cqw] w-[1.6cqw] text-[#1d5b33]" /> },
];

export default async function ComparePage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const slugs = await readCompare();
  const found = await db.tree.findMany({
    where: { slug: { in: slugs }, published: true },
    include: { products: { where: { active: true }, orderBy: { priceBdt: "asc" } } },
  });
  const trees = slugs.map((s) => found.find((t) => t.slug === s)).filter((t): t is (typeof found)[number] => !!t);
  const promos = await livePromotions();
  const pick = { slug: true, name: true, shape: true, color: true, imageUrl: true, products: { where: { active: true }, select: { imageUrl: true } } } as const;
  const suggestions = trees.length < 3
    ? await db.tree.findMany({ where: { published: true, slug: { in: ["jackfruit", "guava", "lemon", "papaya", "mango-amrapali", "hibiscus"].filter((s) => !slugs.includes(s)) } }, take: 4, select: pick })
    : [];
  const query = q?.trim();
  const hits = query && trees.length < 3
    ? await db.tree.findMany({ where: { published: true, slug: { notIn: slugs }, OR: [{ name: { contains: query, mode: "insensitive" } }, { banglaName: { contains: query } }] }, take: 6, select: pick })
    : [];

  const thumb = (s: { slug: string; name: string; shape: string; color: string; imageUrl: string | null; products: { imageUrl: string | null }[] }, cls: string) => (
    <span className={`block shrink-0 overflow-hidden rounded-full bg-mint-100 ${cls}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {FRUIT[s.slug] ? <img src={FRUIT[s.slug]} alt="" className="h-full w-full object-cover" /> : <TreeArt shape={s.shape} color={s.color} name={s.name} imageUrl={treePhoto(s)} animate={false} />}
    </span>
  );

  const hero = (
    <section className="compare-hero relative grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <div className="relative z-10">
        <p className="anim-rise flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-[#2f6b3f]"><Icon.scale className="h-5 w-5" /> Side by side <span className="h-px w-14 bg-[#2f6b3f]/50" /></p>
        <h1 className="font-display mt-4 text-[2.6rem] font-semibold leading-[1.02] text-forest-900 sm:text-[3.4rem] xl:text-[3.7rem]">
          <span className="hh-line block overflow-hidden pb-1"><span className="block" style={{ animationDelay: "80ms" }}>Compare trees</span></span>
          <span className="hh-line block overflow-hidden pb-1"><span className="block" style={{ animationDelay: "220ms" }}>with <span className="whitespace-nowrap"><span className="text-[#2f6b3f]">confidence</span><Icon.leaf className="compare-leaf ml-1 inline h-7 w-7 text-[#4a7339]" /></span></span></span>
        </h1>
        <p className="anim-rise mt-4 max-w-lg text-base leading-relaxed text-stone-600 sm:text-[1.0625rem]" style={{ animationDelay: "360ms" }}>See how trees differ in size, care needs, climate tolerance and more, side by side. Choose the best tree for your space and purpose.</p>
        <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-3 sm:flex sm:flex-wrap xl:flex-nowrap">
          {([[Icon.leaf, "Compare", "up to 3 trees"], [Icon.sun, "See key", "differences"], [Icon.shield, "Based on", "Bangladesh\u2019s climate"], [Icon.list, "Make a", "better choice"]] as const).map(([Ic, a1, b1], i) => (
            <li key={a1 + b1} className="anim-rise flex items-center gap-2 text-[0.78rem] leading-tight text-stone-600 xl:whitespace-nowrap" style={{ animationDelay: `${460 + i * 90}ms` }}>
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#e6ebdf] text-[#2f6b3f]"><Ic className="h-[1.1rem] w-[1.1rem]" /></span>
              <span>{a1}<br />{b1}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="compare-art relative lg:-mr-10" aria-hidden>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/compare-balance.jpg" alt="" className="h-full w-full object-cover" />
        {HERO_CARDS.map((c, i) => (
          <span key={c.name} className="compare-art-label" style={{ left: c.x, animationDelay: `${700 + i * 160}ms` }}>
            <b>{c.name}</b>
            <small>{c.icon}{c.note}</small>
          </span>
        ))}
      </div>
    </section>
  );

  const ordinal = ["first", "second", "third"];
  const picker = (
    <section className="compare-pick anim-rise relative z-10 mx-auto mt-2 max-w-[82rem] rounded-[1.75rem] bg-[#fbfaf6]/95 px-4 py-9 text-center shadow-[0_2rem_4rem_-2.5rem_rgb(28_29_26/0.35)] ring-1 ring-stone-200/60 backdrop-blur sm:px-10 lg:mt-8 2xl:-mt-6" style={{ animationDelay: "250ms" }}>
      <p className="flex items-center justify-center gap-3 text-[#2f6b3f]" aria-hidden><span className="h-px w-10 bg-[#2f6b3f]/40" /><Icon.scale className="h-5 w-5" /><span className="h-px w-10 bg-[#2f6b3f]/40" /></p>
      <h2 className="font-display mt-3 text-[1.9rem] font-semibold text-forest-900 sm:text-[2.3rem]">{trees.length >= 2 ? <>Your <span className="text-[#2f6b3f]">comparison</span></> : <>Pick two or three trees to <span className="text-[#2f6b3f]">compare</span></>}</h2>
      <p className="mx-auto mt-2 max-w-xl text-[0.9375rem] text-stone-500">
        Use the compare control on any tree card, or search and add trees below.
        {trees.length === 1 && <><br />You have chosen <b className="text-forest-900">{trees[0].name}</b> so far.</>}
        {trees.length >= 2 && <><br />The details are below. Add a third tree or remove one any time.</>}
      </p>
      <ol className="mx-auto mt-7 grid max-w-5xl gap-3 sm:grid-cols-3 sm:gap-4">
        {[0, 1, 2].map((i) => {
          const t = trees[i];
          if (t) {
            const [n1, n2] = nameParts(t.name);
            return (
              <li key={t.slug} className="compare-slot is-full lift">
                {thumb({ ...t, products: t.products.map((p) => ({ imageUrl: p.imageUrl })) }, "h-16 w-16 ring-4 ring-white shadow-sm")}
                <span className="min-w-0 flex-1 text-left"><Link href={`/trees/${t.slug}`} className="block truncate font-semibold text-forest-900 hover:text-[#2f6b3f]">{n1}</Link>{n2 && <span className="block truncate text-sm text-stone-500">{n2}</span>}</span>
                <form action={toggleCompare}><input type="hidden" name="slug" value={t.slug} /><button aria-label={`Remove ${t.name}`} className="grid h-7 w-7 place-items-center rounded-full text-stone-600 ring-1 ring-stone-300 transition hover:rotate-90 hover:bg-white hover:text-red-600">×</button></form>
              </li>
            );
          }
          return (
            <li key={i}>
              <label htmlFor="compare-q" className="compare-slot lift cursor-pointer">
                <Icon.sprout className="compare-slot-sprout h-11 w-11 text-[#2f6b3f]" />
                <span className="flex-1 text-left text-sm font-medium text-forest-900">Add {ordinal[i]} tree</span>
                <span className="grid h-7 w-7 place-items-center rounded-full text-[#2f6b3f] ring-1 ring-[#2f6b3f]/60"><Icon.plus className="h-4 w-4" /></span>
              </label>
            </li>
          );
        })}
      </ol>
      {trees.length < 3 && (
        <form method="get" action="/compare" className="mx-auto mt-6 flex max-w-2xl items-center gap-3 rounded-full bg-white px-5 py-3 ring-1 ring-stone-200 transition focus-within:ring-2 focus-within:ring-[#2f6b3f]/50">
          <Icon.search className="h-5 w-5 text-stone-500" />
          <label htmlFor="compare-q" className="sr-only">Search trees to compare</label>
          <input id="compare-q" name="q" type="search" defaultValue={query} placeholder="Search trees to compare (e.g. guava, lemon, neem...)" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
        </form>
      )}
      {query && trees.length < 3 && (
        <div className="mx-auto mt-4 flex max-w-3xl flex-wrap justify-center gap-2">
          {hits.length ? hits.map((s) => (
            <form key={s.slug} action={toggleCompare}>
              <input type="hidden" name="slug" value={s.slug} />
              <button className="quick-add-chip">{thumb(s, "h-9 w-9")}+ {s.name}</button>
            </form>
          )) : <p className="text-sm text-stone-500">No trees found for &ldquo;{query}&rdquo;. Try another name.</p>}
        </div>
      )}
      {!query && suggestions.length > 0 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
          <span className="mr-2 text-[0.9375rem] text-stone-600">Quick add:</span>
          {suggestions.map((s) => (
            <form key={s.slug} action={toggleCompare}>
              <input type="hidden" name="slug" value={s.slug} />
              <button className="quick-add-chip">{thumb(s, "h-9 w-9")}+ {nameParts(s.name)[0]}</button>
            </form>
          ))}
        </div>
      )}
      <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
        {trees.length >= 2 ? (
          <>
            <Link href={`/assistant?q=${encodeURIComponent(`Compare ${trees.map((t) => t.name).join(" and ")}: which one suits me better?`)}`} className="inline-flex items-center justify-center gap-3 rounded-lg bg-[#183d27] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#1d5b33]"><Icon.chat className="h-4 w-4" /> Ask which suits me</Link>
            <form action={clearCompare}><button className="inline-flex w-full items-center justify-center rounded-lg border border-[#183d27] bg-white px-7 py-3 text-sm font-semibold text-forest-900 hover:bg-mint-50">Clear all</button></form>
          </>
        ) : (
          <>
            <Link href="/recommend" className="group inline-flex items-center justify-center gap-3 rounded-lg bg-[#183d27] px-7 py-3 text-sm font-semibold text-white transition hover:bg-[#1d5b33]">Find trees for my place <Icon.arrow className="h-4 w-4 transition group-hover:translate-x-1" /></Link>
            <Link href="/trees" className="inline-flex items-center justify-center rounded-lg border border-[#183d27] bg-white px-7 py-3 text-sm font-semibold text-forest-900 hover:bg-mint-50">Browse all trees</Link>
          </>
        )}
      </div>
    </section>
  );

  if (trees.length < 2) {
    return (
      <div className="compare-page relative overflow-x-clip">
        {hero}
        {picker}
      </div>
    );
  }

  const list = (v: string) => splitList(v).map(label).join(", ");
  type T = (typeof trees)[number];
  const maxH = Math.max(...trees.map((t) => t.matureHeightM));
  const maxS = Math.max(...trees.map((t) => t.canopySpreadM));
  const groups: { title: string; icon: React.ReactNode; rows: [string, (t: T) => React.ReactNode][] }[] = [
    { title: "Size", icon: <Icon.ruler className="h-4 w-4" />, rows: [
      ["Mature height", (t) => <Bar value={t.matureHeightM} max={maxH} unit="m" />],
      ["Canopy spread", (t) => <Bar value={t.canopySpreadM} max={maxS} unit="m" />],
      ["Where it fits", (t) => spaceTag(t.canopySpreadM)],
      ["Growth rate", (t) => <Meter value={t.growthRate} />],
    ] },
    { title: "Growing needs", icon: <Icon.sun className="h-4 w-4" />, rows: [
      ["Sunlight", (t) => list(t.sunlight)],
      ["Soil", (t) => list(t.soils)],
      ["Water need", (t) => <Meter value={t.waterNeed} />],
      ["Good for", (t) => list(t.purposes)],
      ["Season", (t) => t.fruitingSeason],
    ] },
    { title: "Climate tolerance", icon: <Icon.shield className="h-4 w-4" />, rows: [
      ["Flooding", (t) => <Meter value={t.floodTolerance} />],
      ["Drought", (t) => <Meter value={t.droughtTolerance} />],
      ["Salty soil", (t) => <Meter value={t.salinityTolerance} />],
      ["Cautions", (t) => <span className="text-stone-600">{t.cautions}</span>],
    ] },
  ];
  const cols = `minmax(130px,170px) repeat(${trees.length}, minmax(180px, 1fr))`;

  return (
    <div className="compare-page relative overflow-x-clip">
      {hero}
      {picker}
      <div className="mt-10 overflow-x-auto pb-2">
        <div className="min-w-[35rem]">
          {/* Tree cards */}
          <div className="grid gap-3" style={{ gridTemplateColumns: cols }}>
            <div />
            {trees.map((t, i) => (
              <Reveal key={t.id} delay={i * 80} className="relative overflow-hidden rounded-3xl bg-white p-2.5 shadow-[0_0.625rem_1.875rem_-1.375rem_rgb(13_43_35/0.6)] ring-1 ring-stone-100">
                <RemoveButton slug={t.slug} name={t.name} />
                <div className="aspect-[4/3] overflow-hidden rounded-2xl bg-gradient-to-b from-mint-50 to-mint-100"><TreeArt shape={t.shape} color={t.color} name={t.name} imageUrl={treePhoto(t)} /></div>
                <div className="px-1 pt-3">
                  <Link href={`/trees/${t.slug}`} className="font-semibold text-forest-900 hover:text-lime-600">{t.name}</Link>
                  <p className="text-xs text-stone-500">{t.banglaName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="font-bold text-lime-700">{t.products[0] ? (() => { const c = treePrices(t.products, t.id, promos).cheapest!; return <><span className="text-xs font-normal text-stone-500">from </span>{taka(c.price.now)}{c.price.was && <s className="ml-1 text-xs font-normal text-stone-400">{taka(c.price.was)}</s>}</>; })() : <span className="text-sm font-normal text-stone-500">Not on sale</span>}</p>
                    <Link href={`/trees/${t.slug}`} className="rounded-full bg-forest-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-forest-800">View</Link>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Grouped rows */}
          {groups.map((g, gi) => (
            <Reveal key={g.title} delay={gi * 60} className="mt-5 overflow-hidden rounded-3xl bg-white ring-1 ring-stone-100">
              <p className="flex items-center gap-2 border-b border-stone-100 bg-mint-50/60 px-4 py-2.5 text-sm font-semibold text-forest-900"><span className="text-lime-600">{g.icon}</span>{g.title}</p>
              {g.rows.map(([name, fn]) => (
                <div key={name} className="grid gap-3 border-b border-stone-100 px-4 py-3 text-sm last:border-0" style={{ gridTemplateColumns: cols }}>
                  <span className="sticky left-0 font-medium text-stone-500">{name}</span>
                  {trees.map((t) => <span key={t.id} className="text-forest-900">{fn(t)}</span>)}
                </div>
              ))}
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}
