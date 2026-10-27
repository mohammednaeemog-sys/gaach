import { db } from "@/lib/db";
import { deleteRefusal } from "@/modules/admin/actions";
import { aiConfigured, checkConnection, modelName, providerLabel } from "@/modules/assistant/ai";
import { dateText } from "@/lib/format";

export const metadata = { title: "AI status & review" };

export default async function AiReview({ searchParams }: { searchParams: Promise<{ test?: string }> }) {
  const { test } = await searchParams;
  const since = new Date(Date.now() - 30 * 86_400_000);
  const [items, asked, answers] = await Promise.all([
    db.refusedQuestion.findMany({ orderBy: { createdAt: "desc" }, take: 300, include: { user: true } }),
    db.chatMessage.findMany({ where: { role: "user", createdAt: { gte: since } }, select: { intent: true } }),
    db.chatMessage.findMany({ where: { role: "assistant", createdAt: { gte: since } }, select: { tools: true } }),
  ]);
  const status = test ? await checkConnection() : null;
  const count = (list: string[]) => Object.entries(list.reduce<Record<string, number>>((a, k) => ({ ...a, [k]: (a[k] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]);
  const intents = count(asked.map((m) => m.intent || "not recorded"));
  const tools = count(answers.flatMap((m) => m.tools.split(",").filter(Boolean)));

  return (
    <div className="space-y-8">
      <section className="card p-5">
        <h1 className="page-title">AI status</h1>
        <p className="mt-2 text-sm text-stone-700">
          AI service: <b>{providerLabel()}</b>{aiConfigured() && <> · Model: <b>{modelName()}</b></>}
        </p>
        {!aiConfigured() && (
          <p className="mt-2 rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            For free AI answers, get a free key at <a className="underline" href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">aistudio.google.com/apikey</a> and add <code>GEMINI_API_KEY=&quot;your key&quot;</code> to the .env file, then restart the site.
          </p>
        )}
        <p className="mt-1 text-sm text-stone-600">Without a working key the Tree Advisor still answers from Gaach&apos;s data using the same tools, with plainer wording.</p>
        <form className="mt-3"><input type="hidden" name="test" value="1" /><button className="btn-secondary">Test the AI connection</button></form>
        {status && (
          status.ok ? (
            <p className="mt-3 rounded-xl bg-mint-50 p-3 text-sm text-forest-800">✓ Connected. {status.model} answered in {status.ms} ms.</p>
          ) : (
            <div className="mt-3 rounded-xl bg-red-50 p-3 text-sm text-red-900">
              <p className="font-medium">✗ {status.problem}</p>
              <p className="mt-1 break-words font-mono text-xs">{status.detail}</p>
            </div>
          )
        )}
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="card p-5">
          <h2 className="font-semibold text-forest-900">Questions by intent (30 days)</h2>
          {intents.length ? <ul className="mt-2 space-y-1 text-sm">{intents.map(([k, n]) => <li key={k} className="flex justify-between"><span>{k.replace(/_/g, " ")}</span><span className="font-medium">{n}</span></li>)}</ul> : <p className="mt-2 text-sm text-stone-500">No questions yet.</p>}
        </div>
        <div className="card p-5">
          <h2 className="font-semibold text-forest-900">Tools used (30 days)</h2>
          {tools.length ? <ul className="mt-2 space-y-1 text-sm">{tools.map(([k, n]) => <li key={k} className="flex justify-between"><span className="font-mono text-xs">{k}</span><span className="font-medium">{n}</span></li>)}</ul> : <p className="mt-2 text-sm text-stone-500">No tool calls yet.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold text-forest-900">Refused questions</h2>
        <p className="mb-3 mt-1 text-sm text-stone-600">Questions the assistant declined. If real tree questions show up here, add the missing trees or care guides.</p>
        {items.length === 0 ? (
          <div className="card p-8 text-center text-stone-600">No refused questions yet.</div>
        ) : (
          <div className="card overflow-x-auto">
            <table className="table">
              <thead><tr><th>Question</th><th>Why</th><th>User</th><th>Date</th><th></th></tr></thead>
              <tbody>
                {items.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-xl whitespace-pre-wrap break-words">{r.question}</td>
                    <td className="text-xs">{r.reason || "off-topic"}</td>
                    <td className="text-xs">{r.user?.email ?? "Deleted user"}</td>
                    <td className="whitespace-nowrap text-xs">{dateText(r.createdAt)}</td>
                    <td><form action={deleteRefusal}><input type="hidden" name="id" value={r.id} /><button className="btn-ghost px-2 py-1 text-xs">Dismiss</button></form></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
