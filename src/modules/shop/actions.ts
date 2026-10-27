"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { fieldErrors, formValues, type FormState } from "@/lib/forms";
import { cancelOrder, placeOrder, StockError } from "./orders";
import { getDeliveryFee } from "./settings";
import { gateway } from "./payment";

const checkoutSchema = z.object({
  recipientName: z.string().trim().min(2, "Enter the name of the person receiving the plants.").max(80),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => /^(\+?880|0)1[3-9]\d{8}$/.test(v), "Enter a Bangladeshi mobile number, like 01712345678."),
  address: z.string().trim().min(10, "Enter the full delivery address with area and district.").max(300),
  paymentMethod: z.enum(["COD", "ONLINE_TEST"], { message: "Choose a payment method." }),
});

export async function checkout(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireUser("/checkout");
  const values = formValues(fd, ["recipientName", "phone", "address", "paymentMethod", "saveAddress"]);
  const parsed = checkoutSchema.safeParse(values);
  if (!parsed.success) return { errors: fieldErrors(parsed.error), values };

  let orderId: string;
  try {
    const order = await placeOrder({ userId: user.id, ...parsed.data, deliveryFee: await getDeliveryFee() });
    orderId = order.id;
  } catch (e) {
    if (e instanceof StockError) {
      revalidatePath("/cart");
      return { message: "Some items do not have enough stock, so the order was not placed: " + e.items.join("; ") + ". Update your cart and try again.", values };
    }
    if (e instanceof Error && e.message === "EMPTY_CART") return { message: "Your cart is empty.", values };
    console.error("checkout failed", e);
    return { message: "Something went wrong placing the order. Nothing was charged; please try again.", values };
  }

  if (values.saveAddress === "on") {
    await db.user.update({ where: { id: user.id }, data: { phone: parsed.data.phone, address: parsed.data.address } });
  }
  revalidatePath("/", "layout");
  if (parsed.data.paymentMethod === "ONLINE_TEST") redirect(gateway.startPayment(orderId));
  redirect(`/orders/${orderId}?placed=1`);
}

// Result coming back from the test-mode gateway page.
export async function finishTestPayment(fd: FormData) {
  const user = await requireUser("/orders");
  const orderId = String(fd.get("orderId") ?? "");
  const outcome = String(fd.get("outcome") ?? "");
  const order = await db.order.findFirst({ where: { id: orderId, userId: user.id } });
  if (!order) redirect("/orders");
  if (order.paymentMethod !== "ONLINE_TEST" || order.paymentStatus !== "PENDING" || order.status === "CANCELLED") {
    redirect(`/orders/${orderId}`);
  }
  if (outcome === "success") {
    await db.order.update({ where: { id: orderId }, data: { paymentStatus: "PAID", paymentRef: gateway.newReference() } });
    redirect(`/orders/${orderId}?placed=1`);
  }
  await cancelOrder(orderId, { paymentFailed: true });
  revalidatePath("/", "layout");
  redirect(`/orders/${orderId}?payment=failed`);
}
