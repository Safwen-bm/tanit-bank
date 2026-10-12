import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex cursor-pointer select-none items-center justify-center gap-2.5 rounded-[3px] px-5 py-3 text-sm font-semibold whitespace-nowrap transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand active:translate-y-px disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-brand text-brand-ink hover:bg-ink hover:text-paper",
        outline: "border border-ink text-ink hover:bg-ink hover:text-paper",
        ghost: "text-ink hover:bg-ink/6",
        // For always-dark and brand-coloured surfaces.
        inverse: "bg-deep-ink text-deep hover:bg-gold hover:text-deep",
        "inverse-outline": "border border-current text-current hover:border-deep-ink hover:bg-deep-ink hover:text-deep",
      },
      size: { md: "", sm: "px-3.5 py-2 text-xs", lg: "px-7 py-4 text-base" },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

type Props = ButtonHTMLAttributes<HTMLButtonElement> & VariantProps<typeof buttonVariants> & { loading?: boolean };

export function Button({ className, variant, size, loading, children, disabled, ...props }: Props) {
  return (
    <button className={cn(buttonVariants({ variant, size }), className)} disabled={disabled || loading} {...props}>
      {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  );
}
