import Link from "next/link";
import { treePhoto } from "@/lib/photo";
import { db } from "@/lib/db";
import { Reveal } from "@/components/Reveal";
import { HeroSlider } from "@/components/HeroSlider";
import { TreeArt } from "@/components/TreeArt";
import { Icon } from "@/components/icons";
import { addToCart } from "@/modules/shop/cart";
import { label, splitList } from "@/lib/constants";
import { taka } from "@/lib/format";


// The five picture tiles under the hero
const STRIP = [
  { title: "Fruit Trees", text: "Mango, jackfruit, guava and more", img: "/categories/fruit.jpg", href: "/trees?purpose=FRUIT" },
  { title: "Shade Trees", text: "Cooler spaces for homes and public areas", img: "/categories/shade.jpg", href: "/trees?purpose=SHADE" },
  { title: "Flowering Trees", text: "Add colour to your surroundings", img: "/categories/flowering.jpg", href: "/trees?purpose=ORNAMENTAL" },
  { title: "Hedges & Screens", text: "Privacy and green boundaries", img: "/categories/hedges.jpg", href: "/trees?purpose=PRIVACY" },
  { title: "Rooftop & Balcony", text: "Compact trees for smaller spaces", img: "/categories/rooftop.jpg", href: "/trees?size=small" },
];
const TYPE_WORD: Record<string, string> = { FRUIT: "Fruit tree", SHADE: "Shade tree", ORNAMENTAL: "Flowering tree", PRIVACY: "Hedge/screen", TIMBER: "Timber tree" };

export default async function Home({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  // The film ships in public/film. Hosts like Vercel do not keep public/ on the server disk, so no file check here.
  const filmReady = true;
  const [all] = await Promise.all([
    db.tree.findMany({ where: { published: true }, include: { products: { where: { active: true } } }, orderBy: { name: "asc" } }),
  ]);
  const bySlug = (s: string) => all.find((t) => t.slug === s);
  const featured = ["mango-himsagar", "neem", "krishnachura", "guava", "bamboo-borak"]
    .map(bySlug)
    .filter((t): t is (typeof all)[number] => !!t);
  return (
    <div className="space-y-20">
      {denied && <p className="rounded-2xl bg-red-50 p-3 text-sm text-red-800">That page is only for admins.</p>}

      {/* Hero: three pictures that change, under a see-through header */}
      <div className="home-hero-wrap mx-[calc(50%-50vw)] -mt-[5.5rem] sm:-mt-[6.5rem]">
        <HeroSlider onFilm={filmReady} />

        {/* Category strip */}
        <nav aria-label="Tree types" className="grid grid-cols-2 gap-px bg-[#1c1d1a] sm:grid-cols-3 lg:grid-cols-5">
          {STRIP.map((c, n) => (
            <Link key={c.title} href={c.href} className={`cat-tile group relative block h-36 overflow-hidden sm:h-40 lg:h-[10.5rem] ${n === 4 ? "col-span-2 sm:col-span-1" : ""}`} style={{ animationDelay: `${n * 90}ms` }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={c.img} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-110" />
              <span className="absolute inset-0 bg-gradient-to-t from-[#1c1d1a]/90 via-[#1c1d1a]/45 to-[#1c1d1a]/10" aria-hidden />
              <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-[#f6f2ea] sm:p-5">
                <span>
                  <span className="block text-xs tabular-nums text-[#f6f2ea]/80">{String(n + 1).padStart(2, "0")}</span>
                  <span className="font-display mt-1 block text-xl leading-tight sm:text-2xl">{c.title}</span>
                  <span className="mt-1 block max-w-[13rem] text-xs leading-snug text-[#f6f2ea]/85 sm:text-[0.8125rem]">{c.text}</span>
                </span>
                <span className="cat-arrow shrink-0 text-xl" aria-hidden>→</span>
              </span>
            </Link>
          ))}
        </nav>
      </div>

      {/* Featured trees */}
      <section className="grid gap-8 lg:grid-cols-[17rem_1fr] lg:items-center">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">Featured trees</p>
          <h2 className="font-display mt-3 text-4xl font-medium leading-[1.05] text-[#1c1d1a] sm:text-5xl">Popular trees in Bangladesh</h2>
          <Link href="/trees" className="group mt-6 inline-flex items-center gap-3 border-b border-[#1c1d1a] pb-1 text-[0.9375rem] text-[#1c1d1a]">View all trees <span className="transition group-hover:translate-x-1" aria-hidden>→</span></Link>
        </Reveal>
        <div className="feat-row -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-5">
          {featured.map((t, n) => {
            const buyable = [...t.products].sort((x, y) => x.priceBdt - y.priceBdt).find((p) => p.stock > 0);
            const cheapest = [...t.products].sort((x, y) => x.priceBdt - y.priceBdt)[0];
            const type = splitList(t.purposes)[0];
            return (
              <Reveal key={t.id} delay={n * 90} className="w-[72%] shrink-0 snap-start sm:w-auto">
                <article className="feat-card group flex h-full flex-col border border-stone-200/80 bg-white">
                  <Link href={`/trees/${t.slug}`} className="block aspect-[2/1.05] overflow-hidden bg-[#eee8dc]" tabIndex={-1} aria-hidden>
                    <TreeArt shape={t.shape} color={t.color} name={t.name} imageUrl={treePhoto(t)} className="transition duration-700 group-hover:scale-105" />
                  </Link>
                  <div className="flex flex-1 flex-col p-4">
                    <h3 className="text-[0.9375rem] text-[#1c1d1a]"><Link href={`/trees/${t.slug}`} className="hover:text-[#4a7339]">{t.name.split(" (")[0]}</Link></h3>
                    <p className="text-sm text-stone-500">{t.banglaName.split(" (")[0]}</p>
                    <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-stone-500">
                      <span className="inline-flex items-center gap-1"><Icon.sun className="h-3.5 w-3.5" /> {label(splitList(t.sunlight)[0])}</span>
                      {type && <span className="inline-flex items-center gap-1"><Icon.leaf className="h-3.5 w-3.5" /> {TYPE_WORD[type] ?? label(type)}</span>}
                    </p>
                    <p className="mt-3 font-medium text-[#1c1d1a]">{cheapest ? taka(cheapest.priceBdt) : ""}</p>
                    <div className="mt-auto pt-3">
                      {buyable ? (
                        <form action={addToCart}>
                          <input type="hidden" name="productId" value={buyable.id} />
                          <input type="hidden" name="back" value="/" />
                          <button className="feat-btn flex w-full items-center justify-center gap-3 bg-[#1c1d1a] px-4 py-2.5 text-sm text-[#f6f2ea] transition hover:bg-[#2f5a3a]" aria-label={`Add ${t.name} to cart`}>
                            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 4h2.5l2.2 11h10.6L20 8H7" /><circle cx="9" cy="19" r="1.4" /><circle cx="17" cy="19" r="1.4" /></svg>
                            Add to cart
                          </button>
                        </form>
                      ) : (
                        <Link href={`/trees/${t.slug}`} className="flex w-full items-center justify-center border border-stone-300 px-4 py-2.5 text-sm text-stone-600 hover:bg-[#f6f2ea]">View details</Link>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* Your journey: four steps from district to growing tree */}
      <section className="journey relative isolate mx-[calc(50%-50vw)] overflow-hidden bg-[var(--color-cream)] px-[calc(50vw-50%)] pb-6 pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/steps/leaves-tl.png" alt="" aria-hidden className="journey-leaf journey-leaf-l pointer-events-none absolute left-0 top-0 hidden w-[12vw] max-w-[15rem] md:block" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/steps/leaves-r.png" alt="" aria-hidden className="journey-leaf journey-leaf-r pointer-events-none absolute bottom-0 right-0 hidden w-[5.5vw] max-w-[7rem] md:block" />
        <Reveal className="relative text-center">
          <p className="flex items-center justify-center gap-4 text-[0.6875rem] font-medium uppercase tracking-[0.2em] text-stone-600"><span className="journey-rule h-px w-10 bg-[#1d5b33]" aria-hidden />Your journey, a <b className="font-semibold text-[#1d5b33]">greener Bangladesh</b><span className="journey-rule h-px w-10 bg-[#1d5b33]" aria-hidden /></p>
          <h2 className="font-display mt-3 text-[2.2rem] font-semibold leading-tight tracking-tight text-forest-900 sm:text-[3rem]">From your rooftop to <span className="text-[#1d5b33]">a growing tree</span></h2>
          <p className="mt-2 text-base text-stone-600 sm:text-lg">A simple, guided process to help you plan the right tree and watch it thrive.</p>
        </Reveal>
        <ol className="journey-steps relative mt-10 grid gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-12">
          {[
            ["Pick your district", "We know the rainfall, flood, drought and soil conditions of every district.", "/recommend", "A map of Bangladesh with Dhaka marked"],
            ["Describe the spot", "Space, sunlight, soil and what you want the tree for.", "/recommend#spot", "A rooftop with potted plants and a trowel"],
            ["Get explained picks", "Each tree shows how well it matches and why it suits you.", "/recommend#results", "A tablet showing recommended trees"],
            ["Buy and grow", "Cash on delivery, then a care plan for every stage of growth.", "/trees", "A young tree in a grow bag on a rooftop"],
          ].map(([title, text, href, alt], i) => (
            <Reveal as="li" key={title} delay={i * 150} className="journey-step group relative">
              <Link href={href} className="block">
                <span className="block overflow-hidden rounded-md bg-mint-100 shadow-[0_1rem_2rem_-1.4rem_rgb(28_29_26/0.5)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/steps/journey-${i + 1}.jpg`} alt={alt} loading="lazy" className="journey-img aspect-[281/172] w-full object-cover" />
                </span>
                <span className="relative -mt-6 flex items-center pl-1">
                  <span className="journey-num font-display relative z-10 grid h-12 w-12 place-items-center rounded-full bg-[#183d27] text-lg font-semibold text-white ring-4 ring-[var(--color-cream)]" style={{ animationDelay: `${0.4 + i * 0.2}s` }}>{String(i + 1).padStart(2, "0")}</span>
                  {i < 3 && <span className="journey-line absolute left-[3.75rem] top-1/2 hidden h-px bg-[#183d27] lg:block" style={{ animationDelay: `${0.8 + i * 0.25}s` }} aria-hidden />}
                </span>
                <span className="font-display mt-3 block text-2xl font-semibold text-forest-900 transition group-hover:text-[#1d5b33]">{title}</span>
                <span className="mt-2 block max-w-[17rem] text-[0.9375rem] leading-relaxed text-stone-500">{text}</span>
              </Link>
            </Reveal>
          ))}
        </ol>
        <div className="relative mt-10 text-center">
          <Link href="/recommend" className="group inline-flex items-center gap-3 rounded-md bg-[#183d27] px-8 py-4 text-base font-medium text-white shadow-[0_1rem_2rem_-1.2rem_rgb(24_61_39/0.9)] transition hover:bg-[#1d5b33]">
            Start now, it takes a minute <Icon.arrow className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
          </Link>
        </div>
      </section>

    </div>
  );
}
