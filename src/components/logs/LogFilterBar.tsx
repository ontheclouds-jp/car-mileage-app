import { PURPOSE_LABELS, PURPOSE_OPTIONS, type Purpose } from "@/types/dailyLog";

export type PeriodMode = "all" | "thisMonth" | "lastMonth" | "custom";
export type PurposeFilter = "all" | Purpose;
export type SortOrder = "desc" | "asc";

interface LogFilterBarProps {
  periodMode: PeriodMode;
  onPeriodModeChange: (mode: PeriodMode) => void;
  customFrom: string;
  onCustomFromChange: (value: string) => void;
  customTo: string;
  onCustomToChange: (value: string) => void;
  purposeFilter: PurposeFilter;
  onPurposeFilterChange: (value: PurposeFilter) => void;
  refuelOnly: boolean;
  onRefuelOnlyChange: (value: boolean) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (value: SortOrder) => void;
}

export function LogFilterBar({
  periodMode,
  onPeriodModeChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
  purposeFilter,
  onPurposeFilterChange,
  refuelOnly,
  onRefuelOnlyChange,
  sortOrder,
  onSortOrderChange,
}: LogFilterBarProps) {
  return (
    <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <select
          value={periodMode}
          onChange={(e) => onPeriodModeChange(e.target.value as PeriodMode)}
          className="min-h-11 flex-1 rounded-lg border border-gray-300 px-2 text-sm"
        >
          <option value="all">全期間</option>
          <option value="thisMonth">今月</option>
          <option value="lastMonth">先月</option>
          <option value="custom">期間を指定</option>
        </select>

        <div className="flex overflow-hidden rounded-lg border border-gray-300">
          <button
            type="button"
            onClick={() => onSortOrderChange("desc")}
            className={`min-h-11 px-3 text-sm font-medium ${
              sortOrder === "desc" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            新しい順
          </button>
          <button
            type="button"
            onClick={() => onSortOrderChange("asc")}
            className={`min-h-11 px-3 text-sm font-medium ${
              sortOrder === "asc" ? "bg-blue-600 text-white" : "bg-white text-gray-700"
            }`}
          >
            古い順
          </button>
        </div>
      </div>

      {periodMode === "custom" && (
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customFrom}
            onChange={(e) => onCustomFromChange(e.target.value)}
            className="min-h-11 flex-1 rounded-lg border border-gray-300 px-2 text-sm"
          />
          <span className="text-gray-500">〜</span>
          <input
            type="date"
            value={customTo}
            onChange={(e) => onCustomToChange(e.target.value)}
            className="min-h-11 flex-1 rounded-lg border border-gray-300 px-2 text-sm"
          />
        </div>
      )}

      <div className="grid grid-cols-4 gap-1">
        <button
          type="button"
          onClick={() => onPurposeFilterChange("all")}
          className={`min-h-11 rounded-lg border text-sm font-medium ${
            purposeFilter === "all"
              ? "border-blue-600 bg-blue-600 text-white"
              : "border-gray-300 bg-white text-gray-700"
          }`}
        >
          すべて
        </button>
        {PURPOSE_OPTIONS.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onPurposeFilterChange(option)}
            className={`min-h-11 rounded-lg border text-sm font-medium ${
              purposeFilter === option
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-gray-300 bg-white text-gray-700"
            }`}
          >
            {PURPOSE_LABELS[option]}
          </button>
        ))}
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          checked={refuelOnly}
          onChange={(e) => onRefuelOnlyChange(e.target.checked)}
          className="h-5 w-5 rounded border-gray-300"
        />
        給油した日のみ
      </label>
    </div>
  );
}
