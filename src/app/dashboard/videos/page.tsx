"use client";

import { useLanguage } from "@/contexts/language-context";

export default function VideosPage() {
  const { t } = useLanguage();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
          🎬 {t.myVideos}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
          {t.videosSubtitle}
        </p>
      </div>
      <div
        className="rounded-2xl border p-12 text-center"
        style={{
          background: "#ffffff",
          borderColor: "rgba(0,0,0,0.07)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div className="text-6xl mb-4">🎬</div>
        <p className="text-lg font-semibold mb-2" style={{ color: "#1e293b" }}>
          {t.comingSoon}
        </p>
        <p className="text-sm" style={{ color: "#94a3b8" }}>
          {t.videosComingSoonDesc}
        </p>
      </div>
    </div>
  );
}
