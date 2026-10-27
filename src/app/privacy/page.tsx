import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";

export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <InfoPage eyebrow="Your data" title="Privacy policy" updated="27 October 2026"
      intro="We collect only what we need to recommend trees, deliver your order and help you care for it. We never sell your information.">
      <h2>What we collect</h2>
      <ul>
        <li><strong>Account details:</strong> your name, email and password. Passwords are stored scrambled (hashed), so nobody at Gaach can read them.</li>
        <li><strong>Delivery details:</strong> the receiver&apos;s name, mobile number and address you enter at checkout.</li>
        <li><strong>Your places:</strong> saved sites (district, space, sunlight, soil) so we can suggest suitable trees.</li>
        <li><strong>Orders and trees:</strong> what you bought, so the Tree Advisor can give care reminders for your own trees.</li>
        <li><strong>Reviews and messages:</strong> ratings and comments you post, messages you send through the Contact page, and chats with the Tree Advisor.</li>
        <li><strong>Newsletter:</strong> your email, only if you sign up.</li>
      </ul>

      <h2>Photos you check with the Tree Advisor</h2>
      <p>When you send a plant photo, it is passed to Google&apos;s Gemini service to look for signs of pests or disease. We do not keep the photo. Only a short note (&quot;photo sent&quot;) and the advice are saved in your chat.</p>

      <h2>How we use it</h2>
      <ul>
        <li>To recommend trees that suit your place, deliver orders and contact you about them.</li>
        <li>To send password reset links and replies to your messages.</li>
        <li>To send the newsletter, if you signed up.</li>
      </ul>

      <h2>Cookies</h2>
      <p>We use one cookie to keep you logged in. We don&apos;t use advertising or tracking cookies.</p>

      <h2>Who else sees it</h2>
      <p>Your delivery details are shared with the courier who brings your plants. Our hosting, database, email and AI providers process data only to run the site. Your name may appear in short form (for example &quot;Rahim U.&quot;) next to reviews you write.</p>

      <h2>Your choices</h2>
      <ul>
        <li>Update your name and saved places any time in <Link href="/account">My account</Link>.</li>
        <li>Delete your own reviews from the tree page.</li>
        <li>Ask us to remove your newsletter sign-up, or to delete your account and data, through the <Link href="/contact">Contact page</Link>. Order records may be kept as long as the law requires.</li>
      </ul>
    </InfoPage>
  );
}
