import { AlertCircle, CheckCircle2 } from "lucide-react";

import { cn } from "@/lib/utils";

type NoticeBannerProps = {
  error?: string;
  success?: string;
};

export function NoticeBanner({ error, success }: NoticeBannerProps) {
  if (!error && !success) {
    return null;
  }

  const isError = Boolean(error);
  const message = error ?? success;
  const Icon = isError ? AlertCircle : CheckCircle2;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-3xl border px-4 py-4 text-sm",
        isError
          ? "border-[#d9a4a4] bg-[#fff4f4] text-[#7a1f1f]"
          : "border-[#b7d0bc] bg-[#f4fff5] text-[#255e31]",
      )}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" />
      <p>{message}</p>
    </div>
  );
}
