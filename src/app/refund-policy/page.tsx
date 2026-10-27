import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Refund and return policy" };

export default function RefundPage() {
  return (
    <InfoPage eyebrow="Healthy plant promise" title="Refund and return policy" updated="27 October 2026"
      intro="Every sapling is checked before it leaves the nursery. If something goes wrong on the way, we will make it right.">
      <h2>Check your plants on delivery</h2>
      <p>Please open the package in front of the delivery person if you can. If a plant is badly damaged, you may refuse that item and you won&apos;t pay for it.</p>

      <h2>Damaged or unhealthy on arrival</h2>
      <ul>
        <li>Tell us within <strong>48 hours</strong> of delivery through the <Link href="/contact">Contact page</Link>, with your order number and a clear photo of the plant.</li>
        <li>We will send a <strong>free replacement</strong>, or refund the price of that plant if a replacement isn&apos;t available.</li>
        <li>Refunds are sent by bKash, Nagad or bank transfer within <strong>7 working days</strong> of approval.</li>
      </ul>

      <h2>Cancelling an order</h2>
      <ul>
        <li>You can cancel free of charge before the order is sent out. Contact us as soon as possible.</li>
        <li>Once the plants are on the way, the order can&apos;t be cancelled, but the damaged-on-arrival promise above still applies.</li>
      </ul>

      <h2>What isn&apos;t covered</h2>
      <ul>
        <li>Plants that were healthy on arrival but later suffered from missed watering, the wrong spot, or other care issues. We&apos;re still happy to help: ask the <Link href="/assistant">Tree Advisor</Link> or check the <Link href="/guides">care guides</Link>.</li>
        <li>Small differences in size, shape or leaf colour from the photos.</li>
        <li>Pots and plants returned without contacting us first.</li>
      </ul>
    </InfoPage>
  );
}
