import Link from "next/link";
import { treePhoto } from "@/lib/photo";
import { TreeArt } from "./TreeArt";
import { Stars } from "./Stars";
import { addToCart } from "@/modules/shop/cart";
import { toggleCompare } from "@/modules/catalogue/compare";
import { label, splitList } from "@/lib/constants";
import { taka } from "@/lib/format";

type T = {
  slug: string; name: string; banglaName: string; shape: string; color: string; imageUrl: string | null;
  matureHeightM: number; canopySpreadM: number; purposes: string; sunlight: string;
  products: { id: string; priceBdt: number; stock: number; imageUrl?: string | null }[];
};

// Where a tree fits, from how wide it grows
export function spaceTag(spreadM: number) {
  return spreadM <= 3 ? "Rooftop or pot" : spreadM <= 6 ? "Home garden" : "Large space";
}

export function SunIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>;
}
export function HomeIcon({ className = "h-3.5 w-3.5" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 11l9-7 9 7" /><path d="M5 10v10h14V10" /></svg>;
}
export function CartIcon({ className = "h-4 w-4" }: { className?: string }) {
  return <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" /><circle cx="10" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" /></svg>;
}

const KIND: Record<string, string> = { FRUIT: "Fruit tree", SHADE: "Shade tree", ORNAMENTAL: "Flowering tree", PRIVACY: "Hedge/screen", TIMBER: "Timber tree" };
function LeafIcon() {
  return <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><path d="M5 19 C 5 10, 11 5, 20 5 C 20 13, 14 19, 5 19Z" /><path d="M6 18 L 14 10" /></svg>;
}

// Product card: photo, names, price, where it fits and an add-to-cart button.
export function TreeCard({ tree, comparing = false, back = "/trees", layout = "grid", rating }: { tree: T; comparing?: boolean; back?: string; layout?: "grid" | "list"; rating?: { avg: number; count: number } }) {
  const sorted = [...tree.products].sort((a, b) => a.priceBdt - b.priceBdt);
  const cheapest = sorted[0];
  const buyable = sorted.find((p) => p.stock > 0);
  const stockLeft = sorted.reduce((n, p) => n + p.stock, 0);
  const sun = splitList(tree.sunlight)[0];
  const list = layout === "list";
  const kind = KIND[splitList(tree.purposes)[0] ?? ""];

  const compare = (
    <form action={toggleCompare} className="absolute right-2.5 top-2.5 z-10">
      <input type="hidden" name="slug" value={tree.slug} />
      <button
        aria-pressed={comparing}
        aria-label={comparing ? `Remove ${tree.name} from comparison` : `Add ${tree.name} to comparison`}
        title={comparing ? "In comparison" : "Add to comparison"}
        className={`grid h-8 w-8 place-items-center rounded-full text-sm shadow-sm ring-1 ring-black/5 transition active:scale-90 ${comparing ? "bg-lime-500 text-white" : "bg-white/95 text-forest-700 hover:bg-white hover:text-lime-600"}`}
      >
        {comparing ? "✓" : <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M7 7h12l-3-3M17 17H5l3 3" /></svg>}
      </button>
    </form>
  );

  const button = buyable ? (
    <form action={addToCart} className={list ? "" : "mt-3"}>
      <input type="hidden" name="productId" value={buyable.id} />
      <input type="hidden" name="back" value={back} />
      <button aria-label={`Add ${tree.name} to cart`} className="flex w-full items-center justify-center gap-2 rounded-md bg-[#183d27] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#1d5b33] active:scale-[0.97]">
        <CartIcon /> Add to cart
      </button>
    </form>
  ) : (
    <Link href={`/trees/${tree.slug}`} className={`${list ? "" : "mt-3"} flex w-full items-center justify-center rounded-md border border-stone-200 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-mint-50`}>
      {cheapest ? "Out of stock · details" : "View details"}
    </Link>
  );

  return (
    <div className={`tree-card group relative flex overflow-hidden rounded-lg bg-white shadow-[0_1px_2px_rgb(0_0_0/0.04),0_8px_1.5rem_-0.9rem_rgb(28_29_26/0.25)] ring-1 ring-stone-200/70 transition duration-300 hover:-translate-y-1 hover:shadow-[0_1.125rem_2.5rem_-1rem_rgb(28_29_26/0.35)] ${list ? "flex-row gap-4 p-2.5" : "h-full flex-col"}`}>
      <div className={`relative shrink-0 ${list ? "w-36 sm:w-44" : ""}`}>
        {compare}
        <Link href={`/trees/${tree.slug}`} className={`block overflow-hidden bg-gradient-to-b from-mint-50 to-mint-100 ${list ? "h-full min-h-36 rounded-md" : "aspect-[4/2.3]"}`} tabIndex={-1} aria-hidden>
          <TreeArt shape={tree.shape} color={tree.color} name={tree.name} imageUrl={treePhoto({ slug: tree.slug, imageUrl: tree.imageUrl, products: tree.products.map((p) => ({ imageUrl: p.imageUrl ?? null })) })} className="transition duration-500 group-hover:scale-105" />
        </Link>
        {buyable && stockLeft <= 5 && <span className="absolute left-2.5 top-2.5 rounded-full bg-red-500 px-2 py-0.5 text-[0.625rem] font-semibold text-white shadow">Only {stockLeft} left</span>}
      </div>
      <div className={`flex flex-1 flex-col ${list ? "py-1 pr-2" : "px-2.5 pb-2.5 pt-2.5"}`}>
        <Link href={`/trees/${tree.slug}`} className="block">
          <h3 className="text-[0.9375rem] font-semibold leading-snug text-forest-900 group-hover:text-[#2f6b3f]">{tree.name}</h3>
          <p className="text-xs text-stone-500">{tree.banglaName}</p>
        </Link>
        {rating && rating.count > 0 && (
          <p className="mt-1 flex items-center gap-1 text-[0.6875rem] text-stone-500"><Stars value={rating.avg} size="h-3 w-3" /> <b className="text-forest-900">{rating.avg.toFixed(1)}</b> ({rating.count})</p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-2">
          <p className="text-base font-bold text-forest-900">
            {cheapest ? <>{sorted.length > 1 && <span className="mr-1 text-xs font-normal text-stone-500">from</span>}{taka(cheapest.priceBdt)}</> : <span className="text-sm font-normal text-stone-500">Not on sale yet</span>}
          </p>
          {kind && <span className="inline-flex items-center gap-1 text-[0.6875rem] text-stone-500"><LeafIcon />{kind}</span>}
        </div>
        <div className="mt-1 flex flex-col items-start gap-1 text-[0.6875rem] text-stone-600">
          {sun && <span className="inline-flex items-center gap-1 text-stone-600"><span className="text-amber-600"><SunIcon /></span>{label(sun)}</span>}
          <span className="inline-flex items-center gap-1 rounded bg-[#eef0e6] px-1.5 py-0.5 text-forest-800"><HomeIcon className="h-3 w-3" />{spaceTag(tree.canopySpreadM)}</span>
          {list && <span className="inline-flex items-center rounded bg-stone-100 px-1.5 py-0.5">{tree.matureHeightM} m tall</span>}
        </div>
        <div className={list ? "mt-auto max-w-xs pt-3" : "mt-auto"}>{button}</div>
      </div>
    </div>
  );
}
