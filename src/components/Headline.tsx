// Splits a line into words that rise in one after another.
export function RiseWords({ text, start = 0, step = 70 }: { text: string; start?: number; step?: number }) {
  return (
    <>
      {text.split(" ").map((w, i) => (
        <span key={i} className="rise-word" style={{ animationDelay: `${start + i * step}ms` }}>
          {w}{" "}
        </span>
      ))}
    </>
  );
}
