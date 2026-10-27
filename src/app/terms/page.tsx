import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Terms and conditions" };

export default function TermsPage() {
  return (
    <InfoPage eyebrow="Using Gaach" title="Terms and conditions" updated="27 October 2026"
      intro="By using Gaach or placing an order, you agree to these terms. They are written to be short and clear.">
      <h2>Your account</h2>
      <ul>
        <li>Give your real name and a working email and phone number so we can deliver and reach you.</li>
        <li>Keep your password private. You are responsible for orders placed from your account.</li>
        <li>We may close accounts used for fraud, abuse or fake orders.</li>
      </ul>

      <h2>Orders and prices</h2>
      <ul>
        <li>All prices are in Bangladeshi Taka (৳) and include the plant and pot shown. One flat delivery fee is added at checkout.</li>
        <li>An order is confirmed when it appears in <Link href="/orders">My orders</Link>. If a plant runs out or is not healthy enough to send, we will call you and offer a swap or cancel that item.</li>
        <li>Plants are living things, so size, shape and leaf colour can differ a little from the photos.</li>
      </ul>

      <h2>Payment</h2>
      <p>You can pay cash on delivery. Please have the exact amount ready when the plants arrive.</p>

      <h2>Delivery</h2>
      <p>We deliver to all 64 districts. Delivery times depend on your location and the weather; we will contact you before delivery. Please check your plants when they arrive.</p>

      <h2>Advice from the Tree Advisor and guides</h2>
      <p>Recommendations, care guides and photo checks are given in good faith to help you grow healthy trees. They are guidance, not a guarantee. For serious pest or disease problems, also ask a local agriculture officer.</p>

      <h2>Reviews and content</h2>
      <p>Reviews and comments must follow our <Link href="/community-guidelines">community guidelines</Link>. We may hide content that breaks them.</p>

      <h2>Returns</h2>
      <p>See our <Link href="/refund-policy">refund and return policy</Link>.</p>

      <h2>Changes</h2>
      <p>We may update these terms. The date at the top shows the latest version.</p>
    </InfoPage>
  );
}
