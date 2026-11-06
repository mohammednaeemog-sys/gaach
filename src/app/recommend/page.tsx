import Link from "next/link";
import { treePhoto } from "@/lib/photo";
import { getCurrentUser } from "@/modules/accounts/session";
import { siteSchema } from "@/modules/accounts/schemas";
import { locationOptions, runRecommendation } from "@/modules/recommendation/service";
import { describeRegion } from "@/modules/recommendation/engine";
import { readCompare } from "@/modules/catalogue/compare-list";
import { SiteForm, type SiteValues } from "@/components/forms/SiteForm";
import { SaveSiteForm } from "@/components/forms/SaveSiteForm";
import { TreeArt } from "@/components/TreeArt";
import { CompareButton } from "@/components/CompareButton";
import { db } from "@/lib/db";
import { label } from "@/lib/constants";
import { fieldErrors } from "@/lib/forms";
import { taka } from "@/lib/format";
import { livePromotions, treePrices } from "@/modules/shop/pricing";
import { Icon } from "@/components/icons";

export const metadata = { title: "Find trees for your place" };

type SP = Record<string, string | undefined>;

// Soft, out-of-focus leaf sprigs at the page edges (decoration only)
function BlurLeaves() {
  const sprig = (flip: boolean) => (
    <svg viewBox="0 0 120 260" className="h-full w-full" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M20 255 C 30 190, 50 120, 100 20" stroke="#7fa37a" strokeWidth="3" fill="none" />
      {[[34, 200, -30], [44, 160, 40], [56, 120, -35], [70, 86, 35], [86, 50, -25]].map(([x, y, r], i) => (
        <path key={i} d="M0 0 C 12 -16, 40 -16, 52 0 C 40 16, 12 16, 0 0Z" transform={`translate(${x} ${y}) rotate(${r + (i % 2 ? 180 : 0)})`} fill={i % 2 ? "#6f9a6b" : "#5d8a5a"} />
      ))}
    </svg>
  );
  return (
    <div className="pointer-events-none absolute inset-0 -z-0 hidden overflow-visible lg:block" aria-hidden>
      <div className="blur-leaf absolute -left-10 top-56 h-[26.25rem] w-40">{sprig(false)}</div>
      <div className="blur-leaf blur-leaf-r absolute -right-8 top-72 h-[18.75rem] w-32">{sprig(true)}</div>
    </div>
  );
}

export default async function RecommendPage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const user = await getCurrentUser();
  const [divisions, compare, promos] = await Promise.all([locationOptions(), readCompare(), livePromotions()]);
  const savedSites = user
    ? (await db.site.findMany({ where: { userId: user.id }, include: { district: true }, orderBy: { createdAt: "desc" } })).map((s) => ({
        id: s.id, name: s.name, districtId: s.districtId, divisionId: s.district.divisionId,
        spaceM: s.spaceM, sunlight: s.sunlight, soil: s.soil, purpose: s.purpose,
      }))
    : [];

  const submitted = sp.districtId !== undefined || sp.spaceM !== undefined;
  const initial: SiteValues = {
    divisionId: sp.divisionId, districtId: sp.districtId, spaceM: sp.spaceM,
    sunlight: sp.sunlight, soil: sp.soil, purpose: sp.purpose, plantWhen: sp.plantWhen,
  };
  let errors: Record<string, string> = {};
  let outcome: Awaited<ReturnType<typeof runRecommendation>> = null;

  if (submitted) {
    const parsed = siteSchema.safeParse(sp);
    if (!parsed.success) errors = fieldErrors(parsed.error);
    else {
      outcome = await runRecommendation(parsed.data, sp.plantWhen === "MONSOON" ? "MONSOON" : "NOW");
      if (!outcome) errors = { districtId: "That district was not found. Choose it again from the list." };
      else if (!initial.divisionId) initial.divisionId = String(outcome.district.divisionId);
    }
  }

  const best = outcome?.results[0];
  const region = outcome?.district.region;
  const level = (n: number) => (n >= 75 ? "Excellent" : n >= 50 ? "Good" : "Fair");
  const barColor = (n: number) => (n >= 75 ? "bg-lime-500" : n >= 50 ? "bg-amber-400" : "bg-orange-400");
  const conditions = region
    ? [
        { name: "Rainfall", value: label(region.rainfall), dot: region.rainfall === "HIGH" ? "bg-sky-500" : region.rainfall === "MEDIUM" ? "bg-lime-500" : "bg-amber-500" },
        { name: "Flooding", value: region.floodProne ? "Flood-prone" : "Not usually", dot: region.floodProne ? "bg-red-500" : "bg-lime-500" },
        { name: "Dry spells", value: region.droughtProne ? "Common" : "Not usually", dot: region.droughtProne ? "bg-orange-500" : "bg-lime-500" },
        { name: "Salty soil", value: region.saline ? "Yes, coastal" : "No", dot: region.saline ? "bg-red-500" : "bg-lime-500" },
      ]
    : [];

  const chips = [
    { k: "sun", icon: Icon.sun, title: sp.sunlight ? label(sp.sunlight) : "Full sun", text: sp.sunlight === "SHADE" ? "Little direct sun" : sp.sunlight === "PARTIAL" ? "Some hours of sun" : "Bright open spaces" },
    { k: "soil", icon: Icon.soil, title: `${sp.soil ? label(sp.soil) : "Loamy"} soil`, text: sp.soil === "CLAY" ? "Holds water" : sp.soil === "SANDY" ? "Drains fast" : "Well-drained soil" },
    { k: "air", icon: Icon.thermo, title: "Warm & humid", text: outcome ? `${outcome.district.name} climate` : "Bangladesh\u2019s climate" },
    { k: "space", icon: Icon.leaf, title: sp.spaceM ? `${sp.spaceM} m of space` : "Spacious area", text: "For healthy growth" },
  ];

  return (
    <div className="find-page relative mx-[calc(50%-50vw)] overflow-x-clip px-[calc(50vw-50%)]">
      <BlurLeaves />
      {/* Header: title on the left, garden photo with floating condition chips on the right */}
      <div className="find-head relative">
        <div className="relative z-10 xl:max-w-[34rem] xl:py-4">
          <p className="anim-rise flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-[#1d5b33]"><Icon.leaf className="h-4 w-4" /> Tree recommendation <span className="h-px w-10 bg-[#1d5b33]" aria-hidden /></p>
          <h1 className="font-display anim-rise mt-3 text-[2.4rem] font-semibold leading-[1.02] text-forest-900 sm:text-5xl xl:text-[3.3rem]" style={{ animationDelay: "80ms" }}>Find the perfect trees <br className="hidden sm:block" />for <span className="text-[#2f6b3f]">your place</span></h1>
          <p className="anim-rise mt-4 max-w-md text-[0.9375rem] leading-relaxed text-stone-600" style={{ animationDelay: "160ms" }}>
            {outcome ? <>Matched to the climate of <b className="text-forest-900">{outcome.district.name}</b> and your spot.</> : "Tell us about your location and space. We\u2019ll match trees that suit your district\u2019s climate, environment and purpose."}
          </p>
        </div>
        <div className="find-garden anim-fade mt-6 xl:mt-0" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/find-garden.jpg" alt="" className="find-garden-wide" />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero/find-garden-sm.jpg" alt="" className="find-garden-sm" />
          {chips.map((c, i) => (
            <span key={c.k} className={`find-chip find-chip-${c.k}`} style={{ animationDelay: `${450 + i * 140}ms` }}>
              <span className="find-chip-ic"><c.icon className="h-[55%] w-[55%]" /></span>
              <span className="min-w-0"><b>{c.title}</b><small>{c.text}</small></span>
            </span>
          ))}
        </div>
      </div>

      {/* Section tabs and the best match card */}
      <div className="mt-6 grid items-center gap-4 xl:mt-2 xl:grid-cols-[1fr_15.5rem]">
        <nav className="find-tabs grid grid-cols-3 rounded-xl bg-[#ecebe3]/90 p-1 text-sm" aria-label="Sections">
          <a href="#spot" className={`seg-tab ${outcome ? "" : "is-on"}`}><Icon.pin className="h-4 w-4" /> Your spot</a>
          <a href="#results" className={`seg-tab ${outcome ? "is-on" : ""}`}><Icon.leaf className="h-4 w-4" /> Matches {outcome ? <span className="rounded-full bg-lime-500 px-1.5 text-[0.6875rem] text-white">{outcome.results.length}</span> : null}</a>
          <a href="#district" className="seg-tab"><Icon.map className="h-4 w-4" /> District</a>
        </nav>
        <div className="anim-rise relative z-10 rounded-2xl bg-white/95 p-4 shadow-[0_0.875rem_2.125rem_-1.25rem_rgb(13_43_35/0.5)] ring-1 ring-stone-100 backdrop-blur xl:-mt-14" style={{ animationDelay: "300ms" }}>
          <div className="flex items-center justify-between gap-2 text-sm text-forest-900">
            <span className="flex items-center gap-1.5"><Icon.leaf className="h-4 w-4 text-[#1d5b33]" /> Best match</span>
            <span className="text-2xl font-semibold">{best ? best.score : 0}<span className="text-sm font-medium text-stone-500"> / 100</span></span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className={`score-bar h-full rounded-full ${best ? barColor(best.score) : ""}`} style={{ width: `${best?.score ?? 0}%` }} /></div>
          <p className="mt-2 truncate text-xs text-stone-500">{best ? <>{best.tree.name} · {level(best.score)}</> : "Complete the details to see your best trees"}</p>
        </div>
      </div>

      <div className="relative mt-6 grid gap-6 lg:grid-cols-[22.5rem_1fr]">
        <aside id="spot" className="h-fit scroll-mt-24 rounded-3xl bg-white p-5 shadow-[0_0.875rem_2.5rem_-1.75rem_rgb(13_43_35/0.6)] ring-1 ring-stone-100 lg:sticky lg:top-20">
          <h2 className="sr-only">Your spot</h2>
          <SiteForm divisions={divisions} savedSites={savedSites} initial={initial} errors={errors} compact />
        </aside>

        <section aria-live="polite" className="min-w-0 space-y-6">
          {region && outcome && (
            <div id="district" className="scroll-mt-24 overflow-hidden rounded-3xl bg-white shadow-[0_0.875rem_2.5rem_-1.75rem_rgb(13_43_35/0.6)] ring-1 ring-stone-100">
              <div className="flex flex-wrap items-center gap-3 border-b border-stone-100 bg-gradient-to-r from-mint-50 to-white p-5">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-forest-900 text-white"><Icon.pin className="h-5 w-5" /></span>
                <div className="flex-1">
                  <h2 className="font-semibold text-forest-900">{outcome.district.name} · {outcome.district.division.name} division</h2>
                  <p className="text-xs text-stone-500">{region.name}: {describeRegion(region)}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs text-stone-600 ring-1 ring-stone-200">{sp.spaceM} m · {label(sp.sunlight!)} · {label(sp.soil!)} · {label(sp.purpose!)}</span>
              </div>
              <dl className="grid grid-cols-2 divide-x divide-y divide-stone-100 sm:grid-cols-4 sm:divide-y-0">
                {conditions.map((c) => (
                  <div key={c.name} className="p-4">
                    <dt className="text-xs text-stone-500">{c.name}</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm font-semibold text-forest-900"><span className={`h-2.5 w-2.5 rounded-full ${c.dot}`} />{c.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {!outcome && (
            <div className="find-empty relative grid overflow-hidden rounded-3xl bg-[#f6f3ec] shadow-[0_0.875rem_2.5rem_-1.75rem_rgb(13_43_35/0.6)] ring-1 ring-stone-100 md:min-h-[38rem] md:grid-cols-[1.05fr_1fr]">
              <div className="relative overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/hero/find-annotated.jpg" alt="A young tree in a home garden, with notes: right tree for your space, healthier environment, shade and cooler surroundings, a greener Bangladesh" className="find-annot anim-fade h-72 w-full object-cover md:absolute md:inset-0 md:h-full" />
              </div>
              <div className="relative flex flex-col justify-center p-6 sm:p-10">
                <p className="anim-rise flex items-center gap-3 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-stone-600">Personalised recommendations <span className="h-px w-10 bg-stone-400" aria-hidden /></p>
                <h2 className="font-display anim-rise mt-4 text-[2.1rem] font-semibold leading-[1.05] text-forest-900 lg:text-[2.7rem]" style={{ animationDelay: "80ms" }}>{Object.keys(errors).length ? "Please fix the highlighted fields" : <>Your matches<br /> will <span className="text-[#2f6b3f]">appear here</span></>}</h2>
                <p className="anim-rise mt-4 text-[0.9375rem] leading-relaxed text-stone-600" style={{ animationDelay: "140ms" }}>We&apos;ll match your district&apos;s rainfall, temperature, soil type and space conditions with the most suitable trees. Get trees that grow well, stay healthy, and fit your purpose.</p>
                <ul className="mt-7 space-y-5">
                  {[
                    { icon: Icon.sprout, title: "Trees suited to your district", text: "Recommendations based on local climate and environment." },
                    { icon: Icon.doc, title: "Clear growing guidance", text: "Learn about space, sunlight, soil and care requirements." },
                    { icon: Icon.bars, title: "Compare and choose", text: "See details, benefits and best matches for your place." },
                  ].map((f, i) => (
                    <li key={f.title} className="anim-rise flex items-start gap-4" style={{ animationDelay: `${220 + i * 110}ms` }}>
                      <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-[#e6ebdf] text-[#1d5b33] transition duration-300 hover:scale-105"><f.icon className="h-6 w-6" /></span>
                      <span className="pt-1">
                        <span className="block font-semibold text-forest-900">{f.title}</span>
                        <span className="block text-sm leading-relaxed text-stone-500">{f.text}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {outcome && (
            <div id="results" className="scroll-mt-24">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-xl font-semibold text-forest-900">{outcome.results.length ? `${outcome.results.length} trees suit this spot` : "No trees match these conditions"}</h2>
                {compare.length >= 2 && <Link href="/compare" className="btn-secondary">Compare {compare.length} trees →</Link>}
              </div>

              {outcome.advice && (
                <div className="mb-4 rounded-2xl bg-amber-50 p-5 ring-1 ring-amber-200">
                  <p className="font-semibold text-amber-900">What to try</p>
                  <p className="mt-1 text-sm text-amber-900">{outcome.advice.message}</p>
                  <p className="mt-2 text-xs text-amber-800">Removed by region: {outcome.eliminated.region} · space: {outcome.eliminated.space} · sunlight: {outcome.eliminated.sunlight}</p>
                </div>
              )}

              <ol className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {outcome.results.map((r, i) => {
                  const product = r.tree.products.length ? treePrices(r.tree.products, r.tree.id, promos).cheapest : null;
                  return (
                    <li key={r.tree.id} className="match-card anim-rise flex flex-col overflow-hidden rounded-3xl bg-white shadow-[0_0.625rem_1.875rem_-1.5rem_rgb(13_43_35/0.6)] ring-1 ring-stone-100" style={{ animationDelay: `${Math.min(i, 8) * 70}ms` }}>
                      <Link href={`/trees/${r.tree.slug}`} className="match-photo relative block h-48 overflow-hidden bg-gradient-to-b from-mint-50 to-mint-100" tabIndex={-1} aria-hidden>
                        <TreeArt shape={r.tree.shape} color={r.tree.color} name={r.tree.name} imageUrl={treePhoto(r.tree)} />
                        <span className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-full bg-forest-900 text-sm font-bold text-white shadow">{i + 1}</span>
                        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow ${r.score >= 75 ? "bg-white text-forest-700" : "bg-white text-amber-800"}`}>{r.matchLevel} · {r.score}%</span>
                      </Link>
                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-lg font-semibold leading-snug text-forest-900"><Link href={`/trees/${r.tree.slug}`} className="hover:text-lime-700">{r.tree.name}</Link></h3>
                        <p className="text-sm text-stone-500">{r.tree.banglaName}</p>
                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-stone-100"><div className={`score-bar h-full rounded-full ${barColor(r.score)}`} style={{ width: `${r.score}%`, animationDelay: `${0.2 + Math.min(i, 8) * 0.07}s` }} /></div>
                        <ul className="mt-3 flex flex-wrap gap-1.5 text-[0.6875rem] text-stone-600" aria-label="Tree facts">
                          <li className="rounded-full bg-stone-100 px-2 py-0.5">{r.tree.matureHeightM} m tall</li>
                          <li className="rounded-full bg-stone-100 px-2 py-0.5">{r.tree.canopySpreadM} m wide</li>
                          <li className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-800">{label(r.tree.waterNeed)} water</li>
                        </ul>
                        <ul className="mt-3 flex-1 space-y-1">
                          {r.reasons.slice(0, 2).map((x) => <li key={x} className="flex gap-2 text-[0.8125rem] leading-snug text-stone-700"><Icon.check className="mt-0.5 h-4 w-4 shrink-0 text-lime-600" />{x}</li>)}
                          {r.notes.slice(0, 1).map((n) => <li key={n} className="flex gap-2 text-xs text-amber-800"><Icon.warn className="h-4 w-4 shrink-0" />{n}</li>)}
                        </ul>
                        <div className="mt-4 flex items-center gap-2">
                          {product ? (
                            <Link href={`/trees/${r.tree.slug}`} className="btn-primary flex-1 justify-center px-3 py-2 text-xs">Buy from {taka(product.price.now)}{product.price.was && <s className="ml-1 font-normal opacity-60">{taka(product.price.was)}</s>}</Link>
                          ) : (
                            <Link href={`/trees/${r.tree.slug}`} className="btn-secondary flex-1 justify-center px-3 py-2 text-xs">Details</Link>
                          )}
                          <CompareButton slug={r.tree.slug} active={compare.includes(r.tree.slug)} small />
                        </div>
                        <Link href={`/assistant?tree=${r.tree.slug}&q=${encodeURIComponent(`Why was ${r.tree.name} recommended for ${outcome.district.name}, ${sp.spaceM} m space, ${label(sp.sunlight!).toLowerCase()}, ${label(sp.soil!).toLowerCase()} soil, for ${label(sp.purpose!).toLowerCase()}?`)}`} className="mt-2 flex items-center justify-center gap-1.5 rounded-xl py-1.5 text-xs font-medium text-forest-700 hover:bg-mint-50"><Icon.chat className="h-4 w-4" /> Why this tree?</Link>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 flex flex-wrap items-center gap-3 rounded-3xl bg-forest-900 p-5 text-white">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-white/10"><Icon.pin className="h-5 w-5 text-lime-400" /></span>
                <p className="flex-1 text-sm font-semibold">Save this spot to get advice for it later</p>
                {user ? (
                  <div className="w-full sm:w-auto [&_input]:text-forest-900"><SaveSiteForm fields={{ districtId: sp.districtId!, spaceM: sp.spaceM!, sunlight: sp.sunlight!, soil: sp.soil!, purpose: sp.purpose! }} /></div>
                ) : (
                  <Link href={`/login?next=${encodeURIComponent("/recommend?" + new URLSearchParams(sp as Record<string, string>).toString())}`} className="btn-primary px-4 py-2 text-sm">Log in to save</Link>
                )}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
