"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { addTreePhotos, deleteTreePhoto, moveTreePhoto } from "@/modules/admin/sales-actions";

type Photo = { id: string; url: string };

// Extra photos for a tree: pick several at once, they upload one by one so large sets still fit
export function TreePhotos({ treeId, photos, mainUrl }: { treeId: string; photos: Photo[]; mainUrl: string | null }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function upload() {
    const files = [...(input.current?.files ?? [])];
    if (!files.length) return setMsg({ ok: false, text: "Choose at least one photo." });
    setMsg(null);
    let done = 0;
    for (const [k, f] of files.entries()) {
      setBusy(`Uploading ${k + 1} of ${files.length}…`);
      const fd = new FormData();
      fd.set("treeId", treeId);
      fd.append("photos", f);
      const r = await addTreePhotos({}, fd);
      if (!r.ok) {
        setMsg({ ok: false, text: r.message ?? "Upload failed." });
        break;
      }
      done++;
    }
    setBusy("");
    if (done) setMsg((m) => m ?? { ok: true, text: `${done} photo${done > 1 ? "s" : ""} added.` });
    if (input.current) input.current.value = "";
    router.refresh();
  }

  const small = "grid h-7 w-7 place-items-center rounded-full bg-white/95 text-xs text-forest-900 shadow hover:bg-white disabled:opacity-40";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3">
        {mainUrl && (
          <figure className="relative h-28 w-28 overflow-hidden rounded-xl ring-2 ring-forest-900">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mainUrl} alt="" className="h-full w-full object-cover" />
            <figcaption className="absolute inset-x-0 bottom-0 bg-forest-900/80 py-0.5 text-center text-[0.625rem] text-white">Main photo</figcaption>
          </figure>
        )}
        {photos.map((p, i) => (
          <figure key={p.id} className="group relative h-28 w-28 overflow-hidden rounded-xl ring-1 ring-stone-200">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.url} alt={`Photo ${i + 1}`} className="h-full w-full object-cover" />
            <div className="absolute inset-x-1 bottom-1 flex justify-between">
              <form action={moveTreePhoto}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="-1" /><button className={small} disabled={i === 0} aria-label="Move earlier">←</button></form>
              <form action={deleteTreePhoto} onSubmit={(e) => { if (!confirm("Delete this photo?")) e.preventDefault(); }}><input type="hidden" name="id" value={p.id} /><button className={`${small} text-red-700`} aria-label="Delete photo">✕</button></form>
              <form action={moveTreePhoto}><input type="hidden" name="id" value={p.id} /><input type="hidden" name="dir" value="1" /><button className={small} disabled={i === photos.length - 1} aria-label="Move later">→</button></form>
            </div>
            <span className="absolute left-1 top-1 rounded-full bg-black/55 px-1.5 text-[0.625rem] text-white">{i + (mainUrl ? 2 : 1)}</span>
          </figure>
        ))}
        {!mainUrl && !photos.length && <p className="text-sm text-stone-500">No photos yet.</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input ref={input} type="file" multiple accept="image/jpeg,image/png,image/webp" className="text-xs file:mr-2 file:rounded-full file:border-0 file:bg-mint-100 file:px-3 file:py-1.5 file:text-forest-800" />
        <button type="button" onClick={upload} disabled={!!busy} className="btn-primary">{busy || "Upload photos"}</button>
      </div>
      <p className="text-[0.6875rem] text-stone-500">Pick several at once. JPG, PNG or WebP, each under 2 MB, up to 12 extra photos. Shoppers swipe through them on the product card and tree page.</p>
      {msg && <p className={msg.ok ? "text-xs text-lime-700" : "field-error"}>{msg.text}</p>}
    </div>
  );
}
