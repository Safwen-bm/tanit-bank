import { cn } from "@/lib/utils";

/** The sign of Tanit, drawn solid: a head, raised arms, and a triangular body. */
export function TanitMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" className={cn("size-6", className)} aria-hidden="true">
      <circle cx="16" cy="5.6" r="3.4" />
      <rect x="14.8" y="8.6" width="2.4" height="5" />
      <path d="M3 8h2.8v5.4h20.4V8H29v9H3z" />
      <path d="M16 19.4 25.6 30H6.4z" />
    </svg>
  );
}
