import { PURPOSE_LABELS, PURPOSE_OPTIONS, type Purpose } from "@/types/dailyLog";

const BAR_COLOR_CLASSES: Record<Purpose, string> = {
  work: "bg-blue-500",
  private: "bg-green-500",
  other: "bg-gray-400",
};

const DOT_COLOR_CLASSES: Record<Purpose, string> = {
  work: "bg-blue-500",
  private: "bg-green-500",
  other: "bg-gray-400",
};

interface PurposeBreakdownBarProps {
  distanceByPurpose: Record<Purpose, number>;
  total: number;
}

export function PurposeBreakdownBar({ distanceByPurpose, total }: PurposeBreakdownBarProps) {
  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-gray-100">
        {total > 0 &&
          PURPOSE_OPTIONS.map((purpose) => {
            const value = distanceByPurpose[purpose];
            if (value <= 0) return null;
            const widthPercent = (value / total) * 100;
            return (
              <div
                key={purpose}
                className={BAR_COLOR_CLASSES[purpose]}
                style={{ width: `${widthPercent}%` }}
              />
            );
          })}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {PURPOSE_OPTIONS.map((purpose) => (
          <div key={purpose} className="flex items-center gap-1.5 text-sm text-gray-700">
            <span className={`h-2.5 w-2.5 rounded-full ${DOT_COLOR_CLASSES[purpose]}`} />
            {PURPOSE_LABELS[purpose]}：{distanceByPurpose[purpose].toLocaleString()} km
          </div>
        ))}
      </div>
    </div>
  );
}
