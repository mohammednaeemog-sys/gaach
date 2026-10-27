import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireUser } from "@/modules/accounts/session";
import { finishTestPayment } from "@/modules/shop/actions";
import { shortId } from "@/modules/shop/orders";
import { taka } from "@/lib/format";

export const metadata = { title: "Test payment gateway" };

// Stand-in for an external payment gateway's hosted page. In production the
// customer would type card or mobile-wallet details on the gateway's own site,
// never on Gaach.
export default async function TestGatewayPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser("/orders");
  const { id } = await params;
  const order = await db.order.findFirst({ where: { id, userId: user.id } });
  if (!order) notFound();
  if (order.paymentStatus !== "PENDING" || order.status === "CANCELLED") redirect(`/orders/${id}`);
  return (
    <div className="mx-auto max-w-md">
      <div className="overflow-hidden rounded-2xl border-2 border-dashed border-indigo-300 bg-white shadow-sm">
        <div className="bg-indigo-700 px-5 py-3 text-white">
          <p className="text-xs uppercase tracking-wider text-indigo-200">Payment gateway · TEST MODE</p>
          <p className="font-semibold">Pay Gaach order #{shortId(order.id)}</p>
        </div>
        <div className="space-y-4 p-5">
          <p className="text-3xl font-bold">{taka(order.totalBdt)}</p>
          <p className="text-sm text-stone-600">
            This is a simulated gateway for testing. No card or wallet details are asked for, and no real money moves. Choose what the gateway should report back to Gaach.
          </p>
          <div className="grid gap-2">
            <form action={finishTestPayment} className="grid">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="outcome" value="success" />
              <button className="btn bg-indigo-700 text-white hover:bg-indigo-800">Approve test payment</button>
            </form>
            <form action={finishTestPayment} className="grid">
              <input type="hidden" name="orderId" value={order.id} />
              <input type="hidden" name="outcome" value="fail" />
              <button className="btn-danger">Decline payment</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
