import Link from "next/link";

const cards = [
  {
    href: "/dashboard/air-quality",
    emoji: "🌫️",
    title: "대기질 정보",
    description: "전국 시도별 미세먼지(PM10, PM2.5), 오존, 이산화질소 등 실시간 대기질 정보",
    color: "bg-blue-50 border-blue-200",
    titleColor: "text-blue-800",
  },
  {
    href: "/dashboard/weather",
    emoji: "🌤️",
    title: "날씨 예보",
    description: "기상청 단기 예보 기반 지역별 기온, 강수확률, 풍속, 습도 등 날씨 정보",
    color: "bg-amber-50 border-amber-200",
    titleColor: "text-amber-800",
  },
  {
    href: "/dashboard/transit",
    emoji: "🚌",
    title: "버스 노선",
    description: "전국 주요 도시의 시내버스 노선 번호, 운행 시간, 배차 간격 등 교통 정보",
    color: "bg-green-50 border-green-200",
    titleColor: "text-green-800",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>
        <p className="mt-1 text-sm text-gray-500">
          공공데이터포털 API 기반 실시간 정보를 확인하세요
        </p>
      </div>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className={`group rounded-xl border p-6 transition hover:shadow-md ${card.color}`}
          >
            <div className="mb-3 text-4xl">{card.emoji}</div>
            <h2 className={`text-lg font-semibold ${card.titleColor}`}>
              {card.title}
            </h2>
            <p className="mt-2 text-sm text-gray-600">{card.description}</p>
            <div className="mt-4 flex items-center text-sm font-medium text-gray-500 group-hover:text-gray-700">
              바로가기 →
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-gray-700">데이터 출처</h2>
        <ul className="mt-2 space-y-1 text-xs text-gray-500">
          <li>• 대기질: 한국환경공단 에어코리아 (apis.data.go.kr)</li>
          <li>• 날씨: 기상청 단기예보 조회서비스 (apis.data.go.kr)</li>
          <li>• 교통: 국토교통부 버스노선 조회서비스 (apis.data.go.kr)</li>
        </ul>
      </div>
    </div>
  );
}
