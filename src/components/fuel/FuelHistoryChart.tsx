"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatDateShort } from "@/lib/utils/date";
import type { FuelHistoryEntry } from "@/lib/repositories/fuelHistoryRepository";

export function FuelHistoryChart({ entries }: { entries: FuelHistoryEntry[] }) {
  const chartData = entries.map((entry) => ({
    logDate: entry.logDate,
    label: formatDateShort(entry.logDate),
    fuelEfficiency: entry.fuelEfficiency ?? undefined,
  }));

  return (
    <div className="h-64 w-full rounded-lg border border-gray-200 bg-white p-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 8, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
          <YAxis
            tick={{ fontSize: 12 }}
            unit="km/L"
            domain={["auto", "auto"]}
            width={64}
          />
          <Tooltip
            formatter={(value) => [`${Number(value).toFixed(1)} km/L`, "燃費"]}
            labelFormatter={(_, payload) => payload?.[0]?.payload?.logDate ?? ""}
          />
          <Line
            type="monotone"
            dataKey="fuelEfficiency"
            stroke="#2563eb"
            strokeWidth={2}
            dot={{ r: 3 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
