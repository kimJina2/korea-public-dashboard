"use client";

import { useState } from "react";
import { useWeather } from "@/hooks/use-weather";
import { useLanguage } from "@/contexts/language-context";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CITIES = ["서울", "부산", "대구", "인천", "광주", "대전", "울산", "제주"];

function getSkyEmoji(sky?: string, pty?: string) {
  if (pty && pty !== "없음") {
    if (pty.includes("눈")) return "❄️";
    if (pty.includes("비")) return "🌧️";
    return "🌦️";
  }
  switch (sky) {
    case "맑음": return "☀️";
    case "구름많음": return "⛅";
    case "흐림": return "☁️";
    default: return "🌤️";
  }
}

export default function WeatherPage() {
  const [city, setCity] = useState("서울");
  const { forecasts, error, isLoading } = useWeather(city);
  const { t } = useLanguage();

  const chartData = forecasts.map((f) => ({
    time: `${f.date.slice(5)} ${f.time}`,
    temp: Number(f.temp),
    pop: Number(f.pop),
    humidity: Number(f.humidity),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
            {t.weatherPageTitle}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            {t.weatherSubtitle}
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
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border p-5"
                style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              >
                <div className="mx-auto mb-2 h-8 w-8 animate-pulse rounded-full" style={{ background: "#e2e8f0" }} />
                <div className="mx-auto mb-1 h-8 w-20 animate-pulse rounded" style={{ background: "#e2e8f0" }} />
                <div className="mx-auto h-4 w-16 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
              </div>
            ))}
          </div>
          <div
            className="rounded-2xl border p-6"
            style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            <div className="mb-4 h-4 w-48 animate-pulse rounded" style={{ background: "#e2e8f0" }} />
            <div className="h-[260px] animate-pulse rounded" style={{ background: "#f1f5f9" }} />
          </div>
          <div
            className="rounded-2xl border overflow-hidden"
            style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            {[...Array(6)].map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="h-4 w-20 animate-pulse rounded" style={{ background: "#e2e8f0" }} />
                <div className="h-4 w-12 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                <div className="h-4 w-12 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                <div className="h-4 w-16 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
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

      {!isLoading && !error && forecasts.length > 0 && (
        <>
          {/* 현재 날씨 요약 */}
          {forecasts[0] && (
            <div className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div
                className="rounded-2xl border p-5 text-center transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "rgba(245,158,11,0.06)",
                  borderColor: "rgba(245,158,11,0.2)",
                  boxShadow: "0 2px 12px rgba(245,158,11,0.06)",
                }}
              >
                <div className="text-4xl">{getSkyEmoji(forecasts[0].sky, forecasts[0].pty)}</div>
                <div className="mt-2 text-3xl font-bold" style={{ color: "#d97706" }}>
                  {forecasts[0].temp}°C
                </div>
                <div className="text-sm" style={{ color: "#92400e" }}>
                  {forecasts[0].sky}
                </div>
              </div>
              <div
                className="rounded-2xl border p-5 text-center transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "rgba(59,130,246,0.06)",
                  borderColor: "rgba(59,130,246,0.2)",
                  boxShadow: "0 2px 12px rgba(59,130,246,0.06)",
                }}
              >
                <div className="text-2xl">🌧️</div>
                <div className="mt-2 text-2xl font-bold" style={{ color: "#3b82f6" }}>
                  {forecasts[0].pop}%
                </div>
                <div className="text-sm" style={{ color: "#1d4ed8" }}>{t.precipProb}</div>
              </div>
              <div
                className="rounded-2xl border p-5 text-center transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "rgba(6,182,212,0.06)",
                  borderColor: "rgba(6,182,212,0.2)",
                  boxShadow: "0 2px 12px rgba(6,182,212,0.06)",
                }}
              >
                <div className="text-2xl">💧</div>
                <div className="mt-2 text-2xl font-bold" style={{ color: "#0891b2" }}>
                  {forecasts[0].humidity}%
                </div>
                <div className="text-sm" style={{ color: "#0e7490" }}>{t.humidity}</div>
              </div>
              <div
                className="rounded-2xl border p-5 text-center transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: "#f8fafc",
                  borderColor: "rgba(0,0,0,0.1)",
                  boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
                }}
              >
                <div className="text-2xl">💨</div>
                <div className="mt-2 text-2xl font-bold" style={{ color: "#334155" }}>
                  {forecasts[0].windSpeed} m/s
                </div>
                <div className="text-sm" style={{ color: "#64748b" }}>{t.windSpeed}</div>
              </div>
            </div>
          )}

          {/* 기온 차트 */}
          <div
            className="mb-6 rounded-2xl border p-6"
            style={{
              background: "#ffffff",
              borderColor: "rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <h2 className="mb-4 text-sm font-semibold" style={{ color: "#64748b" }}>
              {t.weatherChartTitle}
            </h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: "#94a3b8" }}
                  interval={2}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                  axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                  tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
                />
                <YAxis
                  yAxisId="temp"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  unit="°C"
                  axisLine={{ stroke: "rgba(0,0,0,0.1)" }}
                  tickLine={{ stroke: "rgba(0,0,0,0.1)" }}
                />
                <YAxis
                  yAxisId="pct"
                  orientation="right"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  unit="%"
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
                <Line yAxisId="temp" type="monotone" dataKey="temp" name={t.tempHeader} stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="pct" type="monotone" dataKey="pop" name={t.precipProb} stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 예보 테이블 - 데스크탑/태블릿 */}
          <div
            className="hidden sm:block rounded-2xl border overflow-hidden"
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
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.dateHeader}</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.timeOfDayHeader}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.skyHeader}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.tempHeader}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.precipProb}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.humidity}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.windSpeed}</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((f, idx) => (
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
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#475569" }}>{f.date}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#475569" }}>{f.time}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span>{getSkyEmoji(f.sky, f.pty)}</span>{" "}
                        <span className="text-xs" style={{ color: "#64748b" }}>{f.sky}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium whitespace-nowrap" style={{ color: "#d97706" }}>
                        {f.temp}°C
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#3b82f6" }}>{f.pop}%</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#0891b2" }}>{f.humidity}%</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#64748b" }}>{f.windSpeed} m/s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 예보 카드 리스트 - 모바일 */}
          <div className="sm:hidden space-y-3">
            {forecasts.map((f, idx) => (
              <div
                key={idx}
                className="rounded-2xl border p-4"
                style={{
                  background: "#ffffff",
                  borderColor: "rgba(0,0,0,0.07)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-semibold" style={{ color: "#1e293b" }}>
                    {f.date} {f.time}
                  </span>
                  <span className="text-lg">
                    {getSkyEmoji(f.sky, f.pty)}
                    <span className="ml-1 text-xs" style={{ color: "#94a3b8" }}>{f.sky}</span>
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <span style={{ color: "#94a3b8" }}>{t.tempHeader}</span>
                    <span className="font-medium" style={{ color: "#d97706" }}>{f.temp}°C</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span style={{ color: "#94a3b8" }}>{t.precipProb}</span>
                    <span className="font-medium" style={{ color: "#3b82f6" }}>{f.pop}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span style={{ color: "#94a3b8" }}>{t.humidity}</span>
                    <span className="font-medium" style={{ color: "#0891b2" }}>{f.humidity}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span style={{ color: "#94a3b8" }}>{t.windSpeed}</span>
                    <span className="font-medium" style={{ color: "#475569" }}>{f.windSpeed} m/s</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading && !error && forecasts.length === 0 && (
        <div
          className="rounded-xl p-8 text-center text-sm"
          style={{
            background: "#f8fafc",
            border: "1px solid rgba(0,0,0,0.07)",
            color: "#94a3b8",
          }}
        >
          {t.noWeatherData}
        </div>
      )}
    </div>
  );
}
