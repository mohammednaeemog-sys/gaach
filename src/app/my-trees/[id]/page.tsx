import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { currentStage, stageSummary } from "@/modules/care/stage";
import { setPlantedDate } from "@/modules/care/actions";
import { TreeArt } from "@/components/TreeArt";
import { treePhoto } from "@/lib/photo";
import { CARE_STAGES, label } from "@/lib/constants";

export const metadata = { title: "Care plan" };

export default async function OwnedTreePage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/my-trees");
  const { id } = await params;
  const owned = await db.ownedTree.findFirst({ where: { id, userId: user.id }, include: { tree: { include: { careStages: true, products: { where: { active: true }, select: { imageUrl: true } } } } } });
  if (!owned) notFound();
  const { stage } = currentStage(owned.plantedAt);
  const stages = CARE_STAGES.map((s) => owned.tree.careStages.find((c) => c.stage === s)).filter((s) => !!s);
  const current = stages.find((s) => s.stage === stage);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <nav className="text-sm text-stone-500"><Link href="/my-trees" className="hover:text-lime-600">My trees</Link> / {owned.nickname || owned.tree.name}</nav>
      <div className="card flex flex-col gap-4 p-5 sm:flex-row">
        <div className="h-32 w-full overflow-hidden rounded-2xl bg-mint-100 sm:w-40"><TreeArt shape={owned.tree.shape} color={owned.tree.color} name={owned.tree.name} imageUrl={treePhoto(owned.tree)} /></div>
        <div className="flex-1">
          <h1 className="page-title">{owned.nickname || owned.tree.name}</h1>
          <p className="text-sm text-stone-600">{owned.tree.name} · {owned.tree.banglaName}{owned.quantity > 1 && ` · ${owned.quantity} plants`}</p>
          <p className="mt-2 text-sm">{stageSummary(owned.plantedAt)} <span className="chip">Current stage: {label(stage)}</span></p>
          <form action={setPlantedDate} className="mt-3 flex flex-wrap items-end gap-2">
            <input type="hidden" name="id" value={owned.id} />
            <div>
              <label htmlFor="plantedAt" className="field-label text-xs">Date planted</label>
              <input id="plantedAt" name="plantedAt" type="date" max={today} defaultValue={owned.plantedAt?.toISOString().slice(0, 10) ?? today} className="input" />
            </div>
            <div>
              <label htmlFor="nickname" className="field-label text-xs">Nickname (optional)</label>
              <input id="nickname" name="nickname" placeholder="e.g. Rooftop mango" defaultValue={owned.nickname} className="input" />
            </div>
            <button className="btn-secondary">{owned.plantedAt ? "Update" : "I planted it"}</button>
          </form>
        </div>
      </div>

      {current && (
        <section className="card border-lime-400 p-5 ring-2 ring-mint-200">
          <p className="text-xs font-semibold uppercase tracking-wider text-lime-600">What to do now</p>
          <h2 className="text-lg font-bold text-forest-900">{label(current.stage)}</h2>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["planting", "watering", "fertilizing", "protection"] as const).map((k) => (
              <div key={k} className="rounded-lg bg-mint-50 p-3">
                <dt className="text-sm font-semibold capitalize text-forest-700">{k === "planting" ? "Planting and upkeep" : k}</dt>
                <dd className="mt-1 text-sm text-stone-800">{current[k]}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      <section className="card p-5">
        <h2 className="font-semibold text-forest-900">Something wrong with your tree?</h2>
        <p className="mb-3 text-sm text-stone-600">Describe the problem and the assistant will help, using this tree&apos;s care plan.</p>
        <form action="/assistant" method="get" className="flex flex-col gap-2 sm:flex-row">
          <input type="hidden" name="owned" value={owned.id} />
          <label htmlFor="q" className="sr-only">Problem</label>
          <input id="q" name="q" required maxLength={500} className="input flex-1" placeholder="e.g. The leaves are turning yellow" />
          <button className="btn-primary">Ask the assistant</button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold text-forest-900">Full care plan</h2>
        <div className="space-y-2">
          {stages.map((s) => (
            <details key={s.stage} className="rounded-lg border border-stone-200 p-3" open={s.stage === stage}>
              <summary className="cursor-pointer font-medium text-forest-700">{label(s.stage)} {s.stage === stage && <span className="chip ml-2">Now</span>}</summary>
              <dl className="mt-2 space-y-2 text-sm">
                {(["planting", "watering", "fertilizing", "protection"] as const).map((k) => (
                  <div key={k}><dt className="font-semibold capitalize text-stone-700">{k}</dt><dd>{s[k]}</dd></div>
                ))}
              </dl>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
