"use client";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const dev = process.env.NODE_ENV === "development";
  return (
    <div className="card mx-auto max-w-md p-8 text-center">
      <h1 className="text-xl font-bold text-forest-900">Something went wrong</h1>
      <p className="mt-1 text-sm text-stone-600">Please try again. If it keeps happening, reload the page.</p>
      {dev && (
        <pre className="mt-4 max-h-48 overflow-auto rounded-xl bg-red-50 p-3 text-left text-xs whitespace-pre-wrap text-red-800">
          {error.message}
          {error.digest ? `\n(digest ${error.digest})` : ""}
        </pre>
      )}
      <button onClick={reset} className="btn-primary mt-4">Try again</button>
    </div>
  );
}
