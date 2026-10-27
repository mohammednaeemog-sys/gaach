import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { currentStage, stageSummary } from "@/modules/care/stage";
import { TreeArt } from "@/components/TreeArt";
import { treePhoto } from "@/lib/photo";
import { label } from "@/lib/constants";

export const metadata = { title: "My trees" };

export default async function MyTreesPage() {
  const user = await requireUser("/my-trees");
  const owned = await db.ownedTree.findMany({
    where: { userId: user.id, order: { status: { not: "CANCELLED" } } },
    include: { tree: { include: { products: { where: { active: true }, select: { imageUrl: true } } } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <div>
      <h1 className="page-title">My trees</h1>
      <p className="mt-1 text-sm text-stone-600">Every tree you buy shows up here with a care plan for its current stage.</p>
      {owned.length === 0 ? (
        <div className="card mt-5 p-8 text-center text-stone-600">
          You have not bought any trees yet. <Link href="/recommend" className="font-semibold text-lime-600">Find trees for your place</Link>
        </div>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {owned.map((o) => (
            <li key={o.id}>
              <Link href={`/my-trees/${o.id}`} className="card flex gap-3 overflow-hidden p-3 hover:shadow-md">
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-mint-100"><TreeArt shape={o.tree.shape} color={o.tree.color} name={o.tree.name} imageUrl={treePhoto(o.tree)} /></div>
                <div>
                  <p className="font-semibold text-forest-900">{o.nickname || o.tree.name}{o.quantity > 1 && ` × ${o.quantity}`}</p>
                  <p className="text-xs text-stone-500">{stageSummary(o.plantedAt)}</p>
                  <span className="chip mt-2">Stage: {label(currentStage(o.plantedAt).stage)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
