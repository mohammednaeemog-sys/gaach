// Gaach brand: a spreading tree on grass in a round nursery seal.
// The artwork is drawn by scripts/make-logo.mjs into public/brand/.
/* eslint-disable @next/next/no-img-element */
type Props = { size?: number; className?: string; withWord?: boolean; tone?: "light" | "dark" };

export function LogoMark({ size = 40, className = "" }: { size?: number; className?: string }) {
  return <img src="/brand/gaach-mark.svg" width={size} height={size} alt="" aria-hidden className={`logo-mark shrink-0 ${className}`} />;
}

// The full badge with the ribbon and lettering
export function LogoBadge({ size = 140, className = "" }: { size?: number; className?: string }) {
  return <img src="/brand/gaach-badge.svg" width={size} height={size} alt="Gaach, trees for Bangladesh" className={`logo-badge ${className}`} />;
}

export function Logo({ size = 40, className = "", withWord = true, tone = "light" }: Props) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark size={size} />
      {withWord && (
        <span className="flex flex-col leading-none">
          <span className={`font-brand text-[1.12em] font-bold tracking-[0.08em] sm:text-[1.3em] sm:tracking-[0.12em] ${tone === "light" ? "text-[#f7f2e2]" : "text-forest-900"}`}>GAACH</span>
          <span className={`mt-1 hidden text-[0.56em] font-medium tracking-[0.22em] sm:block ${tone === "light" ? "text-mint-200/75" : "text-lime-600"}`}>TREES FOR BANGLADESH</span>
        </span>
      )}
    </span>
  );
}
