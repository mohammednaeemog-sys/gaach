import { db } from "@/lib/db";
import { getSiteInfo } from "@/modules/site/info";
import { removeSubscriber, updateContactMessage } from "@/modules/site/actions";
import { SiteInfoForm } from "@/components/admin/SiteInfoForm";

export const metadata = { title: "Site info and messages" };

const when = (d: Date) => d.toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Dhaka" });

export default async function SiteAdminPage() {
  const [info, messages, open, subscribers, subCount] = await Promise.all([
    getSiteInfo(),
    db.contactMessage.findMany({ orderBy: [{ handled: "asc" }, { createdAt: "desc" }], take: 50 }),
    db.contactMessage.count({ where: { handled: false } }),
    db.subscriber.findMany({ orderBy: { createdAt: "desc" }, take: 200 }),
    db.subscriber.count(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="page-title">Site info and messages</h1>

      <section className="card p-5">
        <h2 className="font-semibold text-forest-900">Contact details</h2>
        <p className="mb-4 mt-1 text-sm text-stone-600">Shown in the footer on every page and on the Contact page. Leave a box empty to hide it.</p>
        <SiteInfoForm info={info} />
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-forest-900">Messages from the Contact page {open > 0 && <span className="ml-1 rounded-full bg-lime-500 px-2 py-0.5 text-xs text-white">{open} new</span>}</h2>
        <p className="mb-3 mt-1 text-sm text-stone-600">When email is set up, each message is also sent to the contact email above (or your Gmail). Reply by email or phone, then mark it done.</p>
        {messages.length === 0 ? (
          <p className="text-sm text-stone-500">No messages yet.</p>
        ) : (
          <ul className="divide-y divide-stone-100">
            {messages.map((m) => (
              <li key={m.id} className={`py-3 ${m.handled ? "opacity-60" : ""}`}>
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
                  <span className="font-semibold text-forest-900">{m.name}</span>
                  <a href={`mailto:${m.email}?subject=${encodeURIComponent("Re: your message to Gaach")}`} className="text-forest-700 underline">{m.email}</a>
                  {m.phone && <a href={`tel:${m.phone}`} className="text-forest-700">{m.phone}</a>}
                  <span className="rounded-full bg-mint-50 px-2 py-0.5 text-xs text-forest-700">{m.topic}</span>
                  <span className="ml-auto text-xs text-stone-400">{when(m.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-stone-700">{m.message}</p>
                <div className="mt-2 flex gap-2">
                  <form action={updateContactMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="op" value={m.handled ? "open" : "done"} />
                    <button className="btn-ghost !px-3 !py-1 text-xs">{m.handled ? "Mark as not done" : "Mark done"}</button>
                  </form>
                  <form action={updateContactMessage}>
                    <input type="hidden" name="id" value={m.id} />
                    <input type="hidden" name="op" value="delete" />
                    <button className="rounded-full px-3 py-1 text-xs text-red-700 hover:bg-red-50">Delete</button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-forest-900">Newsletter sign-ups ({subCount})</h2>
        {subscribers.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Nobody has signed up yet.</p>
        ) : (
          <>
            <p className="mb-2 mt-1 text-sm text-stone-600">To email everyone, copy this list into the BCC box of a Gmail message.</p>
            <textarea readOnly rows={3} className="input font-mono text-xs" value={subscribers.map((s) => s.email).join(", ")} />
            <ul className="mt-3 divide-y divide-stone-100 text-sm">
              {subscribers.map((s) => (
                <li key={s.id} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1 truncate">{s.email}</span>
                  <span className="text-xs text-stone-400">{when(s.createdAt)}</span>
                  <form action={removeSubscriber}>
                    <input type="hidden" name="id" value={s.id} />
                    <button className="rounded-full px-2 py-1 text-xs text-red-700 hover:bg-red-50">Remove</button>
                  </form>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>
    </div>
  );
}
