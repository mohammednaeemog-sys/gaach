import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { deleteTree } from "@/modules/admin/actions";
import { TreeForm } from "@/components/admin/TreeForm";
import { ProductForm } from "@/components/admin/ProductForm";
import { CareStageForm } from "@/components/admin/CareStageForm";
import { CARE_STAGES, label } from "@/lib/constants";
import { ConfirmButton } from "@/components/ConfirmButton";

export const metadata = { title: "Edit tree" };

export default async function EditTree({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const sp = await searchParams;
  const tree = await db.tree.findUnique({ where: { id }, include: { products: { orderBy: { createdAt: "asc" } }, careStages: true } });
  if (!tree) notFound();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="page-title">{tree.name}</h1>
        {tree.published && <Link href={`/trees/${tree.slug}`} className="btn-ghost">View on site →</Link>}
      </div>
      {sp.created && <p className="rounded-lg bg-mint-50 p-3 text-sm text-forest-700">Tree created. Add products and care instructions below.</p>}
      {sp.incomplete && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Fill in every attribute before publishing this tree.</p>}
      {sp.cannotDelete && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">This tree has been sold before, so it cannot be deleted without losing order history. Unpublish it instead.</p>}

      <section className="card p-5"><TreeForm t={tree} /></section>

      <section id="products" className="card scroll-mt-20 space-y-3 p-5">
        <h2 className="font-semibold text-forest-900">Products (price, stock, plant size, photo)</h2>
        <p className="text-xs text-stone-500">Each size can have its own photo. Sizes without one show the tree&apos;s main photo from the form above.</p>
        {tree.products.map((p) => <ProductForm key={p.id} treeId={tree.id} p={p} treeImage={tree.imageUrl} />)}
        <p className="pt-2 text-sm font-medium text-stone-700">Add a product</p>
        <ProductForm treeId={tree.id} treeImage={tree.imageUrl} />
      </section>

      <section className="card space-y-3 p-5">
        <h2 className="font-semibold text-forest-900">Care instructions by stage</h2>
        {CARE_STAGES.map((s) => (
          <CareStageForm key={s} treeId={tree.id} stage={s} stageLabel={label(s)} s={tree.careStages.find((c) => c.stage === s)} />
        ))}
      </section>

      <section className="card border-red-200 p-5">
        <h2 className="font-semibold text-red-800">Delete tree</h2>
        <p className="mb-3 text-sm text-stone-600">Deletes the tree, its products and care plan. Trees that have been ordered can only be unpublished.</p>
        <form action={deleteTree}>
          <input type="hidden" name="id" value={tree.id} />
          <ConfirmButton className="btn-danger" message={`Delete ${tree.name} permanently?`}>Delete permanently</ConfirmButton>
        </form>
      </section>
    </div>
  );
}
