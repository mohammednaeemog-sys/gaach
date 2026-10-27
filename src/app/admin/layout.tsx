import Link from "next/link";
import { requireAdmin } from "@/modules/accounts/session";

export const metadata = { title: { default: "Admin", template: "%s | Gaach admin" } };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  const links = [
    ["/admin", "Overview"],
    ["/admin/trees", "Trees & products"],
    ["/admin/orders", "Orders"],
    ["/admin/users", "Users"],
    ["/admin/reviews", "Reviews"],
    ["/admin/site", "Site info & messages"],
    ["/admin/reference", "Regions & delivery"],
    ["/admin/knowledge", "Care guides"],
    ["/admin/ai", "AI status & review"],
  ];
  return (
    <div>
      <nav className="mb-6 flex gap-1 overflow-x-auto rounded-xl bg-forest-900 p-1">
        {links.map(([href, text]) => (
          <Link key={href} href={href} className="whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium text-mint-100 hover:bg-white/10">{text}</Link>
        ))}
      </nav>
      {children}
    </div>
  );
}
