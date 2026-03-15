import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-full text-sm font-semibold transition disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--accent)] px-5 py-3 text-[var(--accent-foreground)] shadow-[0_12px_32px_rgba(198,90,57,0.22)] hover:translate-y-[-1px]",
        secondary:
          "bg-white/80 px-5 py-3 text-[var(--foreground)] ring-1 ring-black/10 hover:bg-white",
        ghost:
          "px-4 py-2 text-[var(--muted-foreground)] hover:bg-black/5 hover:text-[var(--foreground)]",
        danger:
          "bg-[#7a1f1f] px-4 py-2 text-white hover:bg-[#611919]",
      },
      size: {
        default: "",
        sm: "px-3 py-2 text-xs",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  };

export function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      className={cn(buttonVariants({ variant, size }), className)}
      {...props}
    />
  );
}
