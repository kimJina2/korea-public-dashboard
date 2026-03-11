"use client";

import { useState } from "react";
import { useAirQuality } from "@/hooks/use-air-quality";
import { getAqiGrade } from "@/lib/utils";
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

  const chartData = items.slice(0, 10).map((item) => ({
    name: item.stationName,
    PM10: Number(item.pm10Value) || 0,
    "PM2.5": Number(item.pm25Value) || 0,
  }));

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">🌫️ 대기질 정보</h1>
          <p className="mt-1 text-sm text-gray-500">
            한국환경공단 에어코리아 실시간 대기질 측정 데이터
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

      {!isLoading && !error && items.length > 0 && (
        <>
          {/* 차트 */}
          <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="mb-4 text-sm font-semibold text-gray-700">
              측정소별 미세먼지 농도 (μg/m³)
            </h2>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11 }}
                  interval={0}
                  angle={-30}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="PM10" fill="#60a5fa" name="PM10" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PM2.5" fill="#f97316" name="PM2.5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 테이블 */}
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">측정소</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">PM10</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">PM2.5</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">통합대기환경지수</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">등급</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">측정시각</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const grade = getAqiGrade(item.khaiGrade);
                    return (
                      <tr
                        key={idx}
                        className="border-b border-gray-100 transition hover:bg-gray-50"
                      >
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {item.stationName}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {item.pm10Value ?? "-"} μg/m³
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {item.pm25Value ?? "-"} μg/m³
                        </td>
                        <td className="px-4 py-3 text-center text-gray-700">
                          {item.khaiValue ?? "-"}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${grade.color} ${grade.bg}`}
                          >
                            {grade.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-500">
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
        <div className="rounded-lg bg-gray-50 p-8 text-center text-sm text-gray-500">
          해당 지역의 측정 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
