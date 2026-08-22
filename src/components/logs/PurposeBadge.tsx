import { PURPOSE_COLOR_CLASSES, PURPOSE_LABELS, type Purpose } from "@/types/dailyLog";

export function PurposeBadge({ purpose }: { purpose: Purpose }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-sm font-medium ${PURPOSE_COLOR_CLASSES[purpose]}`}
    >
      {PURPOSE_LABELS[purpose]}
    </span>
  );
}
