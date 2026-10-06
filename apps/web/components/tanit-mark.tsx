import { cn } from "@/lib/utils";

/** The sign of Tanit: disc, raised-arm bar and triangle. */
export function TanitMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={cn("size-6", className)}
      aria-hidden="true"
    >
      <circle cx="12" cy="4.2" r="2.2" />
      <path d="M12 6.4v4.1" />
      <path d="M4.5 8l0 2.5h15V8" />
      <path d="M7.5 21 12 10.5 16.5 21Z" />
    </svg>
  );
}