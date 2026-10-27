import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { dateText } from "@/lib/format";
import { Reveal } from "@/components/Reveal";
import { Icon } from "@/components/icons";
import { label } from "@/lib/constants";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const g = await db.careGuide.findFirst({ where: { slug: (await params).slug, published: true }, select: { title: true } });
  return { title: g?.title ?? "Guide not found" };
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await db.careGuide.findFirst({ where: { slug, published: true } });
  if (!g) notFound();
  let sections: { heading: string; text: string }[] = [];
  try {
    sections = JSON.parse(g.sections);
  } catch {
    sections = [];
  }
  const trees = g.species ? await db.tree.findMany({ where: { slug: { in: g.species.split(",") }, published: true }, select: { slug: true, name: true } }) : [];
  const more = await db.careGuide.findMany({ where: { published: true, topic: g.topic, id: { not: g.id } }, select: { slug: true, title: true }, take: 4, orderBy: { title: "asc" } });

  return (
    <div>
      <header className="relative -mt-6 overflow-hidden bg-forest-900 text-white sm:-mt-10 mx-[calc(50%-50vw)]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/hero/nursery.jpg" alt="" className="banner-photo absolute inset-0 h-full w-full object-cover opacity-25" aria-hidden />
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/90 to-forest-900/40" aria-hidden />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6 lg:px-10 py-12 sm:py-16">
          <Link href="/guides" className="text-sm text-mint-200 hover:text-lime-400">← All care guides</Link>
          <p className="mt-4 flex flex-wrap gap-2 text-xs">
            {g.stage && <span className="rounded-full bg-white/10 px-2.5 py-1">{label(g.stage) === g.stage ? g.stage.toLowerCase().replace(/_/g, " ") : label(g.stage)}</span>}
            <span className={`rounded-full px-2.5 py-1 ${g.status === "REVIEWED" ? "bg-lime-500/20 text-lime-300" : "bg-amber-400/20 text-amber-200"}`}>{g.status === "REVIEWED" ? "✓ Expert-reviewed" : "Not reviewed by an expert yet"}</span>
          </p>
          <h1 className="font-display anim-rise mt-3 max-w-3xl text-4xl font-semibold leading-tight sm:text-5xl">{g.title}</h1>
          {trees.length > 0 && <p className="mt-3 text-sm text-mint-100/80">For {trees.map((t, i) => <span key={t.slug}>{i ? ", " : ""}<Link href={`/trees/${t.slug}`} className="text-lime-400 hover:underline">{t.name}</Link></span>)}</p>}
        </div>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_300px]">
        <ol className="guide-steps relative space-y-5">
          {sections.map((s, i) => (
            <Reveal as="li" key={s.heading} delay={i * 80} className="relative pl-14">
              <span className="absolute left-0 top-0 grid h-10 w-10 place-items-center rounded-full bg-lime-500 font-bold text-white ring-4 ring-[var(--color-cream)]">{i + 1}</span>
              <div className="rounded-2xl bg-white p-5 ring-1 ring-stone-100">
                <h2 className="font-semibold text-forest-900">{s.heading}</h2>
                <p className="mt-2 leading-relaxed text-stone-700">{s.text}</p>
              </div>
            </Reveal>
          ))}
        </ol>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-2xl bg-forest-900 p-5 text-white">
            <p className="flex items-center gap-2 font-semibold"><Icon.chat className="h-5 w-5 text-lime-400" /> Still unsure?</p>
            <p className="mt-2 text-sm text-mint-100/80">Ask the Tree Advisor about your own tree. It uses this guide too.</p>
            <Link href={`/assistant?q=${encodeURIComponent(`Question about: ${g.title}`)}`} className="btn-primary mt-4 w-full">Ask the Tree Advisor</Link>
          </div>
          <div className="rounded-2xl bg-white p-5 text-sm ring-1 ring-stone-100">
            <p className="font-semibold text-forest-900">Source</p>
            <a href={g.sourceUrl} target="_blank" rel="noreferrer" className="mt-1 block text-forest-700 hover:underline">{g.sourceTitle}</a>
            <p className="mt-3 text-xs text-stone-500">{g.status === "REVIEWED" ? `Reviewed by a tree-care expert${g.reviewedAt ? ` on ${dateText(g.reviewedAt)}` : ""}.` : "Not reviewed by a tree-care expert yet. For serious problems, ask your local Upazila agriculture office."}</p>
          </div>
          {more.length > 0 && (
            <div className="rounded-2xl bg-white p-5 text-sm ring-1 ring-stone-100">
              <p className="font-semibold text-forest-900">Related guides</p>
              <ul className="mt-2 space-y-1.5">{more.map((m) => <li key={m.slug}><Link href={`/guides/${m.slug}`} className="text-stone-700 hover:text-lime-700">→ {m.title}</Link></li>)}</ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
