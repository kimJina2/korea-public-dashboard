"use client";

import { useState } from "react";
import { useTransit } from "@/hooks/use-transit";
import { useLanguage } from "@/contexts/language-context";

const CITIES = ["경기", "부산", "대구", "인천", "광주", "대전", "울산"];

const ROUTE_TYPE: Record<string, string> = {
  "11": "간선",
  "12": "지선",
  "13": "순환",
  "14": "광역",
  "15": "급행",
  "16": "관광",
  "21": "좌석",
  "22": "일반",
  "23": "광역",
  "30": "마을",
};

export default function TransitPage() {
  const [city, setCity] = useState("경기");
  const [page, setPage] = useState(1);
  const { items, totalCount, error, isLoading } = useTransit(city, page);
  const { t } = useLanguage();

  const totalPages = Math.ceil(totalCount / 20);

  function handleCityChange(newCity: string) {
    setCity(newCity);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
            {t.transitPageTitle}
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
            {t.transitSubtitle}
            {totalCount > 0 && (
              <span className="ml-2 font-medium" style={{ color: "#475569" }}>
                ({t.totalRoutes(totalCount)})
              </span>
            )}
          </p>
        </div>
        <select
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
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
            className="hidden sm:block rounded-2xl border overflow-hidden"
            style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
          >
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex gap-4 px-4 py-3" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="h-4 w-16 animate-pulse rounded" style={{ background: "#e2e8f0" }} />
                <div className="h-4 w-12 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                <div className="h-4 w-28 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                <div className="h-4 w-28 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                <div className="h-4 w-14 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                <div className="h-4 w-14 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
              </div>
            ))}
          </div>
          <div className="sm:hidden space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border p-4"
                style={{ background: "#ffffff", borderColor: "rgba(0,0,0,0.07)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="h-5 w-20 animate-pulse rounded" style={{ background: "#e2e8f0" }} />
                  <div className="h-5 w-12 animate-pulse rounded-full" style={{ background: "#f1f5f9" }} />
                </div>
                <div className="space-y-2">
                  <div className="h-4 w-40 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                  <div className="h-4 w-32 animate-pulse rounded" style={{ background: "#f1f5f9" }} />
                </div>
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
          {/* 테이블 - 데스크탑/태블릿 */}
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
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.routeNoHeader}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.routeTypeHeader}</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.startStopHeader}</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.endStopHeader}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.firstBusHeader}</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#64748b" }}>{t.lastBusHeader}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
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
                      <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: "#6366f1" }}>{item.routeno}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                          style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}
                        >
                          {ROUTE_TYPE[item.routetp] ?? item.routetp}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#475569" }}>{item.startnodenm}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#475569" }}>{item.endnodenm}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#64748b" }}>{item.startvehicletime}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#64748b" }}>{item.endvehicletime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 카드 리스트 - 모바일 */}
          <div className="sm:hidden space-y-3">
            {items.map((item, idx) => (
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
                  <span className="text-base font-bold" style={{ color: "#6366f1" }}>{item.routeno}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{ background: "rgba(16,185,129,0.1)", color: "#059669" }}
                  >
                    {ROUTE_TYPE[item.routetp] ?? item.routetp}
                  </span>
                </div>
                <div className="mb-2 text-sm" style={{ color: "#475569" }}>
                  <span style={{ color: "#94a3b8" }}>{t.startStopHeader} </span>{item.startnodenm}
                  <span className="mx-1" style={{ color: "#cbd5e1" }}>→</span>
                  <span style={{ color: "#94a3b8" }}>{t.endStopHeader} </span>{item.endnodenm}
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs" style={{ color: "#64748b" }}>
                  <div>
                    <span className="block" style={{ color: "#94a3b8" }}>{t.firstBusHeader}</span>
                    <span className="font-medium">{item.startvehicletime}</span>
                  </div>
                  <div>
                    <span className="block" style={{ color: "#94a3b8" }}>{t.lastBusHeader}</span>
                    <span className="font-medium">{item.endvehicletime}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.12)",
                  color: "#475569",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                {t.prevPage}
              </button>
              <span className="text-sm px-2" style={{ color: "#64748b" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                style={{
                  background: "#ffffff",
                  border: "1px solid rgba(0,0,0,0.12)",
                  color: "#475569",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
                }}
              >
                {t.nextPage}
              </button>
            </div>
          )}
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
          {t.noTransitData}
        </div>
      )}
    </div>
  );
}
