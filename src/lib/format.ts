export function taka(amount: number): string {
  return "৳" + amount.toLocaleString("en-IN");
}

export function dateText(d: Date): string {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
