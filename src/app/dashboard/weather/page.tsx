"use client";

import { useState } from "react";
import { useWeather } from "@/hooks/use-weather";
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

  const chartData = forecasts.map((f) => ({
    time: `${f.date.slice(5)} ${f.time}`,
    기온: Number(f.temp),
    강수확률: Number(f.pop),
    습도: Number(f.humidity),
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🌤️ 날씨 예보</h1>
          <p className="mt-1 text-sm text-gray-500">
            기상청 단기예보 조회서비스 데이터 (3시간 간격)
          </p>
        </div>
        <select
          value={city}
          onChange={(e) => setCity(e.target.value)}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="flex h-48 items-center justify-center">
          <div className="text-gray-500">데이터를 불러오는 중...</div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      )}

      {!isLoading && !error && forecasts.length > 0 && (
        <>
          {/* 현재 날씨 요약 */}
          {forecasts[0] && (
            <div className="mb-6 grid gap-4 sm:grid-cols-4">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 text-center">
                <div className="text-4xl">{getSkyEmoji(forecasts[0].sky, forecasts[0].pty)}</div>
                <div className="mt-2 text-3xl font-bold text-amber-700">{forecasts[0].temp}°C</div>
                <div className="text-sm text-amber-600">{forecasts[0].sky}</div>
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 text-center">
                <div className="text-2xl">🌧️</div>
                <div className="mt-2 text-2xl font-bold text-blue-700">{forecasts[0].pop}%</div>
                <div className="text-sm text-blue-600">강수확률</div>
              </div>
              <div className="rounded-xl border border-cyan-200 bg-cyan-50 p-5 text-center">
                <div className="text-2xl">💧</div>
                <div className="mt-2 text-2xl font-bold text-cyan-700">{forecasts[0].humidity}%</div>
                <div className="text-sm text-cyan-600">습도</div>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 text-center">
                <div className="text-2xl">💨</div>
                <div className="mt-2 text-2xl font-bold text-gray-700">{forecasts[0].windSpeed} m/s</div>
                <div className="text-sm text-gray-600">풍속</div>
              </div>
            </div>
          )}

          {/* 기온 차트 */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">시간대별 기온 / 강수확률</h2>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10 }}
                  interval={2}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis yAxisId="temp" tick={{ fontSize: 11 }} unit="°C" />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 11 }} unit="%" />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="temp"
                  type="monotone"
                  dataKey="기온"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  yAxisId="pct"
                  type="monotone"
                  dataKey="강수확률"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 예보 테이블 */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">날짜</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">시각</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">날씨</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">기온</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">강수확률</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">습도</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">풍속</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((f, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-700">{f.date}</td>
                      <td className="px-4 py-3 text-gray-700">{f.time}</td>
                      <td className="px-4 py-3 text-center">
                        <span>{getSkyEmoji(f.sky, f.pty)}</span>{" "}
                        <span className="text-xs text-gray-600">{f.sky}</span>
                      </td>
                      <td className="px-4 py-3 text-center font-medium text-amber-700">
                        {f.temp}°C
                      </td>
                      <td className="px-4 py-3 text-center text-blue-600">{f.pop}%</td>
                      <td className="px-4 py-3 text-center text-cyan-600">{f.humidity}%</td>
                      <td className="px-4 py-3 text-center text-gray-600">{f.windSpeed} m/s</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {!isLoading && !error && forecasts.length === 0 && (
        <div className="rounded-lg bg-gray-50 p-8 text-center text-sm text-gray-500">
          해당 지역의 예보 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
