"use client";

import { useState } from "react";
import { useAirQuality } from "@/hooks/use-air-quality";
import { getAqiGrade } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CITIES = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "경기", "강원", "충북", "충남", "전북", "전남", "경북", "경남", "제주"];

export default function AirQualityPage() {
  const [city, setCity] = useState("서울");
  const { items, error, isLoading } = useAirQuality(city);
  const { t } = useLanguage();

  const chartData = items.slice(0, 10).map((item) => ({
    name: item.stationName,
    PM10: Number(item.pm10Value) || 0,
    "PM2.5": Number(item.pm25Value) || 0,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
            {t.airQualityPageTitle}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            {t.airQualitySubtitle}
          </p>
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          style={{
            background: "#ffffff",
            border: "1px solid rgba(0,0,0,0.12)",
            color: "#334155",
            boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
          }}
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-4">
          <div
            className="rounded-2xl border p-6"
            style={{
              background: "#ffffff",
              borderColor: "rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div
              className="mb-4 h-4 w-40 animate-pulse rounded"
              style={{ background: "#e2e8f0" }}
            />
            <div
              className="h-[280px] animate-pulse rounded"
              style={{ background: "#f1f5f9" }}
            />
          </div>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "#ffffff",
              borderColor: "rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}
              >
                <div className="h-4 w-24 animate-pulse rounded" style={{ background: "#e2e8f0" }} />
                <div className="h-4 w-16 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                <div className="h-4 w-16 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                <div className="h-4 w-20 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div
          className="rounded-xl p-4 text-sm"
          style={{
            background: "rgba(239,68,68,0.06)",
            border: "1px solid rgba(239,68,68,0.2)",
            color: "#dc2626",
          }}
        >
          {t.dataLoadError}
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <>
          {/* 차트 */}
          <div
            className="mb-6 rounded-2xl border p-6"
            style={{
              background: "#ffffff",
              borderColor: "rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: "#64748b" }}>
              {t.airQualityChartTitle}
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                  axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                  tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                  tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
                />
                <Tooltip
                  contentStyle={{
                    background: "#ffffff",
                    border: "1px solid rgba(0,0,0,0.1)",
                    borderRadius: "12px",
                    color: "#1e293b",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                  }}
                />
                <Legend wrapperStyle={{ color: "#64748b" }} />
                <Bar dataKey="PM10" fill="#3b82f6" name="PM10" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PM2.5" fill="#f97316" name="PM2.5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 테이블 */}
          <div
            className="rounded-2xl border overflow-hidden"
            style={{
              background: "#ffffff",
              borderColor: "rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ borderBottom: "1px solid rgba(0,0,0,0.07)", background: "#f8fafc" }}>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.stationHeader}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>PM10</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>PM2.5</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.aqiHeader}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.gradeHeader}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.measuredAt}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const grade = getAqiGrade(item.khaiGrade);
                    return (
                      <tr
                        key={idx}
                        className="transition-colors duration-200"
                        style={{ borderBottom: "1px solid rgba(0,0,0,0.04)" }}
                        onMouseEnter={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = "#f8fafc";
                        }}
                        onMouseLeave={(e) => {
                          (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                        }}
                      >
                        <td className="px-4 py-3 font-medium whitespace-nowrap" style={{ color: "#1e293b" }}>
                          {item.stationName}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#475569" }}>
                          {item.pm10Value ?? "-"} μg/m³
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#475569" }}>
                          {item.pm25Value ?? "-"} μg/m³
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#475569" }}>
                          {item.khaiValue ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${grade.color} ${grade.bg}`}
                          >
                            {grade.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs whitespace-nowrap" style={{ color: "#94a3b8" }}>
                          {item.dataTime}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div
          className="rounded-xl p-8 text-center text-sm"
          style={{
            background: "#f8fafc",
            border: "1px solid rgba(0,0,0,0.07)",
            color: "#94a3b8",
          }}
        >
          {t.noAirQualityData}
        </div>
      )}
    </div>
  );
}
