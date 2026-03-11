import Link from "next/link";

const cards = [
  {
    href: "/dashboard/air-quality",
    emoji: "🌫️",
    title: "대기질 정보",
    description: "전국 시도별 미세먼지(PM10, PM2.5), 오존, 이산화질소 등 실시간 대기질 정보",
    glowColor: "rgba(59,130,246,0.15)",
    borderColor: "rgba(59,130,246,0.3)",
    accentColor: "#60a5fa",
    badgeBg: "rgba(59,130,246,0.15)",
    badgeColor: "#60a5fa",
  },
  {
    href: "/dashboard/weather",
    emoji: "🌤️",
    title: "날씨 예보",
    description: "기상청 단기 예보 기반 지역별 기온, 강수확률, 풍속, 습도 등 날씨 정보",
    glowColor: "rgba(245,158,11,0.15)",
    borderColor: "rgba(245,158,11,0.3)",
    accentColor: "#fbbf24",
    badgeBg: "rgba(245,158,11,0.15)",
    badgeColor: "#fbbf24",
  },
  {
    href: "/dashboard/transit",
    emoji: "🚌",
    title: "버스 노선",
    description: "전국 주요 도시의 시내버스 노선 번호, 운행 시간, 배차 간격 등 교통 정보",
    glowColor: "rgba(16,185,129,0.15)",
    borderColor: "rgba(16,185,129,0.3)",
    accentColor: "#34d399",
    badgeBg: "rgba(16,185,129,0.15)",
    badgeColor: "#34d399",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#f1f5f9" }}>
          대시보드
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#94a3b8" }}>
          공공데이터포털 API 기반 실시간 정보를 확인하세요
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "rgba(255,255,255,0.05)",
              borderColor: card.borderColor,
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              boxShadow: `0 4px 24px ${card.glowColor}`,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.boxShadow = `0 8px 40px ${card.glowColor}, 0 0 0 1px ${card.borderColor}`;
              el.style.background = "rgba(255,255,255,0.08)";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.boxShadow = `0 4px 24px ${card.glowColor}`;
              el.style.background = "rgba(255,255,255,0.05)";
            }}
          >
            <div className="mb-3 text-4xl">{card.emoji}</div>
            <h2 className="text-lg font-semibold" style={{ color: card.accentColor }}>
              {card.title}
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#94a3b8" }}>
              {card.description}
            </p>
            <div
              className="mt-4 flex items-center text-sm font-medium transition-colors duration-200"
              style={{ color: "#64748b" }}
            >
              <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">
                바로가기 →
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div
        className="mt-8 rounded-2xl border p-6"
        style={{
          background: "rgba(255,255,255,0.05)",
          borderColor: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
        }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "#94a3b8" }}>
          데이터 출처
        </h2>
        <ul className="mt-2 space-y-1 text-xs" style={{ color: "#64748b" }}>
          <li>• 대기질: 한국환경공단 에어코리아 (apis.data.go.kr)</li>
          <li>• 날씨: 기상청 단기예보 조회서비스 (apis.data.go.kr)</li>
          <li>• 교통: 국토교통부 버스노선 조회서비스 (apis.data.go.kr)</li>
        </ul>
      </div>
    </div>
  );
}
