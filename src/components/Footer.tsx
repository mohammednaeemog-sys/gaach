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
    <footer className="site-footer relative mt-16 overflow-hidden bg-forest-900 text-mint-100">
      <svg className="foot-leaf pointer-events-none absolute -right-10 -top-10 h-56 w-56 text-white/[0.04]" viewBox="0 0 24 24" aria-hidden>
        <path d="M4 20 C 4 9, 11 4, 21 4 C 21 14, 15 20, 4 20Z" fill="currentColor" />
      </svg>
      <div className="relative mx-auto grid max-w-[87.5rem] grid-cols-2 gap-x-6 gap-y-10 px-4 sm:px-6 lg:px-10 py-12 lg:grid-cols-[1.45fr_1fr_1fr_1.3fr]">
        {/* Brand and contact */}
        <div className="col-span-2 space-y-5 lg:col-span-1">
          <LogoBadge size={112} className="logo-hover-tilt" />
          <p className="max-w-xs text-sm text-mint-200/80">Tree recommendations and healthy saplings for every district of Bangladesh.</p>

          {info.hotline && (
            <a href={telHref(info.hotline)} className="group flex items-center gap-3">
              <Headset className="h-11 w-11 shrink-0 text-lime-400 transition group-hover:scale-105" />
              <span>
                <span className="block text-xs text-mint-200/80">{info.hotlineNote ? `Hotline · ${info.hotlineNote}` : "Hotline"}</span>
                <span className="block text-lg font-semibold tracking-wide text-white group-hover:text-lime-300">{info.hotline}</span>
              </span>
            </a>
          )}

          {outlets.length > 0 && (
            <div className="text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-400">{outlets.length > 1 ? "Our nurseries" : "Our nursery"}</p>
              <ul className="mt-2 space-y-1.5 text-mint-200/85">
                {outlets.map((o, i) => (
                  <li key={i} className="flex gap-2">
                    <Icon.pin className="mt-0.5 h-4 w-4 shrink-0 text-lime-400/80" />
                    <span>{o.name && <strong className="font-semibold text-white">{o.name}: </strong>}{o.address}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <ul className="space-y-1.5 text-sm text-mint-200/85">
            {info.email && <li><span className="text-mint-200/55">Email: </span><a href={`mailto:${info.email}`} className="foot-link">{info.email}</a></li>}
            {info.phone && <li><span className="text-mint-200/55">Phone: </span><a href={telHref(info.phone)} className="foot-link">{info.phone}</a></li>}
            {!info.email && !info.phone && !info.hotline && (
              <>
                <li className="flex items-center gap-2"><Icon.truck className="h-4 w-4 text-lime-400" /> Delivery to all 64 districts</li>
                <li className="flex items-center gap-2"><Icon.shield className="h-4 w-4 text-lime-400" /> Cash on delivery</li>
              </>
            )}
          </ul>

          {socials.length > 0 && (
            <div className="flex gap-2.5">
              {socials.map(([name, href, label]) => (
                <a key={name} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="foot-social">
                  <SocialIcon name={name} />
                </a>
              ))}
            </div>
          )}
        </div>

        <LinkColumn title="Information & services" links={INFO_LINKS} />
        <LinkColumn title="My account & policies" links={ACCOUNT_LINKS} />

        {/* Newsletter and rating */}
        <div className="col-span-2 lg:col-span-1">
          <h2 className="foot-title">Sign up for our newsletter</h2>
          <p className="mt-3 mb-3 text-sm text-mint-200/80">Seasonal planting tips, care reminders and nursery offers. No spam.</p>
          <NewsletterForm />
          {rating.count > 0 && (
            <Link href="/trees" className="foot-rating mt-6 flex items-center gap-3 rounded-2xl bg-white p-3 text-forest-900 shadow-lg shadow-black/20">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mint-100 text-forest-700"><Icon.leaf className="h-5 w-5" /></span>
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

      <div className="relative border-t border-white/10">
        <div className="mx-auto flex max-w-[87.5rem] items-center justify-center px-4 sm:px-6 lg:px-10 py-5 text-xs text-mint-200/70">
          <p>© {new Date().getFullYear()} Gaach. Trees for Bangladesh.</p>
        </div>
      </div>
    </footer>
  );
}
