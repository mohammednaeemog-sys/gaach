import Link from "next/link";
import { InfoPage } from "@/components/InfoPage";
import { Icon } from "@/components/icons";
import { db } from "@/lib/db";

export const metadata = { title: "About us" };

export default async function AboutPage() {
  const [trees, districts] = await Promise.all([db.tree.count({ where: { published: true } }), db.district.count()]);
  const points = [
    { icon: <Icon.pin className="h-5 w-5" />, title: "Made for your district", text: "We match trees to the rainfall, salinity, flooding and soil of each district, so you plant something that will thrive." },
    { icon: <Icon.pot className="h-5 w-5" />, title: "Healthy saplings", text: "Every sapling is checked and packed with care, then delivered to your door with cash on delivery." },
    { icon: <Icon.chat className="h-5 w-5" />, title: "Help after you plant", text: "The Tree Advisor and care guides answer questions about watering, pests and yellow leaves, for the trees you own." },
  ];
  return (
    <InfoPage eyebrow="Our story" title="About Gaach"
      intro="Gaach (গাছ) means tree. We help families across Bangladesh plant the right tree in the right place, from a Dhaka rooftop to a village courtyard.">
      <h2 className="!mt-0">Why we started</h2>
      <p>Many saplings die in their first year, not because people don&apos;t care, but because the tree didn&apos;t suit the place: too much shade, salty soil, or a pot too small for a tree that wants to be big. We built Gaach so anyone can find a tree that fits their space and climate, buy it with confidence, and get help keeping it alive.</p>

      <div className="not-prose mt-6 grid gap-3 sm:grid-cols-3">
        {points.map((p) => (
          <div key={p.title} className="rounded-2xl bg-mint-50 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-forest-700">{p.icon}</span>
            <p className="mt-3 font-semibold text-forest-900">{p.title}</p>
            <p className="mt-1 text-sm text-stone-600">{p.text}</p>
          </div>
        ))}
      </div>

      <h2>Gaach in numbers</h2>
      <ul>
        <li>{trees} tree species, each with care steps from planting to harvest.</li>
        <li>{districts} districts covered, with delivery across the country.</li>
      </ul>

      <h2>Who runs Gaach</h2>
      <p>Gaach is run by Mohammed Naeem, who looks after the catalogue, the nursery partners and customer support. For partnerships, press or anything that needs a direct reply, you can write to <a href="mailto:mohammed.naeem.og@gmail.com">mohammed.naeem.og@gmail.com</a>. For orders and plant questions, the <Link href="/contact">contact page</Link> or the Tree Advisor is usually the quickest way to get help.</p>

      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/recommend" className="btn-primary !no-underline">Find trees for my place</Link>
        <Link href="/contact" className="btn-ghost !no-underline">Talk to us</Link>
      </div>
    </InfoPage>
  );
}
