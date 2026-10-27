import type { CareStageKey } from "@/lib/constants";

// Which care stage a tree is in, counted from the day it was planted (FR-6.2).
export function currentStage(plantedAt: Date | null, now = new Date()): { stage: CareStageKey; days: number | null } {
  if (!plantedAt) return { stage: "PLANTING_DAY", days: null };
  const days = Math.floor((now.getTime() - plantedAt.getTime()) / 86_400_000);
  if (days < 1) return { stage: "PLANTING_DAY", days };
  if (days <= 7) return { stage: "FIRST_WEEK", days };
  if (days <= 120) return { stage: "FIRST_SEASON", days };
  return { stage: "ONGOING", days };
}

export function stageSummary(plantedAt: Date | null): string {
  const { stage, days } = currentStage(plantedAt);
  if (days === null) return "Not planted yet. Follow the planting day steps.";
  if (stage === "PLANTING_DAY") return "Planted today.";
  return `Planted ${days} day${days === 1 ? "" : "s"} ago.`;
}
