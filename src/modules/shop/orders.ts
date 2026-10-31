import "server-only";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { livePromotions, priceFor } from "./pricing";

export class StockError extends Error {
  constructor(public items: string[]) {
    super("Not enough stock");
  }
}

type NewOrder = {
  userId: string;
  recipientName: string;
  phone: string;
  address: string;
  paymentMethod: "COD" | "ONLINE_TEST";
  deliveryFee: number;
};

// Checks stock, reduces it and creates the order in one transaction (FR-5.5, NFR-4.2).
// Each stock decrement only succeeds if enough stock remains at that moment, so two
// buyers can never both get the last plant. Any failure rolls everything back.
export async function placeOrder(input: NewOrder) {
  // Sale prices are worked out once, so the customer pays what the cart showed
  const promos = await livePromotions();
  return db.$transaction(
    async (tx) => {
      const cart = await tx.cartItem.findMany({ where: { userId: input.userId }, include: { product: { include: { tree: true } } } });
      if (!cart.length) throw new Error("EMPTY_CART");

      const short: string[] = [];
      for (const item of cart) {
        const p = item.product;
        if (!p.active || !p.tree.published) {
          short.push(`${p.title} is no longer sold`);
          continue;
        }
        const updated = await tx.product.updateMany({
          where: { id: p.id, active: true, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (updated.count !== 1) {
          const fresh = await tx.product.findUnique({ where: { id: p.id } });
          short.push(`${p.title}: you asked for ${item.quantity}, only ${fresh?.stock ?? 0} left`);
        }
      }
      if (short.length) throw new StockError(short);

      const unit = (i: (typeof cart)[number]) => priceFor(i.product, i.product.treeId, promos).now;
      const subtotal = cart.reduce((sum, i) => sum + unit(i) * i.quantity, 0);
      const order = await tx.order.create({
        data: {
          userId: input.userId,
          paymentMethod: input.paymentMethod,
          recipientName: input.recipientName,
          phone: input.phone,
          address: input.address,
          subtotalBdt: subtotal,
          deliveryFee: input.deliveryFee,
          totalBdt: subtotal + input.deliveryFee,
          items: {
            create: cart.map((i) => ({
              productId: i.productId,
              titleSnapshot: i.product.title,
              unitPriceBdt: unit(i),
              quantity: i.quantity,
            })),
          },
        },
      });
      // Each purchased tree appears in the account with its care plan (FR-6.1)
      for (const i of cart) {
        await tx.ownedTree.create({
          data: { userId: input.userId, treeId: i.product.treeId, orderId: order.id, quantity: i.quantity, nickname: i.product.tree.name },
        });
      }
      await tx.cartItem.deleteMany({ where: { userId: input.userId } });
      return order;
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );
}

// Cancels an order and puts its stock back, all or nothing.
export async function cancelOrder(orderId: string, opts: { paymentFailed?: boolean } = {}) {
  return db.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status === "CANCELLED" || order.status === "DELIVERED") return false;
    const moved = await tx.order.updateMany({
      where: { id: orderId, status: order.status },
      data: { status: "CANCELLED", ...(opts.paymentFailed ? { paymentStatus: "FAILED" } : {}) },
    });
    if (moved.count !== 1) return false;
    for (const item of order.items) {
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
    await tx.ownedTree.deleteMany({ where: { orderId } });
    return true;
  });
}

export function shortId(id: string) {
  return id.slice(-8).toUpperCase();
}
