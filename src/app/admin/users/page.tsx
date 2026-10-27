import { db } from "@/lib/db";
import { requireAdmin } from "@/modules/accounts/session";
import { AdminResetForm, AdminTestEmailForm } from "@/components/forms/AuthForms";
import { mailConfigured } from "@/lib/mail";
import { dateText } from "@/lib/format";

export const metadata = { title: "Users" };

export default async function AdminUsersPage() {
  const admin = await requireAdmin();
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
          Users can reset it themselves from &quot;Forgot password?&quot; on the log in page.
          {mailConfigured() ? "" : " Email sending is not set up yet (SMTP_USER and SMTP_PASS in .env), so those links only appear in the server console."}
          {" "}If they can&apos;t get the email, make a link here and send it to them yourself.
        </p>
        <AdminResetForm />
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
