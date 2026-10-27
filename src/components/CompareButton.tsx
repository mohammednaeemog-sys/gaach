import { toggleCompare } from "@/modules/catalogue/compare";

export function CompareButton({ slug, active, small }: { slug: string; active: boolean; small?: boolean }) {
  return (
    <form action={toggleCompare}>
      <input type="hidden" name="slug" value={slug} />
      <button className={`${active ? "btn-primary" : "btn-secondary"} ${small ? "px-3 py-1.5 text-xs" : ""}`} aria-pressed={active}>
        {active ? "✓ In comparison" : "+ Compare"}
      </button>
    </form>
  );
}
