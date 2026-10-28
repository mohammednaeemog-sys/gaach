import Link from "next/link";
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
const FRUIT: Record<string, string> = { "mango-amrapali": "/fruit/mango.jpg", jackfruit: "/fruit/jackfruit.jpg", guava: "/fruit/guava.jpg", lemon: "/fruit/lemon.jpg" };

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

export default async function ComparePage() {
  const slugs = await readCompare();
  const found = await db.tree.findMany({
    where: { slug: { in: slugs }, published: true },
    include: { products: { where: { active: true }, orderBy: { priceBdt: "asc" } } },
  });
  const trees = slugs.map((s) => found.find((t) => t.slug === s)).filter((t): t is (typeof found)[number] => !!t);
  const suggestions = trees.length < 3
    ? await db.tree.findMany({ where: { published: true, slug: { in: ["mango-amrapali", "jackfruit", "guava", "lemon", "papaya", "hibiscus"].filter((s) => !slugs.includes(s)) } }, take: 4, select: { slug: true, name: true, shape: true, color: true, imageUrl: true, products: { where: { active: true }, select: { imageUrl: true } } } })
    : [];

  const header = (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="anim-rise">
        <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#2f7a45]"><Icon.scale className="h-4 w-4" /> Side by side</p>
        <h1 className="font-display mt-2 text-4xl font-semibold text-forest-900 sm:text-5xl">Compare <span className="text-[#2f7a45]">trees</span></h1>
        <p className="mt-2 text-stone-600">Size, care and climate tolerance for up to three trees.</p>
      </div>
      {trees.length >= 2 && (
        <div className="flex flex-wrap gap-2">
          <Link href={`/assistant?q=${encodeURIComponent(`Compare ${trees.map((t) => t.name).join(" and ")}: which one suits me better?`)}`} className="btn-secondary"><Icon.chat className="h-4 w-4" /> Ask which suits me</Link>
          <form action={clearCompare}><button className="btn-ghost">Clear all</button></form>
        </div>
      )}
    </div>
  );

  const suggest = suggestions.length > 0 && (
    <div className="flex flex-wrap items-center gap-2">
      <span className="mr-2 text-[0.9375rem] text-stone-500">Quick add:</span>
      {suggestions.map((s) => (
        <form key={s.slug} action={toggleCompare}>
          <input type="hidden" name="slug" value={s.slug} />
          <button className="quick-add-chip"><span className="h-9 w-9 overflow-hidden rounded-full bg-mint-100">{FRUIT[s.slug] ? <img src={FRUIT[s.slug]} alt="" className="h-full w-full object-cover" /> : <TreeArt shape={s.shape} color={s.color} name={s.name} imageUrl={treePhoto(s)} animate={false} />}</span>+ {s.name.split(" (")[0]}</button>
        </form>
      ))}
    </div>
  );

  if (trees.length < 2) {
    return (
      <div>
        {header}
        <div className="compare-empty grid place-items-center rounded-3xl bg-[#fbfaf6] px-5 py-10 text-center ring-1 ring-stone-200/70 sm:px-10 sm:py-12">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/compare-trees.jpg" alt="" className="compare-empty-art w-full max-w-[27.5rem]" />
          <h2 className="font-display mt-4 text-2xl font-semibold text-forest-900 sm:text-3xl">Pick two or three trees to compare</h2>
          <p className="mt-2 max-w-md text-[0.9375rem] text-stone-500">
            Use the compare control on any tree card, or add trees below.{trees.length === 1 && <> You have chosen <b>{trees[0].name}</b> so far.</>}
          </p>
          <div className="mt-7 flex justify-center">{suggest}</div>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/recommend" className="hero-cta inline-flex items-center justify-center gap-3 rounded-lg bg-[#1d4a2f] px-7 py-3 text-sm font-semibold text-white hover:bg-[#1d5b33]">Find trees for my place <span aria-hidden>→</span></Link>
            <Link href="/trees" className="inline-flex items-center justify-center rounded-lg border border-[#1d4a2f] bg-white px-7 py-3 text-sm font-semibold text-forest-900 hover:bg-mint-50">Browse all trees</Link>
          </div>
        </div>
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
    <div>
      {header}
      {suggest && <div className="mb-5">{suggest}</div>}
      <div className="overflow-x-auto pb-2">
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
                    <p className="font-bold text-lime-700">{t.products[0] ? <><span className="text-xs font-normal text-stone-500">from </span>{taka(t.products[0].priceBdt)}</> : <span className="text-sm font-normal text-stone-500">Not on sale</span>}</p>
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
