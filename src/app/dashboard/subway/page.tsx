"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { SUBWAY_LINES, TRAIN_STATUS, type SubwayLine } from "./station-data";

interface Train {
  trainNo: string;
  statnNm: string;
  updnLine: string;
  trainSttus: string;
  endstatnNm: string;
  directAt: string;
  lstcarAt: string;
  recptnDt: string;
}

const STATUS_COLOR: Record<string, string> = {
  "0": "#94a3b8",
  "1": "#f59e0b",
  "2": "#22c55e",
  "3": "#3b82f6",
  "4": "#3b82f6",
  "5": "#e2e8f0",
};

// 노선도 SVG 컴포넌트
function SubwayLineMap({
  line,
  trains,
  direction,
}: {
  line: SubwayLine;
  trains: Train[];
  direction: "all" | "0" | "1";
}) {
  const stations = line.stations;

  const filteredTrains = useMemo(
    () => trains.filter((t) => direction === "all" || t.updnLine === direction),
    [trains, direction]
  );

  // 역 → 인덱스 맵
  const stationIndex = useMemo(
    () => Object.fromEntries(stations.map((s, i) => [s, i])),
    [stations]
  );

  // 각 역에 있는 열차 목록
  const trainsByStation = useMemo(() => {
    const map: Record<string, Train[]> = {};
    for (const t of filteredTrains) {
      if (!(t.statnNm in map)) map[t.statnNm] = [];
      map[t.statnNm].push(t);
    }
    return map;
  }, [filteredTrains]);

  const W = 80; // 역 간격
  const H = 120;
  const R = 8; // 역 원 반지름
  const CY = 54; // 선 y좌표
  const totalW = Math.max(stations.length * W + 40, 400);

  // 브랜치 라인
  const branches = line.branches ?? [];

  return (
    <div
      className="overflow-x-auto"
      style={{ WebkitOverflowScrolling: "touch" }}
    >
      <svg
        width={totalW}
        height={H}
        style={{ display: "block", minWidth: totalW }}
      >
        {/* 메인 노선 선 */}
        <line
          x1={20}
          y1={CY}
          x2={20 + (stations.length - 1) * W}
          y2={CY}
          stroke={line.color}
          strokeWidth={6}
          strokeLinecap="round"
        />

        {/* 순환선 표시 */}
        {line.circular && (
          <text x={20} y={CY - 14} fontSize={10} fill={line.color} fontWeight="600">
            순환
          </text>
        )}

        {/* 역 */}
        {stations.map((name, i) => {
          const x = 20 + i * W;
          const hasTrains = !!trainsByStation[name]?.length;
          const stTrains = trainsByStation[name] ?? [];

          return (
            <g key={name}>
              {/* 역 원 */}
              <circle
                cx={x}
                cy={CY}
                r={hasTrains ? R + 3 : R}
                fill={hasTrains ? line.color : "#fff"}
                stroke={line.color}
                strokeWidth={hasTrains ? 0 : 2.5}
              />

              {/* 열차 마커 */}
              {stTrains.map((t, ti) => {
                const isUp = t.updnLine === "0";
                const markerY = isUp ? CY - 22 - ti * 18 : CY + 22 + ti * 18;
                const statusColor = STATUS_COLOR[t.trainSttus] ?? "#94a3b8";
                return (
                  <g key={t.trainNo}>
                    <rect
                      x={x - 16}
                      y={markerY - 8}
                      width={32}
                      height={16}
                      rx={4}
                      fill={statusColor}
                      opacity={0.95}
                    />
                    <text
                      x={x}
                      y={markerY + 4}
                      fontSize={8}
                      fill="#1e293b"
                      textAnchor="middle"
                      fontWeight="700"
                    >
                      {t.directAt === "1" ? "급" : "🚇"}
                    </text>
                    {/* 연결선 */}
                    <line
                      x1={x}
                      y1={isUp ? markerY + 8 : markerY - 8}
                      x2={x}
                      y2={isUp ? CY - R - 2 : CY + R + 2}
                      stroke={statusColor}
                      strokeWidth={1.5}
                      strokeDasharray="2,2"
                    />
                  </g>
                );
              })}

              {/* 역명 */}
              <text
                x={x}
                y={CY + R + 14}
                fontSize={9}
                fill={hasTrains ? line.color : "#64748b"}
                textAnchor="middle"
                fontWeight={hasTrains ? "700" : "400"}
              >
                {name}
              </text>
            </g>
          );
        })}

        {/* 브랜치 노선 */}
        {branches.map((branch) => {
          const fromIdx = stationIndex[branch.fromStation] ?? 0;
          const fromX = 20 + fromIdx * W;
          const branchY = CY + 40;

          return (
            <g key={branch.name}>
              <line
                x1={fromX}
                y1={CY}
                x2={fromX}
                y2={branchY}
                stroke={line.color}
                strokeWidth={4}
                opacity={0.5}
              />
              {branch.stations.slice(1).map((s, bi) => {
                const bx = fromX + (bi + 1) * W;
                const hasT = !!trainsByStation[s]?.length;
                return (
                  <g key={s}>
                    <line
                      x1={fromX + bi * W}
                      y1={branchY}
                      x2={bx}
                      y2={branchY}
                      stroke={line.color}
                      strokeWidth={4}
                      opacity={0.5}
                    />
                    <circle
                      cx={bx}
                      cy={branchY}
                      r={hasT ? R + 2 : R - 1}
                      fill={hasT ? line.color : "#fff"}
                      stroke={line.color}
                      strokeWidth={2}
                      opacity={0.8}
                    />
                    <text
                      x={bx}
                      y={branchY + 14}
                      fontSize={8}
                      fill="#64748b"
                      textAnchor="middle"
                    >
                      {s}
                    </text>
                  </g>
                );
              })}
              <text
                x={fromX + 4}
                y={branchY - 4}
                fontSize={8}
                fill={line.color}
                opacity={0.7}
              >
                {branch.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export default function SubwayPage() {
  const [selectedLineId, setSelectedLineId] = useState("1002");
  const [direction, setDirection] = useState<"all" | "0" | "1">("all");
  const [trains, setTrains] = useState<Train[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("");

  const selectedLine = useMemo(
    () => SUBWAY_LINES.find((l) => l.id === selectedLineId)!,
    [selectedLineId]
  );

  const fetchTrains = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/subway?lineId=${selectedLineId}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "오류가 발생했습니다");
      } else {
        setTrains(data.trains ?? []);
        setLastUpdate(new Date().toLocaleTimeString("ko-KR"));
      }
    } catch {
      setError("네트워크 오류");
    } finally {
      setLoading(false);
    }
  }, [selectedLineId]);

  useEffect(() => {
    fetchTrains();
    const interval = setInterval(fetchTrains, 30000);
    return () => clearInterval(interval);
  }, [fetchTrains]);

  const filteredTrains = useMemo(
    () => trains.filter((t) => direction === "all" || t.updnLine === direction),
    [trains, direction]
  );

  const upCount = useMemo(() => trains.filter((t) => t.updnLine === "0").length, [trains]);
  const dnCount = useMemo(() => trains.filter((t) => t.updnLine === "1").length, [trains]);

  return (
    <div className="pt-4 sm:pt-6 lg:pt-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
          🚇 서울 지하철 실시간
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
          서울시 열린데이터 광장 · 30초마다 자동 갱신
        </p>
      </div>

      {/* 호선 선택 탭 */}
      <div className="mb-4 flex flex-wrap gap-2">
        {SUBWAY_LINES.map((line) => (
          <button
            key={line.id}
            onClick={() => { setSelectedLineId(line.id); setDirection("all"); }}
            className="rounded-xl px-3 py-1.5 text-sm font-bold transition-all duration-150"
            style={{
              background: selectedLineId === line.id ? line.color : "#f1f5f9",
              color: selectedLineId === line.id ? "#fff" : "#64748b",
              border: `2px solid ${selectedLineId === line.id ? line.color : "transparent"}`,
            }}
          >
            {line.name}
          </button>
        ))}
      </div>

      {/* 방향 필터 + 갱신 */}
      <div className="mb-4 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex gap-2">
          {[
            { value: "all", label: `전체 ${trains.length}` },
            { value: "0", label: `상행 ${upCount}` },
            { value: "1", label: `하행 ${dnCount}` },
          ].map(({ value, label }) => (
            <button
              key={value}
              onClick={() => setDirection(value as "all" | "0" | "1")}
              className="rounded-lg px-3 py-1 text-xs font-semibold transition-all"
              style={{
                background: direction === value ? selectedLine.color : "#f1f5f9",
                color: direction === value ? "#fff" : "#64748b",
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {lastUpdate && (
            <span className="text-xs" style={{ color: "#94a3b8" }}>
              갱신 {lastUpdate}
            </span>
          )}
          <button
            onClick={fetchTrains}
            disabled={loading}
            className="rounded-lg px-3 py-1 text-xs font-semibold text-white disabled:opacity-50"
            style={{ background: selectedLine.color }}
          >
            {loading ? "로딩..." : "새로고침"}
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444" }}>
          ⚠️ {error}
        </div>
      )}

      {/* 노선도 */}
      <div
        className="mb-4 rounded-2xl p-4"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <div className="w-3 h-3 rounded-full" style={{ background: selectedLine.color }} />
          <span className="text-sm font-bold" style={{ color: "#1e293b" }}>
            {selectedLine.name} 노선도
          </span>
          {selectedLine.circular && (
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${selectedLine.color}20`, color: selectedLine.color }}>
              순환선
            </span>
          )}
        </div>

        {loading && trains.length === 0 ? (
          <div className="h-24 flex items-center justify-center text-sm" style={{ color: "#94a3b8" }}>
            로딩 중...
          </div>
        ) : (
          <SubwayLineMap
            line={selectedLine}
            trains={trains}
            direction={direction}
          />
        )}

        {/* 범례 */}
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(TRAIN_STATUS).map(([code, label]) => (
            <div key={code} className="flex items-center gap-1">
              <div
                className="w-4 h-3 rounded"
                style={{ background: STATUS_COLOR[code] ?? "#94a3b8" }}
              />
              <span className="text-xs" style={{ color: "#64748b" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 열차 목록 */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
          <span className="text-sm font-bold" style={{ color: "#1e293b" }}>
            열차 목록 ({filteredTrains.length}대)
          </span>
        </div>

        {filteredTrains.length === 0 ? (
          <div className="p-8 text-center text-sm" style={{ color: "#94a3b8" }}>
            {loading ? "데이터 불러오는 중..." : "운행 중인 열차가 없습니다"}
          </div>
        ) : (
          <div className="divide-y divide-black/[0.04]">
            {filteredTrains.map((train) => {
              const statusColor = STATUS_COLOR[train.trainSttus] ?? "#94a3b8";
              const isUp = train.updnLine === "0";
              return (
                <div
                  key={train.trainNo}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  {/* 상태 배지 */}
                  <div
                    className="flex-shrink-0 rounded-lg px-2 py-1 text-xs font-bold"
                    style={{ background: statusColor, color: "#1e293b", minWidth: 48, textAlign: "center" }}
                  >
                    {TRAIN_STATUS[train.trainSttus] ?? "-"}
                  </div>

                  {/* 방향 배지 */}
                  <div
                    className="flex-shrink-0 rounded-md px-1.5 py-0.5 text-xs font-semibold"
                    style={{
                      background: isUp ? "rgba(99,102,241,0.12)" : "rgba(239,68,68,0.12)",
                      color: isUp ? "#6366f1" : "#ef4444",
                    }}
                  >
                    {isUp ? "상행" : "하행"}
                  </div>

                  {/* 현재 역 */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate" style={{ color: "#1e293b" }}>
                      {train.statnNm}
                    </p>
                    <p className="text-xs truncate" style={{ color: "#94a3b8" }}>
                      → {train.endstatnNm} 방면
                    </p>
                  </div>

                  {/* 열차번호 + 특수 */}
                  <div className="flex-shrink-0 text-right">
                    <p className="text-xs font-mono" style={{ color: "#64748b" }}>
                      {train.trainNo}
                    </p>
                    <div className="flex gap-1 justify-end mt-0.5">
                      {train.directAt === "1" && (
                        <span className="text-xs px-1 rounded" style={{ background: "#fef3c7", color: "#d97706" }}>급행</span>
                      )}
                      {train.lstcarAt === "1" && (
                        <span className="text-xs px-1 rounded" style={{ background: "#fce7f3", color: "#db2777" }}>막차</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
