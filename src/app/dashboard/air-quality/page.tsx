"use client";

import { useState } from "react";
import { useAirQuality } from "@/hooks/use-air-quality";
import { useWeather } from "@/hooks/use-weather";
import { useTransit } from "@/hooks/use-transit";
import { getAqiGrade } from "@/lib/utils";
import { useLanguage } from "@/contexts/language-context";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";

// ── 상수 ────────────────────────────────────────────────────────────────────
const AIR_CITIES   = ["서울","부산","대구","인천","광주","대전","울산","경기","강원","충북","충남","전북","전남","경북","경남","제주"];
const WEATHER_CITIES = ["서울","부산","대구","인천","광주","대전","울산","제주"];
const TRANSIT_CITIES = ["부산","대구","인천","광주","대전","울산","경기"];
const ROUTE_TYPE: Record<string, string> = {
  "11":"간선","12":"지선","13":"순환","14":"광역","15":"급행",
  "16":"관광","21":"좌석","22":"일반","23":"광역","30":"마을",
};

type Tab = "air" | "weather" | "transit";

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

// ── 셀렉트 공통 컴포넌트 ────────────────────────────────────────────────────
function CitySelect({ cities, value, onChange }: { cities: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl px-3 py-2 text-sm focus:outline-none whitespace-nowrap"
      style={{
        background: "#ffffff",
        border: "1px solid rgba(0,0,0,0.12)",
        color: "#334155",
        boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
      }}
    >
      {cities.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

// ── 로딩 스켈레톤 ───────────────────────────────────────────────────────────
function Skeleton() {
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-6" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)" }}>
        <div className="mb-4 h-4 w-40 animate-pulse rounded" style={{ background: "#e2e8f0" }} />
        <div className="h-[220px] animate-pulse rounded" style={{ background: "#f1f5f9" }} />
      </div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="h-16 animate-pulse rounded-2xl" style={{ background: "#f1f5f9" }} />
      ))}
    </div>
  );
}

// ── 에러 ────────────────────────────────────────────────────────────────────
function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl p-4 text-sm"
      style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
      {msg}
    </div>
  );
}

// ── 대기질 탭 ───────────────────────────────────────────────────────────────
function AirTab() {
  const [city, setCity] = useState("서울");
  const { items, error, isLoading } = useAirQuality(city);
  const { t } = useLanguage();

  const chartData = items.slice(0, 8).map((item) => ({
    name: item.stationName,
    PM10: Number(item.pm10Value) || 0,
    "PM2.5": Number(item.pm25Value) || 0,
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs" style={{ color: "#94a3b8" }}>{t.airQualitySubtitle}</p>
        <CitySelect cities={AIR_CITIES} value={city} onChange={setCity} />
      </div>

      {isLoading && <Skeleton />}
      {error && <ErrorBox msg={t.dataLoadError} />}

      {!isLoading && !error && items.length > 0 && (
        <>
          {/* 차트 */}
          <div className="mb-4 rounded-2xl border p-4"
            style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p className="mb-3 text-xs font-semibold" style={{ color: "#64748b" }}>{t.airQualityChartTitle}</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: "#94a3b8" }} interval={0} angle={-30} textAnchor="end" height={44} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "12px", fontSize: 12 }} />
                <Legend wrapperStyle={{ color: "#64748b", fontSize: 12 }} />
                <Bar dataKey="PM10" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="PM2.5" fill="#f97316" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* 카드 목록 */}
          <div className="space-y-2">
            {items.map((item, idx) => {
              const grade = getAqiGrade(item.khaiGrade);
              return (
                <div key={idx} className="rounded-2xl border px-4 py-3"
                  style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-sm" style={{ color: "#1e293b" }}>{item.stationName}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${grade.color} ${grade.bg}`}>{grade.label}</span>
                  </div>
                  <div className="mt-1.5 flex gap-4 text-xs" style={{ color: "#64748b" }}>
                    <span>PM10 <strong style={{ color: "#3b82f6" }}>{item.pm10Value ?? "-"}</strong> μg/m³</span>
                    <span>PM2.5 <strong style={{ color: "#f97316" }}>{item.pm25Value ?? "-"}</strong> μg/m³</span>
                    <span className="ml-auto" style={{ color: "#94a3b8" }}>{item.dataTime}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-xl p-8 text-center text-sm" style={{ background: "#f8fafc", color: "#94a3b8" }}>
          {t.noAirQualityData}
        </div>
      )}
    </div>
  );
}

// ── 날씨 탭 ─────────────────────────────────────────────────────────────────
function WeatherTab() {
  const [city, setCity] = useState("서울");
  const { forecasts, error, isLoading } = useWeather(city);
  const { t } = useLanguage();

  const chartData = forecasts.map((f) => ({
    time: `${f.date.slice(5)} ${f.time}`,
    temp: Number(f.temp),
    pop: Number(f.pop),
  }));

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs" style={{ color: "#94a3b8" }}>{t.weatherSubtitle}</p>
        <CitySelect cities={WEATHER_CITIES} value={city} onChange={setCity} />
      </div>

      {isLoading && <Skeleton />}
      {error && <ErrorBox msg={t.dataLoadError} />}

      {!isLoading && !error && forecasts.length > 0 && (
        <>
          {/* 현재 날씨 요약 카드 */}
          {forecasts[0] && (
            <div className="mb-4 grid grid-cols-4 gap-2">
              {[
                { emoji: getSkyEmoji(forecasts[0].sky, forecasts[0].pty), val: `${forecasts[0].temp}°C`, label: forecasts[0].sky, color: "#d97706", bg: "rgba(245,158,11,0.06)", border: "rgba(245,158,11,0.2)" },
                { emoji: "🌧️", val: `${forecasts[0].pop}%`, label: t.precipProb, color: "#3b82f6", bg: "rgba(59,130,246,0.06)", border: "rgba(59,130,246,0.2)" },
                { emoji: "💧", val: `${forecasts[0].humidity}%`, label: t.humidity, color: "#0891b2", bg: "rgba(6,182,212,0.06)", border: "rgba(6,182,212,0.2)" },
                { emoji: "💨", val: `${forecasts[0].windSpeed}m/s`, label: t.windSpeed, color: "#475569", bg: "#f8fafc", border: "rgba(0,0,0,0.1)" },
              ].map((c, i) => (
                <div key={i} className="rounded-2xl border p-3 text-center"
                  style={{ background: c.bg, borderColor: c.border, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
                  <div className="text-2xl">{c.emoji}</div>
                  <div className="mt-1 text-base font-bold" style={{ color: c.color }}>{c.val}</div>
                  <div className="text-[10px] leading-tight mt-0.5" style={{ color: "#94a3b8" }}>{c.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* 차트 */}
          <div className="mb-4 rounded-2xl border p-4"
            style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
            <p className="mb-3 text-xs font-semibold" style={{ color: "#64748b" }}>{t.weatherChartTitle}</p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} interval={2} angle={-30} textAnchor="end" height={40} axisLine={false} tickLine={false} />
                <YAxis yAxisId="temp" tick={{ fontSize: 10, fill: "#94a3b8" }} unit="°C" axisLine={false} tickLine={false} />
                <YAxis yAxisId="pct" orientation="right" tick={{ fontSize: 10, fill: "#94a3b8" }} unit="%" axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "#fff", border: "1px solid rgba(0,0,0,0.1)", borderRadius: "12px", fontSize: 12 }} />
                <Legend wrapperStyle={{ color: "#64748b", fontSize: 12 }} />
                <Line yAxisId="temp" type="monotone" dataKey="temp" name={t.tempHeader} stroke="#f59e0b" strokeWidth={2} dot={false} />
                <Line yAxisId="pct" type="monotone" dataKey="pop" name={t.precipProb} stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* 예보 카드 목록 */}
          <div className="space-y-2">
            {forecasts.map((f, idx) => (
              <div key={idx} className="rounded-2xl border px-4 py-3"
                style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-semibold" style={{ color: "#1e293b" }}>{f.date} <span style={{ color: "#94a3b8" }}>{f.time}</span></span>
                  <span>{getSkyEmoji(f.sky, f.pty)} <span className="text-xs" style={{ color: "#94a3b8" }}>{f.sky}</span></span>
                </div>
                <div className="grid grid-cols-4 gap-1 text-xs" style={{ color: "#64748b" }}>
                  <span><span style={{ color: "#94a3b8" }}>{t.tempHeader} </span><strong style={{ color: "#d97706" }}>{f.temp}°C</strong></span>
                  <span><span style={{ color: "#94a3b8" }}>{t.precipProb} </span><strong style={{ color: "#3b82f6" }}>{f.pop}%</strong></span>
                  <span><span style={{ color: "#94a3b8" }}>{t.humidity} </span><strong style={{ color: "#0891b2" }}>{f.humidity}%</strong></span>
                  <span><span style={{ color: "#94a3b8" }}>{t.windSpeed} </span><strong>{f.windSpeed}m/s</strong></span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {!isLoading && !error && forecasts.length === 0 && (
        <div className="rounded-xl p-8 text-center text-sm" style={{ background: "#f8fafc", color: "#94a3b8" }}>
          {t.noWeatherData}
        </div>
      )}
    </div>
  );
}

// ── 교통 탭 ─────────────────────────────────────────────────────────────────
function TransitTab() {
  const [city, setCity] = useState("부산");
  const [page, setPage] = useState(1);
  const { items, totalCount, error, isLoading } = useTransit(city, page);
  const { t } = useLanguage();
  const totalPages = Math.ceil(totalCount / 20);

  function handleCity(v: string) { setCity(v); setPage(1); }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-xs" style={{ color: "#94a3b8" }}>
          {t.transitSubtitle}
          {totalCount > 0 && <span className="ml-1 font-medium" style={{ color: "#475569" }}>({t.totalRoutes(totalCount)})</span>}
        </p>
        <CitySelect cities={TRANSIT_CITIES} value={city} onChange={handleCity} />
      </div>

      {isLoading && <Skeleton />}
      {error && <ErrorBox msg={t.dataLoadError} />}

      {!isLoading && !error && items.length > 0 && (
        <>
          <div className="space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="rounded-2xl border px-4 py-3"
                style={{ background: "#fff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-bold" style={{ color: "#6366f1" }}>{item.routeno}</span>
                  <span className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
                    {ROUTE_TYPE[item.routetp] ?? item.routetp}
                  </span>
                </div>
                <div className="text-xs mb-1.5" style={{ color: "#475569" }}>
                  <span style={{ color: "#94a3b8" }}>{t.startStopHeader} </span>{item.startnodenm}
                  <span className="mx-1.5" style={{ color: "#cbd5e1" }}>→</span>
                  <span style={{ color: "#94a3b8" }}>{t.endStopHeader} </span>{item.endnodenm}
                </div>
                <div className="grid grid-cols-2 gap-1 text-xs" style={{ color: "#64748b" }}>
                  <span><span style={{ color: "#94a3b8" }}>{t.firstBusHeader} </span><strong>{item.startvehicletime}</strong></span>
                  <span><span style={{ color: "#94a3b8" }}>{t.lastBusHeader} </span><strong>{item.endvehicletime}</strong></span>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}
                className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.12)", color: "#475569" }}>
                {t.prevPage}
              </button>
              <span className="text-sm px-2" style={{ color: "#64748b" }}>{page} / {totalPages}</span>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-40"
                style={{ background: "#fff", border: "1px solid rgba(0,0,0,0.12)", color: "#475569" }}>
                {t.nextPage}
              </button>
            </div>
          )}
        </>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-xl p-8 text-center text-sm" style={{ background: "#f8fafc", color: "#94a3b8" }}>
          {t.noTransitData}
        </div>
      )}
    </div>
  );
}

// ── 메인 페이지 ─────────────────────────────────────────────────────────────
const TABS: { key: Tab; emoji: string; labelKey: "airQuality" | "weather" | "transit" }[] = [
  { key: "air",     emoji: "🌫️", labelKey: "airQuality" },
  { key: "weather", emoji: "🌤️", labelKey: "weather"    },
  { key: "transit", emoji: "🚌", labelKey: "transit"    },
];

export default function TodayInfoPage() {
  const [tab, setTab] = useState<Tab>("air");
  const { t } = useLanguage();

  return (
    <div className="pt-2 sm:pt-4">
      {/* 헤더 */}
      <div className="mb-4">
        <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>{t.todayInfo}</h1>
        <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
          {tab === "air" ? t.airQualitySubtitle : tab === "weather" ? t.weatherSubtitle : t.transitSubtitle}
        </p>
      </div>

      {/* 탭 셀렉터 */}
      <div
        className="mb-5 flex rounded-2xl p-1"
        style={{
          background: "rgba(99,102,241,0.06)",
          border: "1px solid rgba(99,102,241,0.1)",
        }}
      >
        {TABS.map(({ key, emoji, labelKey }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-medium transition-all duration-200"
              style={{
                background: active ? "#ffffff" : "transparent",
                color: active ? "#6366f1" : "#94a3b8",
                boxShadow: active ? "0 1px 6px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <span className="text-base leading-none">{emoji}</span>
              <span>{t[labelKey]}</span>
            </button>
          );
        })}
      </div>

      {/* 탭 콘텐츠 */}
      {tab === "air"     && <AirTab />}
      {tab === "weather" && <WeatherTab />}
      {tab === "transit" && <TransitTab />}
    </div>
  );
}
