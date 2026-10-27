import Link from "next/link";
import { db } from "@/lib/db";
import { listTrees, many, SIZE_BANDS, type CatalogueFilters } from "@/modules/catalogue/queries";
import { readCompare } from "@/modules/catalogue/compare-list";
import { Reveal } from "@/components/Reveal";
import { TreeCard } from "@/components/TreeCard";
import { ratingsFor } from "@/modules/reviews/queries";
import { AutoSubmitForm } from "@/components/AutoSubmit";
import { Icon } from "@/components/icons";
import { PURPOSES, SOILS, SUNLIGHT, label, splitList } from "@/lib/constants";

export const metadata = { title: "Browse trees" };

const PER_PAGE = 12;
const TYPES: Record<string, string> = { FRUIT: "Fruit trees", ORNAMENTAL: "Flowering trees", SHADE: "Shade trees", PRIVACY: "Hedges and screens", TIMBER: "Timber trees" };

// Line icons for the category chips
function CatIcon({ kind }: { kind: string }) {
  const p = { viewBox: "0 0 24 24", className: "h-5 w-5 shrink-0", fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (kind === "FRUIT") return <svg {...p}><path d="M12 8 c-4-2-8 0-8 5 c0 5 4 8 6 8 c1 0 1.5-.5 2-.5 s1 .5 2 .5 c2 0 6-3 6-8 c0-5-4-7-8-5z" /><path d="M12 8 c0-2 1-4 3-5" /></svg>;
  if (kind === "SHADE") return <svg {...p}><path d="M12 21 v-7 M12 16 l-3-2 M12 15 l3-2" /><path d="M7 14 c-3 0-4-2-4-4 c0-2 2-3 3-3 c0-2 2-4 4-4 c1 0 2 .5 2.5 1 c.5-.5 1.5-1 2.5-1 c2 0 4 2 4 4 c1 0 3 1 3 3 c0 2-1 4-4 4z" /></svg>;
  if (kind === "ORNAMENTAL") return <svg {...p}><circle cx="12" cy="12" r="2.2" /><path d="M12 9.8 c-1.5-3-1.5-5 0-6.5 c1.5 1.5 1.5 3.5 0 6.5z M14.2 12 c3-1.5 5-1.5 6.5 0 c-1.5 1.5-3.5 1.5-6.5 0z M12 14.2 c1.5 3 1.5 5 0 6.5 c-1.5-1.5-1.5-3.5 0-6.5z M9.8 12 c-3 1.5-5 1.5-6.5 0 c1.5-1.5 3.5-1.5 6.5 0z" /></svg>;
  if (kind === "PRIVACY") return <svg {...p}><path d="M5 19 C 5 10, 11 5, 20 5 C 20 13, 14 19, 5 19Z" /><path d="M6 18 L 14 10" /></svg>;
  return <svg {...p}><ellipse cx="12" cy="5.5" rx="5" ry="2.2" /><path d="M7 5.5 v13 c0 1.2 2.2 2.2 5 2.2 s5-1 5-2.2 v-13" /><path d="M10 9 v6 M14 11 v6" /></svg>;
}

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
      {/* Header: text on cream, nursery photo on the right */}
      <section className="browse-hero relative -mt-6 overflow-hidden bg-[#f4efe2] sm:-mt-10 mx-[calc(50%-50vw)]">
        <div className="absolute inset-y-0 right-0 w-full md:w-[60%]" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/browse.jpg" alt="" className="browse-hero-img h-full w-full object-cover object-[35%_50%]" />
        </div>
        <div className="browse-hero-fade absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-[1400px] px-4 pb-10 pt-12 sm:px-6 sm:pt-14 lg:px-10 md:pb-14">
          <div className="max-w-xl">
            <p className="hero-eyebrow flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.24em] text-forest-900/80">
              Trees for a greener tomorrow <span className="hero-eyebrow-line h-px w-14 bg-forest-900/50" />
            </p>
            <h1 className="font-display mt-4 text-4xl font-semibold leading-[1.06] text-forest-900 sm:text-5xl lg:text-6xl">
              <span className="anim-rise block" style={{ animationDelay: "80ms" }}>Find trees for a</span>
              <span className="anim-rise hero-green block" style={{ animationDelay: "200ms" }}>greener tomorrow</span>
            </h1>
            <p className="anim-rise mt-4 max-w-lg text-[15px] leading-relaxed text-stone-700 sm:text-base" style={{ animationDelay: "320ms" }}>
              Explore fruit, flowering, shade and timber trees suited to Bangladesh. Healthy saplings, guidance on care and delivery to your door.
            </p>
            <ul className="anim-rise mt-7 flex flex-wrap items-center gap-y-3" style={{ animationDelay: "440ms" }}>
              {([[<Icon.leaf key="l" className="h-5 w-5" />, "Suited to", "Bangladesh"], [<Icon.shield key="s" className="h-5 w-5" />, "Healthy", "saplings"], [<Icon.truck key="t" className="h-5 w-5" />, "Delivery to all", "64 districts"]] as const).map(([icon, a1, b1], i) => (
                <li key={a1} className={`flex items-center gap-3 pr-5 text-sm leading-tight text-forest-900 ${i ? "border-l border-forest-900/15 pl-5" : ""}`}>
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#e5ebd9] text-[#1d5b33]">{icon}</span>
                  <span>{a1}<br />{b1}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Search and type chips */}
      <div className="browse-bar relative mx-[calc(50%-50vw)] border-y border-stone-200/80 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:px-10">
          <form method="get" action="/trees" className="flex w-full items-stretch overflow-hidden rounded-xl border border-stone-200 bg-white lg:max-w-md">
            <span className="grid place-items-center pl-4"><Icon.search className="h-5 w-5 text-stone-500" /></span>
            <label htmlFor="q" className="sr-only">Search trees</label>
            <input id="q" name="q" type="search" defaultValue={f.q} placeholder="Search trees (mango, আম, neem, etc.)" className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm outline-none" />
            {picked.purpose.map((p) => <input key={p} type="hidden" name="purpose" value={p} />)}
            <button className="bg-forest-900 px-6 text-sm font-semibold text-white transition hover:bg-forest-800">Search</button>
          </form>
          <div className="chip-row flex items-center overflow-x-auto lg:border-l lg:border-stone-200 lg:pl-3">
            <Link href={params({ purpose: null, page: null })} className={`cat-chip ${!picked.purpose.length ? "is-on" : ""}`}><Icon.grid className="h-5 w-5" /> All</Link>
            {PURPOSES.map((p) => (
              <Link key={p} href={params({ purpose: singleType === p ? null : p, page: null })} className={`cat-chip ${singleType === p ? "is-on" : ""}`}>
                <CatIcon kind={p} />
                {TYPES[p]}
              </Link>
            ))}
          </div>
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
            <div className={list ? "space-y-3" : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5"}>
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
