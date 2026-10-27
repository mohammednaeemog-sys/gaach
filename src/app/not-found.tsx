import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <div className="text-4xl">🍂</div>
      <h1 className="mt-2 text-xl font-bold text-forest-900">Page not found</h1>
      <p className="mt-1 text-sm text-stone-600">The page may have moved, or the link is wrong.</p>
      <Link href="/" className="btn-primary mt-4">Go home</Link>
    </div>
  );
}
