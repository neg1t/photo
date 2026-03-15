import type { HTMLAttributes } from "react";

import { cn } from "@/lib/utils";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[28px] border border-black/8 bg-white/80 p-6 shadow-[0_16px_48px_rgba(36,27,19,0.08)] backdrop-blur",
        className,
      )}
      {...props}
    />
  );
}
