import "server-only";
import { cookies } from "next/headers";

export const COMPARE_COOKIE = "gaach_compare";
export const MAX_COMPARE = 3;

export async function readCompare(): Promise<string[]> {
  const jar = await cookies();
  const raw = jar.get(COMPARE_COOKIE)?.value ?? "";
  return raw.split(",").filter((s) => /^[a-z0-9-]{1,60}$/.test(s)).slice(0, MAX_COMPARE);
}
