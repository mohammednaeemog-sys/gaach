import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { getTree } from "@/modules/catalogue/queries";
import { readCompare } from "@/modules/catalogue/compare-list";
import { CompareButton } from "@/components/CompareButton";
import { BuyBox } from "@/components/BuyBox";
import { Gallery } from "@/components/Gallery";
import { TreeCard, spaceTag } from "@/components/TreeCard";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/icons";
import { Stars } from "@/components/Stars";
import { ReviewForm } from "@/components/ReviewForm";
import { getCurrentUser } from "@/modules/accounts/session";
import { reviewsForTree, ratingsFor, shortName } from "@/modules/reviews/queries";
import { deleteMyReview } from "@/modules/reviews/actions";
import { dateText } from "@/lib/format";
import { CARE_STAGES, SOIL_HINTS, SUNLIGHT_HINTS, label, splitList, type Soil, type Sunlight } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const tree = await getTree((await params).slug);
  return { title: tree?.name ?? "Tree not found" };
}

export default async function TreePage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ cart?: string }> }) {
  const { slug } = await params;
  const { cart } = await searchParams;
  const [tree, compare] = await Promise.all([getTree(slug), readCompare()]);
  if (!tree) notFound();

  const firstPurpose = splitList(tree.purposes)[0] ?? "";
  const related = await db.tree.findMany({
    where: { published: true, id: { not: tree.id }, purposes: { contains: firstPurpose } },
    include: { products: { where: { active: true }, orderBy: { priceBdt: "asc" } } },
    take: 4,
    orderBy: { name: "asc" },
  });
  const [user, rv, relatedRatings] = await Promise.all([getCurrentUser(), reviewsForTree(tree.id), ratingsFor(related.map((t) => t.id))]);
  const mine = user ? await db.review.findUnique({ where: { treeId_userId: { treeId: tree.id, userId: user.id } } }) : null;

  const list = (v: string) => splitList(v).map(label).join(", ");
  const stage = (s: string) => tree.careStages.find((c) => c.stage === s);
  const ongoing = stage("ONGOING") ?? stage("FIRST_SEASON");
  const sun = splitList(tree.sunlight) as Sunlight[];
  const soils = splitList(tree.soils) as Soil[];

  const care: { icon: React.ReactNode; title: string; body: string }[] = [
    { icon: <Icon.water className="h-4 w-4" />, title: `Water need: ${label(tree.waterNeed).toLowerCase()}`, body: ongoing?.watering || "Water when the top few centimetres of soil are dry." },
    { icon: <Icon.sun className="h-4 w-4" />, title: `Needs ${list(tree.sunlight).toLowerCase()}`, body: sun.map((s) => `${label(s)}: ${SUNLIGHT_HINTS[s]}.`).join(" ") },
    { icon: <Icon.soil className="h-4 w-4" />, title: `Grows in ${list(tree.soils).toLowerCase()} soil`, body: soils.map((s) => `${label(s)}: ${SOIL_HINTS[s]}`).join(" ") },
    { icon: <Icon.ruler className="h-4 w-4" />, title: `${spaceTag(tree.canopySpreadM)} · ${tree.matureHeightM} m tall`, body: `When grown it reaches about ${tree.matureHeightM} m tall and ${tree.canopySpreadM} m wide, growing at a ${label(tree.growthRate).toLowerCase()} rate. Keep at least ${Math.ceil(tree.canopySpreadM / 2)} m from walls.` },
    { icon: <Icon.calendar className="h-4 w-4" />, title: "Fruiting or flowering season", body: tree.fruitingSeason || "Not recorded." },
  ];

  const facts: [React.ReactNode, string, string][] = [
    [<Icon.ruler key="h" />, "Mature height", `${tree.matureHeightM} m`],
    [<Icon.leaf key="s" />, "Canopy spread", `${tree.canopySpreadM} m`],
    [<Icon.sparkle key="g" />, "Growth rate", label(tree.growthRate)],
    [<Icon.water key="r" />, "Rainfall it handles", list(tree.rainfall)],
    [<Icon.warn key="f" />, "Flood tolerance", label(tree.floodTolerance)],
    [<Icon.sun key="d" />, "Drought tolerance", label(tree.droughtTolerance)],
    [<Icon.soil key="sa" />, "Salt tolerance", label(tree.salinityTolerance)],
    [<Icon.pot key="p" />, "Good for", list(tree.purposes)],
  ];
  const stages = CARE_STAGES.map((s) => stage(s)).filter(Boolean);
  const images = [
    ...tree.products.map((p) => ({ key: p.id, src: p.imageUrl ?? tree.imageUrl, label: p.sizeLabel })),
    ...(tree.imageUrl ? [{ key: "tree", src: tree.imageUrl, label: "Grown tree" }] : []),
  ];
  if (!images.length) images.push({ key: "tree", src: tree.imageUrl, label: tree.name });

  return (
    <div className="space-y-14">
      <div>
        <nav className="mb-5 text-sm text-stone-500"><Link href="/trees" className="hover:text-lime-600">Browse</Link> <span aria-hidden>/</span> {tree.name}</nav>
        <div className="grid gap-8 lg:grid-cols-[1fr_1.15fr] lg:gap-12">
          {/* Details and buying */}
          <div className="anim-rise order-2 lg:order-1">
            <h1 className="font-display text-4xl font-semibold uppercase tracking-tight text-forest-900 sm:text-[2.6rem]">{tree.name}</h1>
            <p className="mt-1 text-stone-500">{tree.banglaName} · <i>{tree.scientificName}</i></p>
            <a href="#reviews" className="mt-2 inline-flex items-center gap-2 text-sm text-stone-600 hover:text-forest-900">
              {rv.count ? <><Stars value={rv.avg} /> <b className="text-forest-900">{rv.avg.toFixed(1)}</b> ({rv.count} review{rv.count > 1 ? "s" : ""})</> : <><Stars value={0} /> No reviews yet</>}
            </a>
            <div className="mt-5">
              {cart === "missing" && <p className="field-error mb-2">That size is no longer available.</p>}
              {tree.products.length ? (
                <BuyBox products={tree.products.map((p) => ({ id: p.id, sizeLabel: p.sizeLabel, ageMonths: p.ageMonths, priceBdt: p.priceBdt, stock: p.stock }))} back={`/trees/${tree.slug}`} />
              ) : (
                <p className="rounded-2xl bg-white p-4 text-sm text-stone-600 ring-1 ring-stone-100">This tree is not on sale right now. You can still read about it and ask the Tree Advisor.</p>
              )}
            </div>
            <h2 className="mt-8 text-xs font-semibold uppercase tracking-wider text-forest-900">About this tree</h2>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">{tree.description}</p>
            {tree.cautions && tree.cautions !== "None significant." && (
              <p className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900"><Icon.warn className="h-5 w-5 shrink-0" /><span><b>Caution:</b> {tree.cautions}</span></p>
            )}
            <div className="mt-5 flex flex-wrap gap-2">
              <CompareButton slug={tree.slug} active={compare.includes(tree.slug)} />
              {compare.length >= 2 && <Link href="/compare" className="btn-ghost">Open comparison ({compare.length})</Link>}
              <Link href={`/recommend`} className="btn-ghost">Will it suit my place?</Link>
            </div>
          </div>

          {/* Pictures and care */}
          <div className="anim-rise order-1 space-y-5 lg:order-2" style={{ animationDelay: "120ms" }}>
            <Gallery images={images} shape={tree.shape} color={tree.color} name={tree.name} />
            {tree.imageUrl && tree.imageCredit && (
              <p className="-mt-2 text-xs text-stone-500">Photo: {tree.imageSourceUrl ? <a href={tree.imageSourceUrl} target="_blank" rel="noopener noreferrer" className="hover:text-lime-600 hover:underline">{tree.imageCredit}</a> : tree.imageCredit}</p>
            )}
            <div className="divide-y divide-stone-100 rounded-2xl bg-white px-4 shadow-[0_10px_30px_-20px_rgb(13_43_35/0.4)] ring-1 ring-stone-100">
              {care.map((c, i) => (
                <details key={c.title} className="care-item group py-1" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center gap-3 py-2.5 text-sm font-medium text-forest-900">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-mint-50 text-forest-700">{c.icon}</span>
                    <span className="flex-1">{c.title}</span>
                    <span className="care-chevron text-stone-400 transition" aria-hidden>⌄</span>
                  </summary>
                  <p className="care-body pb-3 pl-10 text-sm leading-relaxed text-stone-600">{c.body}</p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Reveal as="section">
        <h2 className="font-display text-2xl font-semibold text-forest-900">Tree facts</h2>
        <dl className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          {facts.map(([icon, k, v]) => (
            <div key={k} className="rounded-2xl bg-white p-4 ring-1 ring-stone-100">
              <dt className="flex items-center gap-2 text-xs text-stone-500"><span className="text-lime-600 [&_svg]:h-4 [&_svg]:w-4">{icon}</span>{k}</dt>
              <dd className="mt-1 text-sm font-semibold text-forest-900">{v || "Not recorded"}</dd>
            </div>
          ))}
        </dl>
      </Reveal>

      {stages.length > 0 && (
        <Reveal as="section">
          <h2 className="font-display text-2xl font-semibold text-forest-900">Care plan</h2>
          <p className="mt-1 text-sm text-stone-600">After you buy, this plan appears under My trees and shows which stage your tree is in.</p>
          <ol className="care-timeline mt-5 grid gap-4 md:grid-cols-4">
            {stages.map((s, i) => (
              <li key={s!.stage} className="relative rounded-2xl bg-white p-4 ring-1 ring-stone-100">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-lime-500 text-sm font-bold text-white">{i + 1}</span>
                <p className="mt-2 font-semibold text-forest-900">{label(s!.stage)}</p>
                <dl className="mt-2 space-y-1.5 text-xs text-stone-600">
                  {(["planting", "watering", "fertilizing", "protection"] as const).filter((k) => s![k]).map((k) => (
                    <div key={k}><dt className="inline font-semibold capitalize text-stone-700">{k}: </dt><dd className="inline">{s![k]}</dd></div>
                  ))}
                </dl>
              </li>
            ))}
          </ol>
        </Reveal>
      )}

      <section id="reviews" className="scroll-mt-24">
        <h2 className="font-display text-2xl font-semibold text-forest-900">Ratings and reviews</h2>
        <div className="mt-5 grid gap-6 lg:grid-cols-[300px_1fr]">
          <div className="space-y-5">
            <div className="rounded-3xl bg-white p-5 ring-1 ring-stone-100">
              <p className="font-display text-5xl text-forest-900">{rv.count ? rv.avg.toFixed(1) : "–"}<span className="text-lg text-stone-400"> / 5</span></p>
              <Stars value={rv.avg} size="h-5 w-5" className="mt-1" />
              <p className="mt-1 text-sm text-stone-500">{rv.count ? `Based on ${rv.count} review${rv.count > 1 ? "s" : ""}` : "Be the first to review this tree"}</p>
              <ul className="mt-4 space-y-1.5">
                {rv.bars.map((b) => (
                  <li key={b.stars} className="flex items-center gap-2 text-xs text-stone-600">
                    <span className="w-6">{b.stars}★</span>
                    <span className="h-2 flex-1 overflow-hidden rounded-full bg-stone-100"><span className="score-bar block h-full rounded-full bg-amber-400" style={{ width: `${rv.count ? (b.count / rv.count) * 100 : 0}%` }} /></span>
                    <span className="w-6 text-right">{b.count}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-3xl bg-white p-5 ring-1 ring-stone-100">
              <p className="mb-3 font-semibold text-forest-900">{mine ? "Your review" : "Write a review"}</p>
              {user ? (
                <>
                  <ReviewForm treeId={tree.id} initial={mine ? { rating: mine.rating, comment: mine.comment } : undefined} />
                  {mine && (
                    <form action={deleteMyReview} className="mt-2">
                      <input type="hidden" name="treeId" value={tree.id} />
                      <button className="text-xs text-stone-500 hover:text-red-700 hover:underline">Delete my review</button>
                    </form>
                  )}
                  {mine?.hidden && <p className="mt-2 text-xs text-amber-700">An admin has hidden this review from other visitors.</p>}
                </>
              ) : (
                <p className="text-sm text-stone-600"><Link href={`/login?next=/trees/${tree.slug}%23reviews`} className="font-semibold text-lime-700 hover:underline">Log in</Link> to rate this tree and leave a comment.</p>
              )}
            </div>
          </div>
          <div>
            {rv.reviews.length === 0 ? (
              <p className="rounded-3xl border border-dashed border-stone-200 p-8 text-center text-sm text-stone-500">No reviews yet. Bought this tree? Tell others how it is doing.</p>
            ) : (
              <ul className="space-y-3">
                {rv.reviews.map((r) => (
                  <li key={r.id} className="review-card rounded-2xl bg-white p-4 ring-1 ring-stone-100">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="grid h-9 w-9 place-items-center rounded-full bg-mint-100 text-sm font-semibold text-forest-700">{r.user.name.trim()[0]?.toUpperCase()}</span>
                      <span className="font-medium text-forest-900">{shortName(r.user.name)}</span>
                      {r.verified && <span className="inline-flex items-center gap-1 rounded-full bg-mint-50 px-2 py-0.5 text-[11px] font-medium text-forest-700"><Icon.check className="h-3 w-3" /> Bought from Gaach</span>}
                      <span className="ml-auto text-xs text-stone-400">{dateText(r.createdAt)}</span>
                    </div>
                    <Stars value={r.rating} className="mt-2" />
                    {r.comment && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-stone-700">{r.comment}</p>}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section>
          <div className="relative">
            <p className="font-display pointer-events-none absolute -top-6 left-0 select-none text-5xl font-semibold uppercase text-stone-200/70 sm:text-7xl" aria-hidden>Related trees</p>
            <h2 className="font-display relative text-2xl font-semibold uppercase text-forest-900 sm:text-3xl">Related trees</h2>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {related.map((t, i) => (
              <Reveal key={t.id} delay={i * 70} className="h-full">
                <TreeCard tree={t} comparing={compare.includes(t.slug)} back={`/trees/${tree.slug}`} rating={relatedRatings[t.id]} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
