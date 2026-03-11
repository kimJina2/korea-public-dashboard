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
          <h1 className="text-2xl font-bold text-gray-900">🚌 버스 노선 정보</h1>
          <p className="mt-1 text-sm text-gray-500">
            국토교통부 버스노선 조회서비스
            {totalCount > 0 && (
              <span className="ml-2 font-medium text-gray-700">
                (총 {totalCount.toLocaleString()}개 노선)
              </span>
            )}
          </p>
        </div>
        <select
          value={city}
          onChange={(e) => handleCityChange(e.target.value)}
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
          <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50">
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">노선번호</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">종류</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">기점</th>
                    <th className="px-4 py-3 text-left font-semibold text-gray-700">종점</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">첫차</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">막차</th>
                    <th className="px-4 py-3 text-center font-semibold text-gray-700">배차(첨두)</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-semibold text-blue-700">{item.routeNo}</td>
                      <td className="px-4 py-3 text-center">
                        <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                          {ROUTE_TYPE[item.routeTp] ?? item.routeTp}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-700">{item.startNodeNm}</td>
                      <td className="px-4 py-3 text-gray-700">{item.endNodeNm}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.startVehicleTime}</td>
                      <td className="px-4 py-3 text-center text-gray-600">{item.endVehicleTime}</td>
                      <td className="px-4 py-3 text-center text-gray-600">
                        {item.peakAlloc ? `${item.peakAlloc}분` : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 페이지네이션 */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-100"
              >
                이전
              </button>
              <span className="text-sm text-gray-600">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm disabled:cursor-not-allowed disabled:opacity-40 hover:bg-gray-100"
              >
                다음
              </button>
            </div>
          )}
        </>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-lg bg-gray-50 p-8 text-center text-sm text-gray-500">
          해당 지역의 버스 노선 데이터가 없습니다.
        </div>
      )}
    </div>
  );
}
