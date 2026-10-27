import { label } from "@/lib/constants";

const STYLE: Record<string, string> = {
  PLACED: "bg-sky-50 text-sky-800 ring-sky-200",
  SHIPPED: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  DELIVERED: "bg-mint-50 text-forest-700 ring-mint-200",
  CANCELLED: "bg-stone-100 text-stone-700 ring-stone-200",
  PAID: "bg-mint-50 text-forest-700 ring-mint-200",
  PENDING: "bg-amber-50 text-amber-800 ring-amber-200",
  FAILED: "bg-red-50 text-red-800 ring-red-200",
};

export function StatusChip({ value }: { value: string }) {
  return <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ${STYLE[value] ?? STYLE.CANCELLED}`}>{label(value)}</span>;
}
