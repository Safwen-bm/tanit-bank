import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

// "Stamp" buttons: hard offset shadow that presses flat when clicked.
const button = cva(
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 rounded-lg border-2 border-ink px-5 py-2.5 text-sm font-semibold transition-all duration-100 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-brand text-brand-ink shadow-[3px_3px_0_0_var(--ink)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--ink)] active:translate-x-0.75 active:translate-y-0.75 active:shadow-none",
        outline:
          "bg-card text-ink shadow-[3px_3px_0_0_var(--ink)] hover:-translate-x-px hover:-translate-y-px hover:shadow-[4px_4px_0_0_var(--ink)] active:translate-x-0.75 active:translate-y-0.75 active:shadow-none",
        ghost: "border-transparent text-ink-soft hover:bg-paper-2 hover:text-ink",
      },
      size: { md: "", sm: "px-3 py-1.5 text-xs" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button> & { loading?: boolean };

export function Button({ className, variant, size, loading, children, disabled, ...props }: Props) {
  return (
    <button className={cn(button({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}