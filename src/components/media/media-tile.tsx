import Image from "next/image";
import type { ReactNode } from "react";

type MediaTileProps = {
  name: string;
  status: "PENDING" | "PROCESSING" | "READY" | "ORIGINAL_ONLY" | "FAILED";
  previewSrc?: string;
  width?: number | null;
  height?: number | null;
  footer?: ReactNode;
};

function Placeholder({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex aspect-[4/3] items-center justify-center bg-[#efe3d3] p-6 text-center">
      <div className="space-y-2">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-black/60">
          {title}
        </p>
        <p className="text-sm text-[var(--muted-foreground)]">{description}</p>
      </div>
    </div>
  );
}

export function MediaTile({
  name,
  status,
  previewSrc,
  width,
  height,
  footer,
}: MediaTileProps) {
  const isReady = status === "READY" && previewSrc && width && height;

  return (
    <div className="overflow-hidden rounded-[22px] border border-black/8 bg-white/70">
      {isReady ? (
        <Image
          src={previewSrc}
          alt={name}
          width={width}
          height={height}
          className="aspect-[4/3] h-auto w-full object-cover"
        />
      ) : status === "ORIGINAL_ONLY" ? (
        <Placeholder
          title="Original Only"
          description="Формат сохранен, но превью для браузера недоступно."
        />
      ) : (
        <Placeholder
          title="Processing"
          description="Файл загружен. Превью появится после фоновой обработки."
        />
      )}
      <div className="space-y-3 p-4 text-sm">
        <p className="line-clamp-1 font-medium">{name}</p>
        {footer}
      </div>
    </div>
  );
}
