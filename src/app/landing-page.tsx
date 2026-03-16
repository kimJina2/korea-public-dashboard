"use client";

import { useState } from "react";
import { handleSignIn } from "./actions";
import { signIn } from "next-auth/react";
import { LanguageProvider, useLanguage } from "@/contexts/language-context";
import { useAirQuality } from "@/hooks/use-air-quality";
import { useWeather } from "@/hooks/use-weather";
import { useTransit } from "@/hooks/use-transit";
import { getAqiGrade } from "@/lib/utils";
import type { Translations } from "@/lib/i18n";

// ── 유틸 ────────────────────────────────────────────────────────────────────
const AIR_CITIES = ["서울","부산","대구","인천","광주","대전","울산","경기","강원","충북","충남","전북","전남","경북","경남","제주"];
const WEATHER_CITIES = ["서울","부산","대구","인천","광주","대전","울산","제주"];
const TRANSIT_CITIES = ["부산","대구","인천","광주","대전","울산","경기"];

function translateSky(sky: string | undefined, t: Translations): string {
  if (!sky) return "";
  switch (sky) {
    case "맑음": return t.skyClear;
    case "구름많음": return t.skyPartlyCloudy;
    case "흐림": return t.skyOvercast;
    default: return sky;
  }
}

function getRouteType(routetp: string, t: Translations): string {
  const map: Record<string, string> = {
    "11": t.rtMainline, "12": t.rtBranch, "13": t.rtCircular,
    "14": t.rtWide, "15": t.rtExpress, "16": t.rtTourist,
    "21": t.rtSeat, "22": t.rtGeneral, "23": t.rtWide, "30": t.rtVillage,
  };
  return map[routetp] ?? routetp;
}

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

function Skeleton() {
  return (
    <div className="space-y-3">
      <div className="h-3 w-32 animate-pulse rounded" style={{ background: "#e2e8f0" }} />
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 animate-pulse rounded-xl" style={{ background: "#f1f5f9" }} />
      ))}
    </div>
  );
}

function ErrorBox({ msg }: { msg: string }) {
  return (
    <div className="rounded-xl p-3 text-xs" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}>
      {msg}
    </div>
  );
}

function CitySelect({ cities, value, onChange }: { cities: string[]; value: string; onChange: (v: string) => void }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-xl px-3 py-1.5 text-xs focus:outline-none"
      style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.12)", color: "#334155" }}
    >
      {cities.map((c) => <option key={c} value={c}>{c}</option>)}
    </select>
  );
}

type Tab = "air" | "weather" | "transit";

function PublicDataTabs() {
  const [tab, setTab] = useState<Tab>("air");
  const [airCity, setAirCity] = useState("서울");
  const [weatherCity, setWeatherCity] = useState("서울");
  const [transitCity, setTransitCity] = useState("부산");
  const { t } = useLanguage();

  const { items: airItems, error: airError, isLoading: airLoading } = useAirQuality(airCity);
  const { forecasts, error: weatherError, isLoading: weatherLoading } = useWeather(weatherCity);
  const { items: transitItems, error: transitError, isLoading: transitLoading } = useTransit(transitCity, 1);

  const TABS: { key: Tab; emoji: string; label: string }[] = [
    { key: "air", emoji: "🌫️", label: t.airQuality },
    { key: "weather", emoji: "🌤️", label: t.weather },
    { key: "transit", emoji: "🚌", label: t.transit },
  ];

  return (
    <div
      className="rounded-2xl border p-5"
      style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}
    >
      {/* 탭 셀렉터 */}
      <div className="mb-4 flex rounded-xl p-1" style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.1)" }}>
        {TABS.map(({ key, emoji, label }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-medium transition-all duration-200"
              style={{
                background: active ? "#ffffff" : "transparent",
                color: active ? "#6366f1" : "#94a3b8",
                boxShadow: active ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
              }}
            >
              <span>{emoji}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      {/* 대기질 탭 */}
      {tab === "air" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: "#94a3b8" }}>{t.airQualitySubtitle}</p>
            <CitySelect cities={AIR_CITIES} value={airCity} onChange={setAirCity} />
          </div>
          {airLoading && <Skeleton />}
          {airError && <ErrorBox msg={t.dataLoadError} />}
          {!airLoading && !airError && (
            <div className="space-y-2">
              {airItems.slice(0, 6).map((item, idx) => {
                const grade = getAqiGrade(item.khaiGrade);
                return (
                  <div key={idx} className="flex items-center justify-between rounded-xl border px-3 py-2"
                    style={{ background: "#f8fafc", borderColor: "rgba(0,0,0,0.06)" }}>
                    <span className="text-xs font-medium" style={{ color: "#1e293b" }}>{item.stationName}</span>
                    <div className="flex items-center gap-3 text-xs" style={{ color: "#64748b" }}>
                      <span>PM10 <strong style={{ color: "#3b82f6" }}>{item.pm10Value ?? "-"}</strong></span>
                      <span>PM2.5 <strong style={{ color: "#f97316" }}>{item.pm25Value ?? "-"}</strong></span>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${grade.color} ${grade.bg}`}>{grade.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 날씨 탭 */}
      {tab === "weather" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: "#94a3b8" }}>{t.weatherSubtitle}</p>
            <CitySelect cities={WEATHER_CITIES} value={weatherCity} onChange={setWeatherCity} />
          </div>
          {weatherLoading && <Skeleton />}
          {weatherError && <ErrorBox msg={t.dataLoadError} />}
          {!weatherLoading && !weatherError && (
            <div className="space-y-2">
              {forecasts.slice(0, 6).map((f, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border px-3 py-2"
                  style={{ background: "#f8fafc", borderColor: "rgba(0,0,0,0.06)" }}>
                  <span className="text-xs font-medium" style={{ color: "#1e293b" }}>
                    {f.date} <span style={{ color: "#94a3b8" }}>{f.time}</span>
                  </span>
                  <div className="flex items-center gap-3 text-xs" style={{ color: "#64748b" }}>
                    <span>{getSkyEmoji(f.sky, f.pty)} {translateSky(f.sky, t)}</span>
                    <span><strong style={{ color: "#d97706" }}>{f.temp}°C</strong></span>
                    <span>🌧️ {f.pop}%</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 교통 탭 */}
      {tab === "transit" && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs" style={{ color: "#94a3b8" }}>{t.transitSubtitle}</p>
            <CitySelect cities={TRANSIT_CITIES} value={transitCity} onChange={setTransitCity} />
          </div>
          {transitLoading && <Skeleton />}
          {transitError && <ErrorBox msg={t.dataLoadError} />}
          {!transitLoading && !transitError && (
            <div className="space-y-2">
              {transitItems.slice(0, 6).map((item, idx) => (
                <div key={idx} className="flex items-center justify-between rounded-xl border px-3 py-2"
                  style={{ background: "#f8fafc", borderColor: "rgba(0,0,0,0.06)" }}>
                  <div>
                    <span className="text-xs font-bold" style={{ color: "#6366f1" }}>{item.routeno}</span>
                    <span className="ml-2 rounded-full px-1.5 py-0.5 text-[10px] font-medium"
                      style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}>
                      {getRouteType(item.routetp, t)}
                    </span>
                  </div>
                  <div className="text-[11px]" style={{ color: "#94a3b8" }}>
                    {item.startnodenm} → {item.endnodenm}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── 로그인 모달 ────────────────────────────────────────────────────────────
type LoginStep = "tab" | "email" | "otp";

function LoginModal({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<"google" | "email">("google");
  const [step, setStep] = useState<LoginStep>("tab");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSendOtp(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "오류가 발생했습니다.");
      else setStep("otp");
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.SyntheticEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await signIn("email-otp", { email, otp, redirect: false });
      if (result?.error) setError("인증코드가 올바르지 않거나 만료되었습니다.");
      else window.location.href = "/dashboard";
    } catch {
      setError("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-6 sm:p-8"
        style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.08)", boxShadow: "0 20px 60px rgba(0,0,0,0.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
            >
              <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold" style={{ color: "#1e293b" }}>로그인이 필요합니다</h2>
              <p className="text-xs" style={{ color: "#94a3b8" }}>서비스를 이용하려면 로그인해주세요</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 transition-all"
            style={{ color: "#94a3b8" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(0,0,0,0.06)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-5 flex rounded-xl p-1" style={{ background: "#f1f5f9" }}>
          <button
            onClick={() => { setTab("google"); setStep("tab"); setError(""); }}
            className="flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200"
            style={tab === "google" ? { background: "#ffffff", color: "#1e293b", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: "#64748b" }}
          >
            Google 계정
          </button>
          <button
            onClick={() => { setTab("email"); setStep("email"); setError(""); }}
            className="flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200"
            style={tab === "email" ? { background: "#ffffff", color: "#1e293b", boxShadow: "0 1px 3px rgba(0,0,0,0.08)" } : { color: "#64748b" }}
          >
            이메일 인증
          </button>
        </div>

        {tab === "google" && (
          <div className="space-y-3">
            <form action={handleSignIn}>
              <button
                type="submit"
                className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 active:scale-95 whitespace-nowrap"
              >
                <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google로 로그인 / 회원가입
              </button>
            </form>
            <p className="text-center text-xs" style={{ color: "#94a3b8" }}>
              처음 방문이시면 Google 계정으로 자동 가입됩니다
            </p>
          </div>
        )}

        {tab === "email" && step === "email" && (
          <form onSubmit={handleSendOtp} className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "#475569" }}>이메일 주소</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="이메일 입력"
                required
                className="w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.12)", color: "#1e293b" }}
              />
            </div>
            {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", color: "#ffffff", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
            >
              {loading ? "전송 중..." : "인증코드 받기"}
            </button>
          </form>
        )}

        {tab === "email" && step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="space-y-3">
            <div
              className="mb-4 rounded-xl p-3 text-sm"
              style={{ background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.15)", color: "#6366f1" }}
            >
              <span style={{ color: "#475569" }}>{email}</span>으로 인증코드를 보냈습니다.
              <br />
              <span style={{ color: "#94a3b8", fontSize: "11px" }}>이메일 도착까지 1~2분 소요될 수 있습니다.</span>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium" style={{ color: "#475569" }}>6자리 인증코드</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="123456"
                required
                maxLength={6}
                className="w-full rounded-xl px-4 py-3 text-center text-2xl font-bold tracking-widest focus:outline-none focus:ring-2 focus:ring-indigo-500"
                style={{ background: "#f8fafc", border: "1px solid rgba(0,0,0,0.12)", color: "#1e293b" }}
              />
            </div>
            {error && <p className="text-sm" style={{ color: "#dc2626" }}>{error}</p>}
            <button
              type="submit"
              disabled={loading || otp.length !== 6}
              className="w-full rounded-xl py-3 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", color: "#ffffff", boxShadow: "0 4px 12px rgba(99,102,241,0.3)" }}
            >
              {loading ? "확인 중..." : "로그인"}
            </button>
            <button
              type="button"
              onClick={() => { setStep("email"); setOtp(""); setError(""); }}
              className="w-full py-2 text-sm"
              style={{ color: "#94a3b8" }}
            >
              이메일 다시 입력
            </button>
          </form>
        )}

        <p className="mt-4 text-center text-xs" style={{ color: "#94a3b8" }}>
          허가된 계정만 접근할 수 있습니다
        </p>
      </div>
    </div>
  );
}

// ── 메인 랜딩 페이지 (내부) ──────────────────────────────────────────────────
function LandingPageInner() {
  const [showLogin, setShowLogin] = useState(false);
  const { t } = useLanguage();

  return (
    <div className="min-h-screen" style={{ background: "#f8fafc", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "10%", left: "50%", transform: "translate(-50%, -50%)", width: "700px", height: "700px", background: "radial-gradient(circle, rgba(99,102,241,0.07) 0%, rgba(59,130,246,0.04) 50%, transparent 70%)", pointerEvents: "none" }} />

      {/* Nav */}
      <nav
        style={{ background: "rgba(255,255,255,0.9)", backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)", borderBottom: "1px solid rgba(0,0,0,0.08)", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
        className="sticky top-0 z-40"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}
              >
                <svg className="h-4 w-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <span
                className="text-lg font-bold"
                style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
              >
                JINA
              </span>
            </div>
            <button
              onClick={() => setShowLogin(true)}
              className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-[1.02] active:scale-95"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", color: "#fff", boxShadow: "0 4px 12px rgba(99,102,241,0.25)" }}
            >
              {t.loginBtn}
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" style={{ position: "relative", zIndex: 1 }}>
        {/* Hero */}
        <div className="mb-8 text-center">
          <h1
            className="text-3xl font-bold mb-2 sm:text-4xl"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}
          >
            {t.dashboard}
          </h1>
          <p className="text-sm sm:text-base" style={{ color: "#64748b" }}>
            {t.dashboardSubtitle}
          </p>
          <button
            onClick={() => setShowLogin(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-semibold transition-all duration-200 hover:scale-[1.02] active:scale-95"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)", color: "#fff", boxShadow: "0 8px 24px rgba(99,102,241,0.3)" }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            로그인하고 시작하기
          </button>
        </div>

        {/* 실시간 공공데이터 탭 */}
        <div className="mb-8">
          <PublicDataTabs />
        </div>

        {/* 추가 서비스 안내 (게시판, 나만의영상) */}
        <div className="grid gap-4 sm:grid-cols-2 mb-6">
          {[
            {
              emoji: "📋",
              title: t.boardTitle,
              description: t.cardAirQualityDesc.includes("PM") ? "서비스 관련 문의, 건의사항, 방명록을 남겨보세요." : "서비스 관련 문의, 건의사항, 방명록을 남겨보세요.",
              accentColor: "#6366f1",
              glowColor: "rgba(99,102,241,0.08)",
              borderColor: "rgba(99,102,241,0.2)",
            },
            {
              emoji: "🎬",
              title: t.myVideos,
              description: t.videosSubtitle,
              accentColor: "#e11d48",
              glowColor: "rgba(225,29,72,0.08)",
              borderColor: "rgba(225,29,72,0.2)",
            },
          ].map((card) => (
            <button
              key={card.title}
              onClick={() => setShowLogin(true)}
              className="group rounded-2xl border p-5 text-left transition-all duration-300 hover:scale-[1.02] w-full"
              style={{ background: "#ffffff", borderColor: card.borderColor, boxShadow: `0 2px 12px ${card.glowColor}` }}
              onMouseEnter={(e) => { e.currentTarget.style.boxShadow = `0 8px 32px ${card.glowColor}`; }}
              onMouseLeave={(e) => { e.currentTarget.style.boxShadow = `0 2px 12px ${card.glowColor}`; }}
            >
              <div className="mb-2 text-3xl">{card.emoji}</div>
              <h2 className="text-sm font-semibold mb-1" style={{ color: card.accentColor }}>{card.title}</h2>
              <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>{card.description}</p>
              <div className="mt-3 text-xs font-medium" style={{ color: "#94a3b8" }}>
                <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">
                  로그인 후 이용 →
                </span>
              </div>
            </button>
          ))}
        </div>

        {/* Data source note */}
        <div
          className="rounded-2xl border p-5"
          style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <h2 className="text-sm font-semibold mb-2" style={{ color: "#64748b" }}>{t.dataSources}</h2>
          <ul className="space-y-1 text-xs" style={{ color: "#94a3b8" }}>
            <li>• {t.dataSourceAir}</li>
            <li>• {t.dataSourceWeather}</li>
            <li>• {t.dataSourceTransit}</li>
          </ul>
        </div>
      </main>

      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
    </div>
  );
}

// ── 공개 래퍼 (LanguageProvider 포함) ───────────────────────────────────────
export function LandingPage() {
  return (
    <LanguageProvider>
      <LandingPageInner />
    </LanguageProvider>
  );
}
