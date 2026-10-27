import Link from "next/link";
import { db } from "@/lib/db";
import { listTrees, many, SIZE_BANDS, type CatalogueFilters } from "@/modules/catalogue/queries";
import { readCompare } from "@/modules/catalogue/compare-list";
import { Reveal } from "@/components/Reveal";
import { TreeCard } from "@/components/TreeCard";
import { ratingsFor } from "@/modules/reviews/queries";
import { PageBanner } from "@/components/PageBanner";
import { AutoSubmitForm } from "@/components/AutoSubmit";
import { Icon } from "@/components/icons";
import { PURPOSES, SOILS, SUNLIGHT, label, splitList } from "@/lib/constants";

export const metadata = { title: "Browse trees" };

const PER_PAGE = 12;
const TYPES: Record<string, string> = { FRUIT: "Fruit trees", ORNAMENTAL: "Flowering trees", SHADE: "Shade trees", PRIVACY: "Hedges and screens", TIMBER: "Timber trees" };
const CHIP_PHOTO: Record<string, string> = { FRUIT: "/species/guava.jpg", ORNAMENTAL: "/species/jarul.jpg", SHADE: "/species/hijal.jpg", PRIVACY: "/species/hibiscus.jpg", TIMBER: "/species/jackfruit.jpg" };

export default async function TreesPage({ searchParams }: { searchParams: Promise<CatalogueFilters> }) {
  const f = await searchParams;
  const [trees, compare, all] = await Promise.all([
    listTrees(f),
    readCompare(),
    db.tree.findMany({ where: { published: true }, select: { purposes: true, sunlight: true, soils: true, matureHeightM: true } }),
  ]);
  const ratings = await ratingsFor(trees.map((t) => t.id));
  const picked = { purpose: many(f.purpose, PURPOSES), sunlight: many(f.sunlight, SUNLIGHT), soil: many(f.soil, SOILS), size: many(f.size, Object.keys(SIZE_BANDS)) };
  const count = (field: "purposes" | "sunlight" | "soils", v: string) => all.filter((t) => splitList(t[field]).includes(v)).length;
  const sizeCount = (k: string) => all.filter((t) => t.matureHeightM >= SIZE_BANDS[k].min && t.matureHeightM <= SIZE_BANDS[k].max).length;

  // Keep every current filter in links, changing only what a link sets
  const params = (over: Record<string, string | string[] | null>) => {
    const sp = new URLSearchParams();
    const cur: Record<string, string | string[] | undefined> = { q: f.q, minPrice: f.minPrice, maxPrice: f.maxPrice, sort: f.sort, view: f.view, ...picked };
    for (const [k, v] of Object.entries({ ...cur, ...over })) {
      if (v === null || v === undefined || v === "") continue;
      (Array.isArray(v) ? v : [v]).forEach((x) => sp.append(k, x));
    }
    const s = sp.toString();
    return s ? `/trees?${s}` : "/trees";
  };

  const page = Math.max(1, Math.min(Math.ceil(trees.length / PER_PAGE) || 1, Number(f.page) || 1));
  const pages = Math.ceil(trees.length / PER_PAGE);
  const shown = trees.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const back = params({ page: String(page) });
  const list = f.view === "list";
  const active = Boolean(f.q || f.minPrice || f.maxPrice || Object.values(picked).some((v) => v.length));
  const singleType = picked.purpose.length === 1 ? picked.purpose[0] : null;

  const box = (name: string, value: string, text: string, n: number, checked: boolean) => (
    <label key={value} className="flex cursor-pointer items-center gap-2.5 rounded-lg px-1 py-1 text-sm text-stone-700 hover:bg-mint-50">
      <input type="checkbox" name={name} value={value} defaultChecked={checked} className="h-4 w-4 rounded accent-lime-600" />
      <span className="flex-1">{text}</span>
      <span className="text-xs text-stone-400">({n})</span>
    </label>
  );

  return (
    <div>
      <PageBanner
        eyebrow="Trees for a greener tomorrow"
        title="Find trees for a"
        accent="greener tomorrow"
        text="Explore fruit, flowering, shade and timber trees suited to Bangladesh. Healthy saplings, guidance on care and delivery to your door."
        features={[
          { icon: <Icon.leaf className="h-6 w-6" />, text: "Suited to Bangladesh" },
          { icon: <Icon.shield className="h-6 w-6" />, text: "Healthy saplings" },
          { icon: <Icon.truck className="h-6 w-6" />, text: "Delivery to all 64 districts" },
        ]}
      />

      {/* Search and type chips */}
      <div className="relative z-10 -mt-6 flex flex-col gap-3 lg:flex-row lg:items-center">
        <form method="get" action="/trees" className="flex w-full items-center gap-2 rounded-2xl bg-white p-1.5 pl-4 shadow-[0_12px_30px_-16px_rgb(13_43_35/0.4)] ring-1 ring-stone-100 lg:max-w-sm">
          <Icon.search className="h-5 w-5 shrink-0 text-stone-400" />
          <label htmlFor="q" className="sr-only">Search trees</label>
          <input id="q" name="q" type="search" defaultValue={f.q} placeholder="Search trees (mango, আম, neem…)" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
          {picked.purpose.map((p) => <input key={p} type="hidden" name="purpose" value={p} />)}
          <button className="rounded-xl bg-lime-500 px-4 py-2 text-sm font-semibold text-white hover:bg-lime-600">Search</button>
        </form>
        <div className="chip-row flex gap-2 overflow-x-auto pb-1 lg:pb-0">
          <Link href={params({ purpose: null, page: null })} className={`type-chip ${!picked.purpose.length ? "is-on" : ""}`}><Icon.grid className="h-4 w-4" /> All</Link>
          {PURPOSES.map((p) => (
            <Link key={p} href={params({ purpose: singleType === p ? null : p, page: null })} className={`type-chip ${singleType === p ? "is-on" : ""}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={CHIP_PHOTO[p]} alt="" className="h-6 w-6 rounded-full object-cover" />
              {TYPES[p]}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Filters */}
        <aside>
          <input id="filters-toggle" type="checkbox" className="peer sr-only" />
          <label htmlFor="filters-toggle" className="flex cursor-pointer items-center justify-between rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-forest-900 shadow-sm ring-1 ring-stone-100 lg:hidden">
            Filters {active && <span className="rounded-full bg-lime-500 px-2 text-xs text-white">on</span>} <span aria-hidden>▾</span>
          </label>
          <AutoSubmitForm action="/trees" className="filter-panel mt-3 hidden space-y-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100 peer-checked:block lg:sticky lg:top-20 lg:mt-0 lg:block">
            <div className="flex items-center justify-between">
              <p className="font-semibold text-forest-900">Filters</p>
              {active && <Link href="/trees" className="text-xs font-medium text-lime-600 hover:underline">Clear all</Link>}
            </div>
            {f.q && <input type="hidden" name="q" value={f.q} />}
            {f.sort && <input type="hidden" name="sort" value={f.sort} />}
            {f.view && <input type="hidden" name="view" value={f.view} />}
            <fieldset>
              <legend className="filter-title">Price range (৳)</legend>
              <div className="mt-2 flex items-center gap-2">
                <input name="minPrice" type="number" min="0" step="50" defaultValue={f.minPrice} placeholder="0" aria-label="Lowest price" className="input py-1.5 text-sm" />
                <span className="text-stone-400">–</span>
                <input name="maxPrice" type="number" min="0" step="50" defaultValue={f.maxPrice} placeholder="2000+" aria-label="Highest price" className="input py-1.5 text-sm" />
              </div>
            </fieldset>
            <fieldset><legend className="filter-title">Tree type</legend><div className="mt-1">{PURPOSES.map((p) => box("purpose", p, TYPES[p], count("purposes", p), picked.purpose.includes(p)))}</div></fieldset>
            <fieldset><legend className="filter-title">Sunlight</legend><div className="mt-1">{SUNLIGHT.map((p) => box("sunlight", p, label(p), count("sunlight", p), picked.sunlight.includes(p)))}</div></fieldset>
            <fieldset><legend className="filter-title">Soil type</legend><div className="mt-1">{SOILS.map((p) => box("soil", p, label(p), count("soils", p), picked.soil.includes(p)))}</div></fieldset>
            <fieldset><legend className="filter-title">Mature size</legend><div className="mt-1">{Object.entries(SIZE_BANDS).map(([k, v]) => box("size", k, v.label, sizeCount(k), picked.size.includes(k)))}</div></fieldset>
            <noscript><button className="btn-primary w-full">Apply filters</button></noscript>
          </AutoSubmitForm>
        </aside>

        {/* Results */}
        <section>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <p className="text-sm text-stone-600"><b className="text-forest-900">{trees.length}</b> {trees.length === 1 ? "tree" : "trees"} found</p>
            <AutoSubmitForm action="/trees" className="ml-auto flex items-center gap-2">
              {Object.entries({ q: f.q, minPrice: f.minPrice, maxPrice: f.maxPrice, view: f.view }).map(([k, v]) => v ? <input key={k} type="hidden" name={k} value={v} /> : null)}
              {Object.entries(picked).flatMap(([k, vs]) => vs.map((v) => <input key={k + v} type="hidden" name={k} value={v} />))}
              <label htmlFor="sort" className="text-sm text-stone-500">Sort by</label>
              <select id="sort" name="sort" defaultValue={f.sort ?? ""} className="input w-auto py-1.5 text-sm">
                <option value="">Name (A to Z)</option>
                <option value="price">Price: low to high</option>
                <option value="price-desc">Price: high to low</option>
                <option value="height">Smallest first</option>
              </select>
              <noscript><button className="btn-secondary px-3 py-1.5 text-xs">Sort</button></noscript>
            </AutoSubmitForm>
            <div className="flex overflow-hidden rounded-xl ring-1 ring-stone-200">
              <Link href={params({ view: null, page: String(page) })} aria-label="Grid view" className={`grid h-9 w-9 place-items-center ${!list ? "bg-forest-900 text-white" : "bg-white text-stone-500 hover:bg-mint-50"}`}><Icon.grid className="h-4 w-4" /></Link>
              <Link href={params({ view: "list", page: String(page) })} aria-label="List view" className={`grid h-9 w-9 place-items-center ${list ? "bg-forest-900 text-white" : "bg-white text-stone-500 hover:bg-mint-50"}`}><Icon.list className="h-4 w-4" /></Link>
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center text-sm text-stone-600 ring-1 ring-stone-100">
              <p className="text-3xl" aria-hidden>🌱</p>
              <p className="mt-2">No trees match. Try removing a filter or searching another name.</p>
              <Link href="/trees" className="btn-secondary mt-4">Clear filters</Link>
            </div>
          ) : (
            <div className={list ? "space-y-3" : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4"}>
              {shown.map((t, i) => (
                <Reveal key={t.id} delay={(i % 4) * 60} className="h-full">
                  <TreeCard tree={t} comparing={compare.includes(t.slug)} back={back} layout={list ? "list" : "grid"} rating={ratings[t.id]} />
                </Reveal>
              ))}
            </div>
          )}

          {pages > 1 && (
            <nav className="mt-8 flex flex-wrap items-center justify-between gap-3 text-sm" aria-label="Pages">
              <div className="flex items-center gap-1.5">
                <Link href={params({ page: String(Math.max(1, page - 1)) })} aria-label="Previous page" className={`page-btn ${page === 1 ? "pointer-events-none opacity-40" : ""}`}>‹</Link>
                {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
                  <Link key={n} href={params({ page: String(n) })} aria-current={n === page ? "page" : undefined} className={`page-btn ${n === page ? "is-on" : ""}`}>{n}</Link>
                ))}
                <Link href={params({ page: String(Math.min(pages, page + 1)) })} aria-label="Next page" className={`page-btn ${page === pages ? "pointer-events-none opacity-40" : ""}`}>›</Link>
              </div>
              <p className="text-stone-500">Showing {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, trees.length)} of {trees.length} trees</p>
            </nav>
          )}
        </section>
      </div>
    </div>
  );
}
