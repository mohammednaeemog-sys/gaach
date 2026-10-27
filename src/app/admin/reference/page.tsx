import { db } from "@/lib/db";
import { addDistrict, addRegion, saveRegion, setDistrictRegion } from "@/modules/admin/actions";
import { getDeliveryFee } from "@/modules/shop/settings";
import { DeliveryFeeForm } from "@/components/admin/DeliveryFeeForm";
import { LEVELS, label } from "@/lib/constants";

export const metadata = { title: "Regions and delivery" };

export default async function ReferencePage() {
  const [regions, divisions, fee] = await Promise.all([
    db.region.findMany({ orderBy: { name: "asc" }, include: { _count: { select: { districts: true } } } }),
    db.division.findMany({ orderBy: { name: "asc" }, include: { districts: { orderBy: { name: "asc" } } } }),
    getDeliveryFee(),
  ]);
  return (
    <div className="space-y-6">
      <h1 className="page-title">Regions and delivery</h1>
      <section className="card p-5">
        <h2 className="mb-3 font-semibold text-forest-900">Delivery</h2>
        <DeliveryFeeForm fee={fee} />
      </section>

      <section className="card p-5">
        <h2 className="mb-1 font-semibold text-forest-900">Regional profiles</h2>
        <p className="mb-3 text-sm text-stone-600">The recommendation engine uses these conditions to rule out trees that cannot survive a district.</p>
        <div className="space-y-2">
          {regions.map((r) => (
            <form key={r.id} action={saveRegion} className="grid items-center gap-2 rounded-lg border border-stone-200 p-3 md:grid-cols-[1.4fr_auto_auto_auto_auto_2fr_auto]">
              <input type="hidden" name="id" value={r.id} />
              <div><p className="font-medium">{r.name}</p><p className="text-xs text-stone-500">{r._count.districts} districts</p></div>
              <select name="rainfall" defaultValue={r.rainfall} className="input w-auto" aria-label="Rainfall">
                {LEVELS.map((l) => <option key={l} value={l}>{label(l)} rain</option>)}
              </select>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="floodProne" defaultChecked={r.floodProne} /> Flood</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="droughtProne" defaultChecked={r.droughtProne} /> Drought</label>
              <label className="flex items-center gap-1 text-sm"><input type="checkbox" name="saline" defaultChecked={r.saline} /> Salty soil</label>
              <input name="description" defaultValue={r.description} className="input" aria-label="Description" />
              <button className="btn-secondary px-3 py-1.5 text-xs">Save</button>
            </form>
          ))}
        </div>
        <form action={addRegion} className="mt-4 flex flex-wrap items-end gap-2">
          <div><label className="field-label text-xs">New region name</label><input name="name" className="input" /></div>
          <select name="rainfall" className="input w-auto" defaultValue="MEDIUM">{LEVELS.map((l) => <option key={l} value={l}>{label(l)} rain</option>)}</select>
          <button className="btn-primary">Add region</button>
        </form>
      </section>

      <section className="card p-5">
        <h2 className="mb-3 font-semibold text-forest-900">District to region table</h2>
        <div className="grid gap-5 md:grid-cols-2">
          {divisions.map((d) => (
            <div key={d.id}>
              <p className="mb-1 text-sm font-semibold text-stone-700">{d.name} division</p>
              <ul className="space-y-1">
                {d.districts.map((ds) => (
                  <li key={ds.id}>
                    <form action={setDistrictRegion} className="flex items-center gap-2">
                      <input type="hidden" name="districtId" value={ds.id} />
                      <span className="w-36 text-sm">{ds.name}</span>
                      <select name="regionId" defaultValue={ds.regionId} className="input py-1 text-xs" aria-label={`Region for ${ds.name}`}>
                        {regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                      </select>
                      <button className="btn-ghost px-2 py-1 text-xs">Save</button>
                    </form>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <form action={addDistrict} className="mt-5 flex flex-wrap items-end gap-2 border-t pt-4">
          <div><label className="field-label text-xs">New district</label><input name="name" className="input" /></div>
          <select name="divisionId" className="input w-auto" aria-label="Division">{divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select>
          <select name="regionId" className="input w-auto" aria-label="Region">{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}</select>
          <button className="btn-primary">Add district</button>
        </form>
      </section>
    </div>
  );
}
