import { db } from "@/lib/db";
import { DEFAULT_DELIVERY_FEE, DELIVERY_FEE_KEY } from "@/lib/constants";

// One flat delivery fee, maintained by admins (FR-5.3, FR-8.4).
export async function getDeliveryFee(): Promise<number> {
  const row = await db.setting.findUnique({ where: { key: DELIVERY_FEE_KEY } });
  const n = Number(row?.value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : DEFAULT_DELIVERY_FEE;
}
