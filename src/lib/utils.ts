import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(value: bigint) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = Number(value);
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return new Intl.NumberFormat("ru-RU", {
    maximumFractionDigits: unitIndex === 0 ? 0 : 1,
  }).format(size) + ` ${units[unitIndex]}`;
}

export function formatBigIntForInput(value: bigint) {
  return value.toString();
}
