import { ContactForm } from "@/components/forms/ContactForm";
import { SocialIcon, type Social } from "@/components/SocialIcons";
import { Icon } from "@/components/icons";
import { getCurrentUser } from "@/modules/accounts/session";
import { getSiteInfo, outletList, telHref, waHref } from "@/modules/site/info";
import { LeafIcon } from "@/components/SpeciesRow";

export const metadata = { title: "Contact us" };

export default async function ContactPage() {
  const [info, user] = await Promise.all([getSiteInfo(), getCurrentUser()]);
  const outlets = outletList(info.outlets);
  const rows = [
    info.hotline && { label: info.hotlineNote ? `Hotline (${info.hotlineNote})` : "Hotline", value: info.hotline, href: telHref(info.hotline) },
    info.phone && { label: "Phone", value: info.phone, href: telHref(info.phone) },
    info.whatsapp && { label: "WhatsApp", value: info.whatsapp, href: waHref(info.whatsapp) },
    info.email && { label: "Email", value: info.email, href: `mailto:${info.email}` },
  ].filter(Boolean) as { label: string; value: string; href: string }[];
  const socials = ([["facebook", info.facebook, "Facebook"], ["instagram", info.instagram, "Instagram"], ["youtube", info.youtube, "YouTube"]] as [Social, string, string][]).filter(([, h]) => h);

  return (
    <div>
      <p className="flex items-center gap-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-lime-600"><LeafIcon className="h-4 w-4 text-lime-500" /> We&apos;re here to help</p>
      <h1 className="font-display anim-rise mt-2 text-4xl font-semibold text-forest-900 sm:text-5xl">Contact us</h1>
      <p className="anim-rise mt-3 max-w-xl text-[0.9375rem] text-stone-600" style={{ animationDelay: "120ms" }}>
        Questions about an order, a sick plant, or a bulk order for your school or office? Send us a message and we&apos;ll get back to you.
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <aside className="anim-rise h-fit space-y-5 rounded-3xl bg-forest-900 p-6 text-mint-100" style={{ animationDelay: "200ms" }}>
          {rows.length > 0 ? (
            <ul className="space-y-4">
              {rows.map((r) => (
                <li key={r.label}>
                  <p className="text-xs text-mint-200/70">{r.label}</p>
                  <a href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-lg font-semibold text-white hover:text-lime-300">{r.value}</a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm">The quickest way to reach us is the form. We usually reply within a day.</p>
          )}
          {outlets.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-lime-400">{outlets.length > 1 ? "Our nurseries" : "Our nursery"}</p>
              <ul className="mt-2 space-y-2 text-sm">
                {outlets.map((o, i) => (
                  <li key={i} className="flex gap-2"><Icon.pin className="mt-0.5 h-4 w-4 shrink-0 text-lime-400" /><span>{o.name && <strong className="text-white">{o.name}: </strong>}{o.address}</span></li>
                ))}
              </ul>
            </div>
          )}
          {socials.length > 0 && (
            <div className="flex gap-2.5">
              {socials.map(([n, h, l]) => <a key={n} href={h} target="_blank" rel="noopener noreferrer" aria-label={l} className="foot-social"><SocialIcon name={n} /></a>)}
            </div>
          )}
          <ul className="space-y-1.5 border-t border-white/10 pt-4 text-xs text-mint-200/80">
            <li className="flex items-center gap-2"><Icon.truck className="h-4 w-4 text-lime-400" /> Delivery to all 64 districts</li>
            <li className="flex items-center gap-2"><Icon.shield className="h-4 w-4 text-lime-400" /> Damaged plant? Tell us within 48 hours</li>
          </ul>
        </aside>
        <section className="card anim-rise p-6 sm:p-8" style={{ animationDelay: "280ms" }}>
          <h2 className="font-display text-2xl text-forest-900">Send a message</h2>
          <div className="mt-5"><ContactForm name={user?.name} email={user?.email} /></div>
        </section>
      </div>
    </div>
  );
}
