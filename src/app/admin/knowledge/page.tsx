import Link from "next/link";
import { db } from "@/lib/db";
import { setGuideReview, setTreeReview } from "@/modules/admin/actions";
import { dateText } from "@/lib/format";

export const metadata = { title: "Care guides" };

// Provenance and review status of what the assistant is allowed to use
export default async function KnowledgeAdmin() {
  const [guides, trees] = await Promise.all([
    db.careGuide.findMany({ orderBy: [{ status: "asc" }, { title: "asc" }] }),
    db.tree.findMany({ orderBy: [{ reviewStatus: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true, sourceTitle: true, reviewStatus: true, reviewedAt: true } }),
  ]);
  const reviewedGuides = guides.filter((g) => g.status === "REVIEWED").length;
  const reviewedTrees = trees.filter((t) => t.reviewStatus === "REVIEWED").length;
  return (
    <div className="space-y-8">
      <div>
        <h1 className="page-title">Care guides and tree facts</h1>
        <p className="mt-1 max-w-3xl text-sm text-stone-600">
          The Tree Advisor answers care questions only from these guides and the tree records. Each guide names the publisher it follows. Ask someone competent in tree care to compare each guide with its source, then mark it reviewed. Until then the assistant tells users the guidance has not been expert-checked.
        </p>
        <p className="mt-2 text-sm font-medium text-forest-800">{reviewedGuides} of {guides.length} guides reviewed · {reviewedTrees} of {trees.length} tree records reviewed</p>
      </div>

      <section className="card overflow-x-auto">
        <table className="table">
          <thead><tr><th>Guide</th><th>Applies to</th><th>Source</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {guides.map((g) => (
              <tr key={g.id}>
                <td><Link href={`/guides/${g.slug}`} className="font-medium text-forest-800 hover:underline">{g.title}</Link><div className="text-xs text-stone-500">{g.topic}</div></td>
                <td className="text-xs">{g.species || "All trees"}{g.stage ? ` · ${g.stage}` : ""}</td>
                <td className="max-w-xs text-xs"><a href={g.sourceUrl} target="_blank" rel="noreferrer" className="hover:underline">{g.sourceTitle}</a></td>
                <td className="whitespace-nowrap text-xs">
                  {g.status === "REVIEWED" ? <span className="rounded-full bg-mint-100 px-2 py-0.5 text-forest-800">Reviewed {g.reviewedAt ? dateText(g.reviewedAt) : ""}</span> : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">Not reviewed</span>}
                  {g.reviewNote && <div className="mt-1 max-w-[14rem] whitespace-normal text-stone-500">{g.reviewNote}</div>}
                </td>
                <td>
                  <form action={setGuideReview} className="flex items-center gap-1">
                    <input type="hidden" name="id" value={g.id} />
                    {g.status === "REVIEWED" ? (
                      <><input type="hidden" name="reviewed" value="0" /><button className="btn-ghost px-2 py-1 text-xs">Mark not reviewed</button></>
                    ) : (
                      <><input type="hidden" name="reviewed" value="1" /><input name="note" placeholder="Reviewer and note" className="input w-40 py-1 text-xs" /><button className="btn-secondary px-2 py-1 text-xs">Mark reviewed</button></>
                    )}
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 font-semibold text-forest-900">Tree records</h2>
        <div className="card overflow-x-auto">
          <table className="table">
            <thead><tr><th>Tree</th><th>Source</th><th>Status</th><th></th></tr></thead>
            <tbody>
              {trees.map((t) => (
                <tr key={t.id}>
                  <td><Link href={`/admin/trees/${t.id}`} className="font-medium text-forest-800 hover:underline">{t.name}</Link></td>
                  <td className="max-w-sm text-xs">{t.sourceTitle || "Not recorded"}</td>
                  <td className="whitespace-nowrap text-xs">{t.reviewStatus === "REVIEWED" ? <span className="rounded-full bg-mint-100 px-2 py-0.5 text-forest-800">Reviewed {t.reviewedAt ? dateText(t.reviewedAt) : ""}</span> : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-800">Not reviewed</span>}</td>
                  <td>
                    <form action={setTreeReview}>
                      <input type="hidden" name="id" value={t.id} />
                      <input type="hidden" name="reviewed" value={t.reviewStatus === "REVIEWED" ? "0" : "1"} />
                      <button className="btn-ghost px-2 py-1 text-xs">{t.reviewStatus === "REVIEWED" ? "Mark not reviewed" : "Mark reviewed"}</button>
                    </form>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
