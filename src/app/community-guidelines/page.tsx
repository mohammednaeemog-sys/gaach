import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Community guidelines" };

export default function GuidelinesPage() {
  return (
    <InfoPage eyebrow="Reviews and comments" title="Community guidelines" updated="27 October 2026"
      intro="Reviews help other growers choose the right tree. Please keep them honest, kind and useful.">
      <h2>Please do</h2>
      <ul>
        <li>Share your own experience: how the plant arrived, how it grew, and where you planted it (rooftop, balcony, village yard).</li>
        <li>Mention your district or conditions. It helps people nearby.</li>
        <li>Be fair. If something went wrong, say what happened so others can learn.</li>
      </ul>

      <h2>Please don&apos;t</h2>
      <ul>
        <li>Use insults, hate speech or threats, or attack other people.</li>
        <li>Post phone numbers, addresses or other personal details.</li>
        <li>Advertise other shops, post links or spam.</li>
        <li>Write fake reviews, or review a plant on someone else&apos;s behalf.</li>
      </ul>

      <h2>How we moderate</h2>
      <p>Reviews marked &quot;Bought from Gaach&quot; come from customers with an order for that tree. We don&apos;t remove reviews just because they are negative, but we may hide reviews that break these guidelines. If you see one, tell us through the <Link href="/contact">Contact page</Link>.</p>
    </InfoPage>
  );
}
