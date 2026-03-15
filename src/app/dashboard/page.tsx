"use client";

import Link from "next/link";
import { useLanguage } from "@/contexts/language-context";

export default function DashboardPage() {
  const { t } = useLanguage();

  const cards = [
    {
      href: "/dashboard/air-quality",
      emoji: "🌫️",
      title: t.cardAirQualityTitle,
      description: t.cardAirQualityDesc,
      glowColor: "rgba(59,130,246,0.08)",
      borderColor: "rgba(59,130,246,0.2)",
      accentColor: "#3b82f6",
    },
    {
      href: "/dashboard/weather",
      emoji: "🌤️",
      title: t.cardWeatherTitle,
      description: t.cardWeatherDesc,
      glowColor: "rgba(245,158,11,0.08)",
      borderColor: "rgba(245,158,11,0.25)",
      accentColor: "#d97706",
    },
    {
      href: "/dashboard/transit",
      emoji: "🚌",
      title: t.cardTransitTitle,
      description: t.cardTransitDesc,
      glowColor: "rgba(16,185,129,0.08)",
      borderColor: "rgba(16,185,129,0.2)",
      accentColor: "#059669",
    },
  ];

  return (
    <div className="pt-4 sm:pt-6 lg:pt-8">
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
          {t.dashboard}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
          {t.dashboardSubtitle}
        </p>
      </div>
      <div className="grid gap-4 sm:gap-5 lg:gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.href}
            href={card.href}
            className="group rounded-2xl border p-4 sm:p-5 lg:p-6 transition-all duration-300 hover:scale-[1.02]"
            style={{
              background: "#ffffff",
              borderColor: card.borderColor,
              boxShadow: `0 2px 12px ${card.glowColor}`,
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.boxShadow = `0 8px 32px ${card.glowColor}, 0 0 0 1px ${card.borderColor}`;
              el.style.background = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget as HTMLAnchorElement;
              el.style.boxShadow = `0 2px 12px ${card.glowColor}`;
              el.style.background = "#ffffff";
            }}
          >
            <div className="mb-3 text-4xl">{card.emoji}</div>
            <h2 className="text-lg font-semibold" style={{ color: card.accentColor }}>
              {card.title}
            </h2>
            <p className="mt-2 text-sm" style={{ color: "#64748b" }}>
              {card.description}
            </p>
            <div
              className="mt-4 flex items-center text-sm font-medium transition-colors duration-200"
              style={{ color: "#94a3b8" }}
            >
              <span className="group-hover:translate-x-1 transition-transform duration-200 inline-block">
                {t.goTo}
              </span>
            </div>
          </Link>
        ))}
      </div>
      <div
        className="mt-4 sm:mt-6 lg:mt-8 rounded-2xl border p-4 sm:p-5 lg:p-6"
        style={{
          background: "#ffffff",
          borderColor: "rgba(0,0,0,0.07)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <h2 className="text-sm font-semibold" style={{ color: "#64748b" }}>
          {t.dataSources}
        </h2>
        <ul className="mt-2 space-y-1 text-xs" style={{ color: "#94a3b8" }}>
          <li>• {t.dataSourceAir}</li>
          <li>• {t.dataSourceWeather}</li>
          <li>• {t.dataSourceTransit}</li>
        </ul>
      </div>
    </div>
  );
}
