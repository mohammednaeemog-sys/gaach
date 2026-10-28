import { db } from "@/lib/db";
import { requireAdmin } from "@/modules/accounts/session";
import { AdminResetForm, AdminTestEmailForm } from "@/components/forms/AuthForms";
import { mailConfigured } from "@/lib/mail";
import { dateText } from "@/lib/format";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
  const emails = await db.emailLog.findMany({ orderBy: { createdAt: "desc" }, take: 10 });
  const users = await db.user.findMany({ orderBy: { createdAt: "desc" }, take: 50, select: { id: true, name: true, email: true, role: true, createdAt: true } });
  return (
    <div className="space-y-6">
      <h1 className="page-title">Users</h1>
      <section className="card p-5">
        <h2 className="font-semibold text-forest-900">Email sending</h2>
        <p className="mb-4 mt-1 text-sm text-stone-600">
          {mailConfigured()
            ? "Gmail details are set. Send a test to make sure they work. If it fails, the reason shows here."
            : "Not set up: add SMTP_USER and SMTP_PASS to .env, then stop and restart the site. Until then, reset links only print in the terminal."}
        </p>
        <AdminTestEmailForm defaultTo={admin.email} />
      </section>
      <section className="card p-5">
        <h2 className="font-semibold text-forest-900">Help someone who forgot their password</h2>
        <p className="mb-4 mt-1 text-sm text-stone-600">
          Users get the reset email automatically when they press &quot;Forgot password?&quot; on the log in page. You don&apos;t need to do anything.
          {" "}To send one for them, type their email below and the site emails them the link directly.
        </p>
        <AdminResetForm />
      </section>
      <section className="card overflow-x-auto p-5">
        <h2 className="font-semibold text-forest-900">Recent emails</h2>
        <p className="mb-3 mt-1 text-sm text-stone-600">Every email the site tried to send. &quot;Sent&quot; means Gmail accepted it; if the person can&apos;t find it, it is in their Spam or Promotions folder.</p>
        {emails.length === 0 ? <p className="text-sm text-stone-500">No emails yet.</p> : (
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase tracking-wider text-stone-500"><tr><th className="py-2">To</th><th>Subject</th><th>Result</th><th>When</th></tr></thead>
            <tbody className="divide-y divide-stone-100">
              {emails.map((m) => (
                <tr key={m.id}>
                  <td className="py-2 pr-3">{m.to}</td>
                  <td className="pr-3">{m.subject}</td>
                  <td className="pr-3">{m.ok ? <span className="font-medium text-forest-700">Sent</span> : <span className="text-red-700" title={m.error ?? ""}>Failed: {m.error}</span>}</td>
                  <td className="whitespace-nowrap">{m.createdAt.toLocaleString("en-GB", { timeZone: "Asia/Dhaka", dateStyle: "medium", timeStyle: "short" })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
      <section className="card overflow-x-auto p-5">
        <h2 className="mb-3 font-semibold text-forest-900">Newest accounts</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase tracking-wider text-stone-500"><tr><th className="py-2">Name</th><th>Email</th><th>Role</th><th>Joined</th></tr></thead>
          <tbody className="divide-y divide-stone-100">
            {users.map((u) => (
              <tr key={u.id}><td className="py-2 pr-3">{u.name}</td><td className="pr-3">{u.email}</td><td className="pr-3">{u.role === "ADMIN" ? "Admin" : "User"}</td><td>{dateText(u.createdAt)}</td></tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
