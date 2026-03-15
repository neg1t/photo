import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full bg-[rgba(198,90,57,0.1)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--accent)]",
        className,
      )}
      {...props}
    />
  );
}
