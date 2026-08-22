"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  DuplicateDateError,
  OdometerBackwardError,
  OdometerExceedsNextError,
  getAllDailyLogs,
  getPreviousLog,
  getPreviousRefuelLog,
  saveDailyLog,
} from "@/lib/repositories/dailyLogRepository";
import { dailyLogFormSchema } from "@/lib/validation/dailyLogSchema";
import { todayStr } from "@/lib/utils/date";
import {
  PURPOSE_LABELS,
  PURPOSE_OPTIONS,
  type DailyLog,
  type DailyLogInput,
  type Purpose,
} from "@/types/dailyLog";

interface LogFormProps {
  mode: "create" | "edit";
  initialLog?: DailyLog;
}

type FieldErrors = Partial<Record<keyof DailyLogInput, string>>;

export function LogForm({ mode, initialLog }: LogFormProps) {
  const router = useRouter();

  const [logDate, setLogDate] = useState(initialLog?.logDate ?? todayStr());
  const [odometerReading, setOdometerReading] = useState(
    initialLog ? String(initialLog.odometerReading) : ""
  );
  const [purpose, setPurpose] = useState<Purpose>(initialLog?.purpose ?? "work");
  const [isRefueled, setIsRefueled] = useState(initialLog?.isRefueled ?? false);
  const [fuelLiters, setFuelLiters] = useState(
    initialLog?.fuelLiters != null ? String(initialLog.fuelLiters) : ""
  );
  const [memo, setMemo] = useState(initialLog?.memo ?? "");

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previewDistance, setPreviewDistance] = useState<number | null | undefined>(undefined);
  const [previewFuelEfficiency, setPreviewFuelEfficiency] = useState<
    number | null | undefined
  >(undefined);

  const [pendingDuplicate, setPendingDuplicate] = useState<DailyLog | null>(null);
  const [pendingInput, setPendingInput] = useState<DailyLogInput | null>(null);

  const excludeId = initialLog?.id;
  const purposeTouchedRef = useRef(false);

  // F10: 新規登録時は直前に入力した用途を初期値として提案する
  useEffect(() => {
    if (mode !== "create") return;
    let cancelled = false;
    getAllDailyLogs().then((logs) => {
      if (cancelled || purposeTouchedRef.current || logs.length === 0) return;
      setPurpose(logs[0].purpose);
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const handlePurposeChange = (option: Purpose) => {
    purposeTouchedRef.current = true;
    setPurpose(option);
  };

  useEffect(() => {
    let cancelled = false;
    const odo = Number(odometerReading);
    if (!logDate || odometerReading === "" || Number.isNaN(odo)) {
      setPreviewDistance(undefined);
      return;
    }
    getPreviousLog(logDate, excludeId).then((prev) => {
      if (cancelled) return;
      setPreviewDistance(prev ? odo - prev.odometerReading : null);
    });
    return () => {
      cancelled = true;
    };
  }, [logDate, odometerReading, excludeId]);

  useEffect(() => {
    let cancelled = false;
    const odo = Number(odometerReading);
    const liters = Number(fuelLiters);
    if (!isRefueled || !logDate || odometerReading === "" || Number.isNaN(odo) || fuelLiters === "" || Number.isNaN(liters) || liters <= 0) {
      setPreviewFuelEfficiency(undefined);
      return;
    }
    getPreviousRefuelLog(logDate, excludeId).then((prev) => {
      if (cancelled) return;
      setPreviewFuelEfficiency(prev ? (odo - prev.odometerReading) / liters : null);
    });
    return () => {
      cancelled = true;
    };
  }, [logDate, odometerReading, isRefueled, fuelLiters, excludeId]);

  const buildInput = (): DailyLogInput | null => {
    // Number("") は 0 になってしまうため、未入力は明示的にNaN扱いにしてrequiredチェックを効かせる
    const parsedOdo = odometerReading.trim() === "" ? NaN : Number(odometerReading);
    const parsedFuel = fuelLiters === "" ? null : Number(fuelLiters);

    const candidate = {
      logDate,
      odometerReading: parsedOdo,
      purpose,
      isRefueled,
      fuelLiters: parsedFuel,
      memo,
    };

    const result = dailyLogFormSchema.safeParse(candidate);
    if (!result.success) {
      const errors: FieldErrors = {};
      for (const issue of result.error.issues) {
        const key = issue.path[0] as keyof DailyLogInput;
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return null;
    }

    setFieldErrors({});
    return candidate as DailyLogInput;
  };

  const doSave = async (input: DailyLogInput, confirmOverwrite: boolean) => {
    setSubmitting(true);
    setFormError(null);
    try {
      const saved = await saveDailyLog(input, { id: initialLog?.id, confirmOverwrite });
      router.push(`/logs/${saved.id}`);
    } catch (err) {
      if (err instanceof DuplicateDateError) {
        setPendingDuplicate(err.existing);
        setPendingInput(input);
      } else if (err instanceof OdometerBackwardError) {
        setFieldErrors((prev) => ({ ...prev, odometerReading: err.message }));
      } else if (err instanceof OdometerExceedsNextError) {
        setFieldErrors((prev) => ({ ...prev, odometerReading: err.message }));
      } else {
        setFormError("保存中にエラーが発生しました。もう一度お試しください。");
        console.error(err);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const input = buildInput();
    if (!input) return;
    await doSave(input, false);
  };

  const handleConfirmOverwrite = async () => {
    if (!pendingInput) return;
    setPendingDuplicate(null);
    await doSave(pendingInput, true);
    setPendingInput(null);
  };

  const handleCancelOverwrite = () => {
    setPendingDuplicate(null);
    setPendingInput(null);
  };

  const previewText = useMemo(() => {
    if (previewDistance === undefined) return null;
    if (previewDistance === null) return "初回記録のため、前回からの走行距離はありません";
    if (previewDistance < 0) return "前回の記録より値が小さいため計算できません";
    return `前回記録からの走行距離：${previewDistance.toLocaleString()} km`;
  }, [previewDistance]);

  const previewFuelEfficiencyText = useMemo(() => {
    if (previewFuelEfficiency === undefined) return null;
    if (previewFuelEfficiency === null) return "初回の給油のため燃費は計算できません";
    if (previewFuelEfficiency < 0) return "前回の給油記録より値が小さいため計算できません";
    return `この区間の燃費：${previewFuelEfficiency.toFixed(1)} km/L`;
  }, [previewFuelEfficiency]);

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label htmlFor="logDate" className="block text-base font-medium text-gray-900">
          日付 <span className="text-red-600">*</span>
        </label>
        <input
          id="logDate"
          type="date"
          value={logDate}
          max={todayStr()}
          onChange={(e) => setLogDate(e.target.value)}
          className="mt-1 block w-full min-h-11 rounded-lg border border-gray-300 px-3 text-base"
        />
        {fieldErrors.logDate && (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.logDate}</p>
        )}
      </div>

      <div>
        <label htmlFor="odometerReading" className="block text-base font-medium text-gray-900">
          走行距離計の読み（km） <span className="text-red-600">*</span>
        </label>
        <input
          id="odometerReading"
          type="number"
          inputMode="numeric"
          pattern="[0-9]*"
          step={1}
          min={0}
          value={odometerReading}
          onChange={(e) => setOdometerReading(e.target.value)}
          placeholder="例：51649"
          className="mt-1 block w-full min-h-11 rounded-lg border border-gray-300 px-3 text-xl font-bold"
        />
        {fieldErrors.odometerReading ? (
          <p className="mt-1 text-sm text-red-600">{fieldErrors.odometerReading}</p>
        ) : (
          previewText && (
            <p className="mt-1 text-base font-bold text-blue-700">{previewText}</p>
          )
        )}
      </div>

      <div>
        <span className="block text-base font-medium text-gray-900">
          用途 <span className="text-red-600">*</span>
        </span>
        <div className="mt-1 grid grid-cols-3 gap-2">
          {PURPOSE_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handlePurposeChange(option)}
              className={`min-h-11 rounded-lg border text-base font-medium ${
                purpose === option
                  ? "border-blue-600 bg-blue-600 text-white"
                  : "border-gray-300 bg-white text-gray-700"
              }`}
            >
              {PURPOSE_LABELS[option]}
            </button>
          ))}
        </div>
        {fieldErrors.purpose && <p className="mt-1 text-sm text-red-600">{fieldErrors.purpose}</p>}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="text-base font-medium text-gray-900">給油した</span>
          <button
            type="button"
            role="switch"
            aria-checked={isRefueled}
            onClick={() => setIsRefueled((v) => !v)}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              isRefueled ? "bg-blue-600" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-transform ${
                isRefueled ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {isRefueled && (
          <div className="mt-3">
            <label htmlFor="fuelLiters" className="block text-base font-medium text-gray-900">
              給油量（リットル） <span className="text-red-600">*</span>
            </label>
            <input
              id="fuelLiters"
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={fuelLiters}
              onChange={(e) => setFuelLiters(e.target.value)}
              placeholder="例：35.5"
              className="mt-1 block w-full min-h-11 rounded-lg border border-gray-300 px-3 text-base"
            />
            {fieldErrors.fuelLiters ? (
              <p className="mt-1 text-sm text-red-600">{fieldErrors.fuelLiters}</p>
            ) : (
              previewFuelEfficiencyText && (
                <p className="mt-1 text-base font-bold text-blue-700">
                  {previewFuelEfficiencyText}
                </p>
              )
            )}
            <p className="mt-2 text-sm text-gray-500">
              ※燃費は満タン法（毎回満タンまで給油する前提）で計算します。満タンにしなかった場合は数値の精度が下がります。
            </p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="memo" className="block text-base font-medium text-gray-900">
          メモ
        </label>
        <textarea
          id="memo"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-base"
        />
        {fieldErrors.memo && <p className="mt-1 text-sm text-red-600">{fieldErrors.memo}</p>}
      </div>

      {formError && <p className="text-sm text-red-600">{formError}</p>}

      <div className="flex gap-2">
        <Button type="submit" disabled={submitting} className="flex-1">
          {mode === "create" ? "登録する" : "更新する"}
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => router.back()}
          disabled={submitting}
        >
          キャンセル
        </Button>
      </div>

      <ConfirmDialog
        open={pendingDuplicate !== null}
        title="上書き確認"
        message={
          pendingDuplicate
            ? `${pendingDuplicate.logDate} の記録は既に存在します。上書きしますか？`
            : ""
        }
        confirmLabel="上書きする"
        onConfirm={handleConfirmOverwrite}
        onCancel={handleCancelOverwrite}
      />
    </form>
  );
}
