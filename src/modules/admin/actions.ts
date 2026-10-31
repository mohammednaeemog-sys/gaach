"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireAdmin } from "@/modules/accounts/session";
import { cancelOrder } from "@/modules/shop/orders";
import { fieldErrors, type FormState } from "@/lib/forms";
import { CARE_STAGES, DELIVERY_FEE_KEY, LEVELS, ORDER_STATUSES } from "@/lib/constants";
import { missingForPublish, treeSchema } from "./validation";
import { saveImage } from "./uploads";

// Every admin action checks the role on the server first (FR-1.3, NFR-3.2).

function treeFromForm(fd: FormData) {
  const all = (k: string) => fd.getAll(k).map(String);
  return {
    name: String(fd.get("name") ?? ""),
    slug: String(fd.get("slug") ?? ""),
    banglaName: String(fd.get("banglaName") ?? ""),
    scientificName: String(fd.get("scientificName") ?? ""),
    description: String(fd.get("description") ?? ""),
    shape: String(fd.get("shape") ?? "round"),
    color: String(fd.get("color") ?? "#2e7d32"),
    matureHeightM: String(fd.get("matureHeightM") ?? "0") || "0",
    canopySpreadM: String(fd.get("canopySpreadM") ?? "0") || "0",
    growthRate: String(fd.get("growthRate") ?? ""),
    sunlight: all("sunlight"),
    soils: all("soils"),
    purposes: all("purposes"),
    waterNeed: String(fd.get("waterNeed") ?? ""),
    rainfall: all("rainfall"),
    floodTolerance: String(fd.get("floodTolerance") ?? ""),
    droughtTolerance: String(fd.get("droughtTolerance") ?? ""),
    salinityTolerance: String(fd.get("salinityTolerance") ?? ""),
    fruitingSeason: String(fd.get("fruitingSeason") ?? ""),
    cautions: String(fd.get("cautions") ?? ""),
    imageCredit: String(fd.get("imageCredit") ?? ""),
    imageSourceUrl: String(fd.get("imageSourceUrl") ?? "").trim(),
  };
}

export async function saveTree(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const id = String(fd.get("id") ?? "") || null;
  const publish = fd.get("publish") === "on";
  const raw = treeFromForm(fd);
  // Sent back so the form keeps what the admin typed when there is an error
  const values: Record<string, string> = Object.fromEntries(
    Object.entries(raw).map(([k, v]) => [k, Array.isArray(v) ? v.join(",") : v]),
  );
  values.published = publish ? "1" : "";
  const parsed = treeSchema.safeParse(raw);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), message: "Fix the highlighted fields.", values };
  const t = parsed.data;

  if (publish) {
    const missing = missingForPublish(t);
    if (missing.length) {
      return { message: `This tree cannot be published until these are filled in: ${missing.join(", ")}. Untick "Published" to save it as a draft.`, values };
    }
  }
  const clash = await db.tree.findFirst({ where: { slug: t.slug, ...(id ? { NOT: { id } } : {}) } });
  if (clash) return { errors: { slug: "Another tree already uses this web address." }, values };

  const image = await saveImage(fd.get("image") as File | null, t.slug);
  if (image.error) return { errors: { image: image.error }, values };

  const data = {
    ...t,
    sunlight: t.sunlight.join(","),
    soils: t.soils.join(","),
    purposes: t.purposes.join(","),
    rainfall: t.rainfall.join(","),
    published: publish,
    ...(image.url ? { imageUrl: image.url } : {}),
    ...(fd.get("removeImage") === "on" && !image.url ? { imageUrl: null, imageCredit: "", imageSourceUrl: "" } : {}),
  };
  const tree = id ? await db.tree.update({ where: { id }, data }) : await db.tree.create({ data });
  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/trees/${tree.id}?created=1`);
  return { ok: true, message: publish ? "Saved and published." : "Saved as a draft (not visible to users).", values };
}

export async function setTreePublished(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const publish = fd.get("publish") === "1";
  const tree = await db.tree.findUnique({ where: { id } });
  if (!tree) return;
  if (publish && missingForPublish(tree).length) redirect(`/admin/trees/${id}?incomplete=1`);
  await db.tree.update({ where: { id }, data: { published: publish } });
  revalidatePath("/", "layout");
}

export async function deleteTree(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const sold = await db.orderItem.count({ where: { product: { treeId: id } } });
  if (sold > 0) {
    // Keep order history intact: trees that were sold can only be unpublished
    redirect(`/admin/trees/${id}?cannotDelete=1`);
  }
  await db.$transaction([
    db.cartItem.deleteMany({ where: { product: { treeId: id } } }),
    db.conversation.updateMany({ where: { treeId: id }, data: { treeId: null } }),
    db.tree.delete({ where: { id } }),
  ]);
  revalidatePath("/", "layout");
  redirect("/admin/trees?deleted=1");
}

const productSchema = z.object({
  sizeLabel: z.string().trim().min(2, "Describe the plant size, like 2 ft sapling.").max(60),
  ageMonths: z.coerce.number().int("Age must be whole months.").min(0).max(240),
  priceBdt: z.coerce.number().int("Price must be whole taka.").min(1, "Price must be at least ৳1.").max(1_000_000),
  stock: z.coerce.number().int("Stock must be a whole number.").min(0, "Stock cannot be negative.").max(100_000),
  // Optional fixed sale price for this size; empty means no sale price
  salePriceBdt: z.preprocess((v) => (v === "" || v == null ? null : v), z.coerce.number().int("Sale price must be whole taka.").min(1, "Sale price must be at least ৳1.").nullable()),
}).refine((d) => d.salePriceBdt == null || d.salePriceBdt < d.priceBdt, { path: ["salePriceBdt"], message: "The sale price must be lower than the normal price." });

export async function saveProduct(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const treeId = String(fd.get("treeId") ?? "");
  const id = String(fd.get("id") ?? "") || null;
  const values = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = productSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  const tree = await db.tree.findUnique({ where: { id: treeId } });
  if (!tree) return { message: "Tree not found." };
  const image = await saveImage(fd.get("image") as File | null, `${tree.slug}-size`);
  if (image.error) return { errors: { image: image.error }, values };
  const data = {
    ...parsed.data,
    active: fd.get("active") === "on",
    title: `${tree.name.split(" (")[0]} - ${parsed.data.sizeLabel}`,
    ...(image.url ? { imageUrl: image.url } : fd.get("removeImage") === "on" ? { imageUrl: null } : {}),
  };
  if (id) await db.product.update({ where: { id }, data });
  else await db.product.create({ data: { ...data, treeId, active: true } });
  revalidatePath("/", "layout");
  return { ok: true, message: id ? "Product saved." : "Product added.", values: id ? values : undefined };
}

const careSchema = z.object({
  planting: z.string().trim().min(5, "Write the planting or upkeep steps.").max(2000),
  watering: z.string().trim().min(5, "Write the watering guidance.").max(2000),
  fertilizing: z.string().trim().min(5, "Write the fertilizing guidance.").max(2000),
  protection: z.string().trim().min(5, "Write the protection guidance.").max(2000),
});

export async function saveCareStage(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const treeId = String(fd.get("treeId") ?? "");
  const stage = String(fd.get("stage") ?? "");
  if (!(CARE_STAGES as readonly string[]).includes(stage)) return { message: "Unknown stage." };
  const values = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const parsed = careSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };
  await db.careStage.upsert({
    where: { treeId_stage: { treeId, stage } },
    update: parsed.data,
    create: { treeId, stage, ...parsed.data },
  });
  revalidatePath("/", "layout");
  return { ok: true, message: "Care instructions saved.", values };
}

export async function updateOrderStatus(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const status = String(fd.get("status") ?? "");
  if (!(ORDER_STATUSES as readonly string[]).includes(status)) return;
  if (status === "CANCELLED") await cancelOrder(id);
  else {
    const order = await db.order.findUnique({ where: { id } });
    if (!order || order.status === "CANCELLED") return; // a cancelled order's stock is already returned
    await db.order.update({
      where: { id },
      data: { status, ...(status === "DELIVERED" && order.paymentMethod === "COD" ? { paymentStatus: "PAID" } : {}) },
    });
  }
  revalidatePath("/admin/orders");
  revalidatePath(`/orders/${id}`);
}

const regionSchema = z.object({
  id: z.coerce.number().int(),
  rainfall: z.enum(LEVELS),
  description: z.string().trim().max(300),
});

export async function saveRegion(fd: FormData) {
  await requireAdmin();
  const parsed = regionSchema.safeParse(Object.fromEntries(fd));
  if (!parsed.success) return;
  await db.region.update({
    where: { id: parsed.data.id },
    data: {
      rainfall: parsed.data.rainfall,
      description: parsed.data.description,
      floodProne: fd.get("floodProne") === "on",
      droughtProne: fd.get("droughtProne") === "on",
      saline: fd.get("saline") === "on",
    },
  });
  revalidatePath("/admin/reference");
}

export async function addRegion(fd: FormData) {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const rainfall = String(fd.get("rainfall") ?? "");
  if (name.length < 3 || !(LEVELS as readonly string[]).includes(rainfall)) return;
  await db.region.upsert({ where: { name }, update: {}, create: { name, rainfall } });
  revalidatePath("/admin/reference");
}

export async function setDistrictRegion(fd: FormData) {
  await requireAdmin();
  const districtId = Number(fd.get("districtId"));
  const regionId = Number(fd.get("regionId"));
  if (!Number.isInteger(districtId) || !Number.isInteger(regionId)) return;
  await db.district.update({ where: { id: districtId }, data: { regionId } });
  revalidatePath("/admin/reference");
}

export async function addDistrict(fd: FormData) {
  await requireAdmin();
  const name = String(fd.get("name") ?? "").trim();
  const divisionId = Number(fd.get("divisionId"));
  const regionId = Number(fd.get("regionId"));
  if (name.length < 2 || !Number.isInteger(divisionId) || !Number.isInteger(regionId)) return;
  await db.district.upsert({ where: { name }, update: { divisionId, regionId }, create: { name, divisionId, regionId } });
  revalidatePath("/admin/reference");
}

export async function setDeliveryFee(_: FormState, fd: FormData): Promise<FormState> {
  await requireAdmin();
  const fee = Number(fd.get("fee"));
  if (!Number.isInteger(fee) || fee < 0 || fee > 5000) return { errors: { fee: "Enter a whole number of taka between 0 and 5000." } };
  await db.setting.upsert({ where: { key: DELIVERY_FEE_KEY }, update: { value: String(fee) }, create: { key: DELIVERY_FEE_KEY, value: String(fee) } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Delivery fee updated." };
}

export async function deleteRefusal(fd: FormData) {
  await requireAdmin();
  await db.refusedQuestion.deleteMany({ where: { id: String(fd.get("id") ?? "") } });
  revalidatePath("/admin/ai");
}

// Knowledge review: a competent reviewer marks guides and tree facts as checked
export async function setGuideReview(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const reviewed = fd.get("reviewed") === "1";
  const note = String(fd.get("note") ?? "").trim().slice(0, 300);
  await db.careGuide.update({
    where: { id },
    data: reviewed ? { status: "REVIEWED", reviewedAt: new Date(), reviewNote: note } : { status: "UNREVIEWED", reviewedAt: null },
  });
  revalidatePath("/admin/knowledge");
  revalidatePath("/guides", "layout");
}

export async function setTreeReview(fd: FormData) {
  await requireAdmin();
  const id = String(fd.get("id") ?? "");
  const reviewed = fd.get("reviewed") === "1";
  await db.tree.update({ where: { id }, data: reviewed ? { reviewStatus: "REVIEWED", reviewedAt: new Date() } : { reviewStatus: "UNREVIEWED", reviewedAt: null } });
  revalidatePath("/admin/knowledge");
}
