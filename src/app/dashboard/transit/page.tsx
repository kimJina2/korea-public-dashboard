"use client";

import { useState } from "react";
import { useTransit } from "@/hooks/use-transit";

const CITIES = ["서울", "부산", "대구", "인천", "광주", "대전", "울산"];

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
  const [city, setCity] = useState("서울");
  const [page, setPage] = useState(1);
  const { items, totalCount, error, isLoading } = useTransit(city, page);

  const totalPages = Math.ceil(totalCount / 20);

  function handleCityChange(newCity: string) {
    setCity(newCity);
    setPage(1);
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
            🚌 버스 노선 정보
          </h1>
          <p className="mt-1 text-sm" style={{ color: "#94a3b8" }}>
            국토교통부 버스노선 조회서비스
            {totalCount > 0 && (
              <span className="ml-2 font-medium" style={{ color: "#cbd5e1" }}>
                (총 {totalCount.toLocaleString()}개 노선)
              </span>
            )}
          </p>
        </div>
        <select
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
          className="rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 whitespace-nowrap"
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.2)",
            color: "#f1f5f9",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
          }}
        >
          {CITIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {isLoading && (
        <div className="space-y-4">
          {/* 테이블 스켈레톤 - 데스크탑 */}
          <div
            className="hidden sm:block rounded-2xl border overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
            }}
          >
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="flex gap-4 px-4 py-3"
                style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
              >
                <div
                  className="h-4 w-16 animate-pulse rounded"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                />
                <div
                  className="h-4 w-12 animate-pulse rounded"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
                <div
                  className="h-4 w-28 animate-pulse rounded"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
                <div
                  className="h-4 w-28 animate-pulse rounded"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
                <div
                  className="h-4 w-14 animate-pulse rounded"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
                <div
                  className="h-4 w-14 animate-pulse rounded"
                  style={{ background: "rgba(255,255,255,0.07)" }}
                />
              </div>
            ))}
          </div>
          {/* 카드 스켈레톤 - 모바일 */}
          <div className="sm:hidden space-y-3">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="rounded-2xl border p-4"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div
                    className="h-5 w-20 animate-pulse rounded"
                    style={{ background: "rgba(255,255,255,0.1)" }}
                  />
                  <div
                    className="h-5 w-12 animate-pulse rounded-full"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  />
                </div>
                <div className="space-y-2">
                  <div
                    className="h-4 w-40 animate-pulse rounded"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  />
                  <div
                    className="h-4 w-32 animate-pulse rounded"
                    style={{ background: "rgba(255,255,255,0.07)" }}
                  />
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
            background: "rgba(239,68,68,0.1)",
            border: "1px solid rgba(239,68,68,0.3)",
            color: "#f87171",
          }}
        >
          데이터를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
        </div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <>
          {/* 테이블 - 데스크탑/태블릿 */}
          <div
            className="hidden sm:block rounded-2xl border overflow-hidden"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: "rgba(255,255,255,0.1)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
            }}
          >
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      background: "rgba(255,255,255,0.03)",
                    }}
                  >
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#94a3b8" }}>노선번호</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#94a3b8" }}>종류</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#94a3b8" }}>기점</th>
                    <th className="px-4 py-3 text-left font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#94a3b8" }}>종점</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#94a3b8" }}>첫차</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#94a3b8" }}>막차</th>
                    <th className="px-4 py-3 text-center font-medium text-xs uppercase tracking-wider whitespace-nowrap" style={{ color: "#94a3b8" }}>배차(첨두)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="transition-colors duration-200"
                      style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}
                      onMouseEnter={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.04)";
                      }}
                      onMouseLeave={(e) => {
                        (e.currentTarget as HTMLTableRowElement).style.background = "transparent";
                      }}
                    >
                      <td className="px-4 py-3 font-semibold whitespace-nowrap" style={{ color: "#818cf8" }}>{item.routeNo}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className="rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap"
                          style={{
                            background: "rgba(16,185,129,0.15)",
                            color: "#34d399",
                          }}
                        >
                          {ROUTE_TYPE[item.routeTp] ?? item.routeTp}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#cbd5e1" }}>{item.startNodeNm}</td>
                      <td className="px-4 py-3 whitespace-nowrap" style={{ color: "#cbd5e1" }}>{item.endNodeNm}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#94a3b8" }}>{item.startVehicleTime}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#94a3b8" }}>{item.endVehicleTime}</td>
                      <td className="px-4 py-3 text-center whitespace-nowrap" style={{ color: "#94a3b8" }}>
                        {item.peakAlloc ? `${item.peakAlloc}분` : "-"}
                      </td>
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
                  background: "rgba(255,255,255,0.05)",
                  borderColor: "rgba(255,255,255,0.1)",
                }}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-base font-bold" style={{ color: "#818cf8" }}>{item.routeNo}</span>
                  <span
                    className="rounded-full px-2 py-0.5 text-xs font-medium"
                    style={{
                      background: "rgba(16,185,129,0.15)",
                      color: "#34d399",
                    }}
                  >
                    {ROUTE_TYPE[item.routeTp] ?? item.routeTp}
                  </span>
                </div>
                <div className="mb-2 text-sm" style={{ color: "#cbd5e1" }}>
                  <span style={{ color: "#64748b" }}>기점 </span>{item.startNodeNm}
                  <span className="mx-1" style={{ color: "#475569" }}>→</span>
                  <span style={{ color: "#64748b" }}>종점 </span>{item.endNodeNm}
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs" style={{ color: "#94a3b8" }}>
                  <div>
                    <span className="block" style={{ color: "#64748b" }}>첫차</span>
                    <span className="font-medium">{item.startVehicleTime}</span>
                  </div>
                  <div>
                    <span className="block" style={{ color: "#64748b" }}>막차</span>
                    <span className="font-medium">{item.endVehicleTime}</span>
                  </div>
                  <div>
                    <span className="block" style={{ color: "#64748b" }}>배차(첨두)</span>
                    <span className="font-medium">{item.peakAlloc ? `${item.peakAlloc}분` : "-"}</span>
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
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#f1f5f9",
                }}
              >
                이전
              </button>
              <span className="text-sm px-2" style={{ color: "#94a3b8" }}>
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 hover:scale-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 whitespace-nowrap"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.2)",
                  color: "#f1f5f9",
                }}
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div
          className="rounded-xl p-8 text-center text-sm"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            color: "#64748b",
          }}
        >
          해당 지역의 버스 노선 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
