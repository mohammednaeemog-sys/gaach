import Link from "next/link";
import { Logo } from "./Logo";
import { HeaderShell } from "./HeaderShell";
import { getCurrentUser } from "@/modules/accounts/session";
import { db } from "@/lib/db";
import { logout } from "@/modules/accounts/actions";

function CartIcon() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="inline h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 4h2l2.4 11.2a2 2 0 0 0 2 1.6h7.7a2 2 0 0 0 2-1.5L21 8H6.2" />
      <circle cx="10" cy="20" r="1.3" /><circle cx="17" cy="20" r="1.3" />
    </svg>
  );
}

export async function Header() {
  const user = await getCurrentUser();
  const cartCount = user
    ? (await db.cartItem.aggregate({ where: { userId: user.id }, _sum: { quantity: true } }))._sum.quantity ?? 0
    : 0;

  const links = [
    { href: "/recommend", label: "Find trees" },
    { href: "/trees", label: "Browse" },
    { href: "/compare", label: "Compare" },
    { href: "/assistant", label: "Tree Advisor" },
    { href: "/guides", label: "Guides" },
  ];
  const accountLinks = user
    ? [
        { href: "/my-trees", label: "My trees" },
        { href: "/orders", label: "Orders" },
        { href: "/account", label: "Profile & sites" },
        ...(user.role === "ADMIN" ? [{ href: "/admin", label: "Admin" }] : []),
      ]
    : [];

  return (
    <HeaderShell>
      <div className="mx-auto flex h-16 max-w-[87.5rem] items-center gap-4 px-4 sm:px-6 lg:px-10">
        <Link href="/" aria-label="Gaach home" className="logo-hover flex items-center text-base">
          <Logo size={40} />
        </Link>
        <nav className="hidden items-center gap-0.5 lg:flex xl:gap-1">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="whitespace-nowrap rounded-full px-2.5 py-2 text-sm font-medium text-mint-100 transition hover:bg-white/10 hover:text-lime-400 xl:px-3.5">
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <form action="/trees" method="get" role="search" className="header-search hidden items-center gap-2 rounded-full bg-white/10 px-4 py-2 ring-1 ring-white/25 backdrop-blur focus-within:bg-white/15 2xl:flex">
            <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0 text-white/80" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></svg>
            <label htmlFor="header-q" className="sr-only">Search trees</label>
            <input id="header-q" name="q" type="search" placeholder="Search trees, e.g. Mango" className="w-44 bg-transparent text-sm text-white outline-none placeholder:text-white/60" />
          </form>
          <Link href="/cart" className="relative rounded-full px-3 py-2 text-sm font-medium text-mint-100 transition hover:bg-white/10" aria-label={`Cart, ${cartCount} items`}>
            <CartIcon /> <span className="hidden sm:inline">Cart</span>
            {cartCount > 0 && (
              <span className="absolute -right-1 -top-0.5 rounded-full bg-lime-500 px-1.5 text-xs font-bold text-forest-900">{cartCount}</span>
            )}
          </Link>
          {!user && (
            <>
              <Link href="/login" className="btn hidden whitespace-nowrap text-mint-100 hover:bg-white/10 sm:inline-flex lg:hidden xl:inline-flex">Log in</Link>
              <Link href="/register" className="btn-primary hidden whitespace-nowrap sm:inline-flex">Sign up</Link>
            </>
          )}
          {/* One menu button (three lines) for everything else */}
          <details className="menu relative">
            <summary className="menu-button grid h-10 w-10 cursor-pointer list-none place-items-center rounded-full text-mint-100 transition hover:bg-white/10" aria-label="Menu">
              <span className="menu-lines" aria-hidden><span /><span /><span /></span>
            </summary>
            <div className="menu-panel absolute right-0 mt-2 w-60 rounded-2xl border border-stone-100 bg-white p-1.5 text-stone-800 shadow-xl">
              {user && (
                <div className="mb-1 flex items-center gap-3 border-b border-stone-100 px-3 pb-3 pt-2">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-mint-100 text-sm font-bold uppercase text-forest-700">{user.name.trim().charAt(0) || "?"}</span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold">{user.name}</span>
                    <span className="block truncate text-xs text-stone-500">{user.email}</span>
                  </span>
                </div>
              )}
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="block rounded-xl px-3 py-2 text-sm hover:bg-mint-100 lg:hidden">{l.label}</Link>
              ))}
              {user ? (
                <>
                  {accountLinks.map((l) => (
                    <Link key={l.href} href={l.href} className="block rounded-xl px-3 py-2 text-sm hover:bg-mint-100">{l.label}</Link>
                  ))}
                  <form action={logout}>
                    <button className="block w-full rounded-xl px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50">Log out</button>
                  </form>
                </>
              ) : (
                <>
                  <Link href="/login" className="block rounded-xl px-3 py-2 text-sm hover:bg-mint-100">Log in</Link>
                  <Link href="/register" className="block rounded-xl px-3 py-2 text-sm font-semibold text-lime-600 hover:bg-mint-100">Sign up</Link>
                </>
              )}
            </div>
          </details>
        </div>
      </div>
    </HeaderShell>
  );
}
