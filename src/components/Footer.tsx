import Link from "next/link";
import { LogoBadge } from "@/components/Logo";
import { NewsletterForm } from "@/components/NewsletterForm";
import { SocialIcon, type Social } from "@/components/SocialIcons";
import { Stars } from "@/components/Stars";
import { Icon } from "@/components/icons";
import { getSiteInfo, outletList, siteRating, telHref, waHref } from "@/modules/site/info";

const INFO_LINKS = [
  ["/", "Home"],
  ["/about", "About us"],
  ["/contact", "Contact us"],
  ["/recommend", "Find trees for my place"],
  ["/assistant", "Tree Advisor"],
  ["/guides", "Care guides"],
];

const ACCOUNT_LINKS = [
  ["/account", "My account"],
  ["/orders", "My orders"],
  ["/community-guidelines", "Community guidelines"],
  ["/privacy", "Privacy policy"],
  ["/terms", "Terms and conditions"],
  ["/refund-policy", "Refund and return policy"],
];

function Headset({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
      <path d="M10 26v-4a14 14 0 0128 0v4" />
      <rect x="7" y="25" width="7" height="11" rx="3" />
      <rect x="34" y="25" width="7" height="11" rx="3" />
      <path d="M37.5 36v1.5a5 5 0 01-5 5H27" />
      <rect x="21" y="40" width="7" height="5" rx="2.5" />
    </svg>
  );
}

function LinkColumn({ title, links }: { title: string; links: string[][] }) {
  return (
    <nav aria-label={title}>
      <h2 className="foot-title">{title}</h2>
      <ul className="mt-4 space-y-2.5 text-sm">
        {links.map(([href, text]) => (
          <li key={href}><Link href={href} className="foot-link">{text}</Link></li>
        ))}
      </ul>
    </nav>
  );
}

export async function Footer() {
  const [info, rating] = await Promise.all([getSiteInfo(), siteRating()]);
  const outlets = outletList(info.outlets);
  const socials = (
    [
      ["facebook", info.facebook, "Facebook"],
      ["instagram", info.instagram, "Instagram"],
      ["youtube", info.youtube, "YouTube"],
      ["whatsapp", info.whatsapp && waHref(info.whatsapp), "WhatsApp"],
    ] as [Social, string, string][]
  ).filter(([, href]) => href);

  return (
    <footer className="site-footer relative mt-16 overflow-hidden bg-[#0f2a1d] text-[#e4ece4]">
      {/* Faint leaves at both edges */}
      <svg className="foot-leaf foot-leaf-l pointer-events-none absolute -left-16 top-0 h-[26rem] w-60 text-white/[0.045]" viewBox="0 0 120 260" aria-hidden>
        <path d="M20 255 C 30 190, 50 120, 100 20" stroke="currentColor" strokeWidth="2" fill="none" />
        {[[34, 200, -30], [44, 160, 40], [56, 120, -35], [70, 86, 35], [86, 50, -25]].map(([x, y, r], i) => <path key={i} d="M0 0 C 12 -16, 40 -16, 52 0 C 40 16, 12 16, 0 0Z" transform={`translate(${x} ${y}) rotate(${r + (i % 2 ? 180 : 0)})`} fill="currentColor" />)}
      </svg>
      <svg className="foot-leaf foot-leaf-r pointer-events-none absolute -right-14 bottom-0 h-[24rem] w-56 text-white/[0.045]" viewBox="0 0 120 260" style={{ transform: "scaleX(-1)" }} aria-hidden>
        <path d="M20 255 C 30 190, 50 120, 100 20" stroke="currentColor" strokeWidth="2" fill="none" />
        {[[34, 200, -30], [44, 160, 40], [56, 120, -35], [70, 86, 35], [86, 50, -25]].map(([x, y, r], i) => <path key={i} d="M0 0 C 12 -16, 40 -16, 52 0 C 40 16, 12 16, 0 0Z" transform={`translate(${x} ${y}) rotate(${r + (i % 2 ? 180 : 0)})`} fill="currentColor" />)}
      </svg>
      <div className="relative mx-auto grid max-w-[87.5rem] grid-cols-2 gap-x-6 gap-y-10 px-4 sm:px-6 lg:px-10 py-12 lg:grid-cols-[1.35fr_0.95fr_0.95fr_1.25fr]">
        {/* Brand and contact */}
        <div className="col-span-2 space-y-5 lg:col-span-1">
          <Link href="/" className="flex items-center gap-4" aria-label="Gaach home">
            <LogoBadge size={80} className="logo-hover-tilt" />
            <span className="leading-tight"><span className="font-display block text-2xl tracking-wide text-white">GAACH</span><span className="block text-sm tracking-wide text-[#e4ece4]/85">TREES FOR BANGLADESH</span></span>
          </Link>
          <p className="max-w-xs text-[0.9375rem] leading-relaxed text-[#e4ece4]/85">Tree recommendations and healthy saplings for every district of Bangladesh.</p>

          {info.hotline && (
            <a href={telHref(info.hotline)} className="group flex items-center gap-3">
              <Headset className="h-10 w-10 shrink-0 text-[#5cc66a] transition group-hover:scale-105" />
              <span>
                <span className="block text-xs text-[#e4ece4]/80">{info.hotlineNote ? `Hotline - ${info.hotlineNote}` : "Hotline"}</span>
                <span className="block text-lg font-semibold tracking-wide text-white group-hover:text-lime-300">{info.hotline}</span>
              </span>
            </a>
          )}

          {outlets.length > 0 && (
            <div className="flex gap-4 text-sm">
              <Icon.pin className="mt-0.5 h-6 w-6 shrink-0 text-[#5cc66a]" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#5cc66a]">{outlets.length > 1 ? "Our nurseries" : "Our nursery"}</p>
                <ul className="mt-1 space-y-1.5 text-[#e4ece4]/90">
                  {outlets.map((o, i) => <li key={i}>{o.name && <strong className="font-semibold text-white">{o.name}: </strong>}{o.address}</li>)}
                </ul>
              </div>
            </div>
          )}

          <ul className="space-y-2 text-sm text-[#e4ece4]/90">
            {info.email && <li className="flex items-center gap-4"><svg viewBox="0 0 24 24" className="h-6 w-6 shrink-0 text-[#5cc66a]" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" aria-hidden><rect x="3" y="5.5" width="18" height="13" rx="1.5" /><path d="M3.5 6.5l8.5 6.5 8.5-6.5" /></svg><span><span className="text-[#e4ece4]/70">Email: </span><a href={`mailto:${info.email}`} className="foot-link">{info.email}</a></span></li>}
            {info.phone && <li className="flex items-center gap-4"><span className="w-6" aria-hidden /><span><span className="text-[#e4ece4]/70">Phone: </span><a href={telHref(info.phone)} className="foot-link">{info.phone}</a></span></li>}
            {!info.email && !info.phone && !info.hotline && (
              <>
                <li className="flex items-center gap-2"><Icon.truck className="h-4 w-4 text-lime-400" /> Delivery to all 64 districts</li>
                <li className="flex items-center gap-2"><Icon.shield className="h-4 w-4 text-lime-400" /> Cash on delivery</li>
              </>
            )}
          </ul>

        </div>

        <LinkColumn title="Information & services" links={INFO_LINKS} />
        <LinkColumn title="My account & policies" links={ACCOUNT_LINKS} />

        {/* Newsletter and rating */}
        <div className="col-span-2 lg:col-span-1">
          <h2 className="foot-title">Sign up for our newsletter</h2>
          <p className="mt-4 mb-4 text-sm leading-relaxed text-[#e4ece4]/90">Seasonal planting tips, care reminders and nursery offers. No spam.</p>
          <NewsletterForm />
          {rating.count > 0 && (
            <Link href="/trees" className="foot-rating mt-6 flex items-center gap-4 rounded-xl bg-[#fbfaf6] px-5 py-4 text-forest-900 shadow-lg shadow-black/20">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-[#e6ebdf] text-[#1d5b33]"><Icon.leaf className="h-5 w-5" /></span>
              <span className="min-w-0">
                <span className="block text-xs text-stone-500">Gaach rating</span>
                <span className="flex items-center gap-2">
                  <span className="text-xl font-bold">{rating.average.toFixed(1)}</span>
                  <Stars value={rating.average} />
                </span>
                <span className="block text-[0.6875rem] text-stone-500">from {rating.count} customer {rating.count === 1 ? "review" : "reviews"}</span>
              </span>
            </Link>
          )}
        </div>
      </div>

      <div className="relative mx-auto max-w-[87.5rem] px-4 sm:px-6 lg:px-10"><div className="border-t border-white/15" /></div>
      <div className="relative">
        <div className="mx-auto flex max-w-[87.5rem] flex-wrap items-center justify-between gap-4 px-4 py-5 text-xs text-[#e4ece4]/75 sm:px-6 lg:px-10">
          <p>© {new Date().getFullYear()} Gaach. Trees for Bangladesh.</p>
          {socials.length > 0 && (
            <div className="flex gap-1.5">
              {socials.map(([name, href, label]) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="foot-social">
                  <SocialIcon name={name} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
    </footer>
  );
}
