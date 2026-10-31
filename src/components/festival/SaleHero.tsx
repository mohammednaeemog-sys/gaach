import { livePromotions } from "@/modules/shop/pricing";
import { FestivalBanner } from "./FestivalBanner";

// The big festival banner for the sale that's on now (the biggest discount first)
export async function SaleHero({ className = "" }: { className?: string }) {
  const sale = (await livePromotions()).find((p) => p.heroBanner !== false);
  if (!sale) return null;
  return (
    <div className={className}>
      <FestivalBanner
        sale={{ name: sale.name, badge: sale.badge, percentOff: sale.percentOff, message: sale.message ?? "", theme: sale.theme ?? "general", startsAt: sale.startsAt?.toISOString() ?? null, endsAt: sale.endsAt?.toISOString() ?? null, imageUrl: sale.imageUrl, imageOnly: sale.imageOnly, allTrees: sale.allTrees }}
      />
    </div>
  );
}
