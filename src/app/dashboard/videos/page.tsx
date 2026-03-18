"use client";

import { useState, useRef, useEffect } from "react";
import { useLanguage } from "@/contexts/language-context";

interface VideoInfo {
  title: string;
  videoUrl: string;
}

export default function VideosPage() {
  const { t, lang } = useLanguage();
  const [ytUrl, setYtUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [result, setResult] = useState("");
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<string>(() => t.defaultPrompt);
  const [maxTokens, setMaxTokens] = useState(512);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 언어 변경 시 기본 프롬프트 동기화
  useEffect(() => {
    setPrompt(t.defaultPrompt);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  // Revoke blob URL when videoInfo changes (memory cleanup)
  useEffect(() => {
    return () => {
      if (videoInfo?.videoUrl.startsWith("blob:")) {
        URL.revokeObjectURL(videoInfo.videoUrl);
      }
    };
  }, [videoInfo]);

  const handleDownload = async () => {
    if (!ytUrl.trim()) return;
    setDownloading(true);
    setDownloadError(null);
    setVideoInfo(null);

    try {
      const res = await fetch("/api/youtube/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: ytUrl.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setDownloadError(data.error ?? "다운로드 실패");
      } else {
        const blob = await res.blob();
        const videoUrl = URL.createObjectURL(blob);
        const title = decodeURIComponent(res.headers.get("X-Video-Title") ?? "영상");
        setVideoInfo({ title, videoUrl });
      }
    } catch {
      setDownloadError("네트워크 오류");
    } finally {
      setDownloading(false);
    }
  };

  const captureAndAnalyze = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0);
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedFrame(imageDataUrl);
    setAnalyzing(true);
    setAnalyzeError(null);
    setResult("");

    try {
      const res = await fetch("/api/youtube/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl, prompt, maxTokens, lang }),
      });
      const data = await res.json();
      if (!res.ok) {
        setAnalyzeError(data.error ?? "분석 실패");
      } else {
        setResult(data.result ?? "");
      }
    } catch {
      setAnalyzeError("네트워크 오류");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="pt-4 sm:pt-6 lg:pt-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: "#1e293b" }}>
          🎬 {t.myVideos}
        </h1>
        <p className="mt-1 text-sm" style={{ color: "#64748b" }}>
          {t.videosSubtitle}
        </p>
      </div>

      {/* YouTube URL Input */}
      <div
        className="mb-4 rounded-2xl p-4"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        <div className="flex gap-2">
          <input
            type="text"
            value={ytUrl}
            onChange={(e) => setYtUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !downloading && handleDownload()}
            placeholder={t.youtubeUrlPlaceholder}
            className="flex-1 rounded-xl px-3 py-2 text-sm outline-none transition-all duration-150"
            style={{
              border: "1px solid rgba(0,0,0,0.1)",
              color: "#1e293b",
              background: "#f8fafc",
            }}
            onFocus={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "#6366f1")}
            onBlur={(e) => ((e.currentTarget as HTMLInputElement).style.borderColor = "rgba(0,0,0,0.1)")}
          />
          <button
            onClick={handleDownload}
            disabled={downloading || !ytUrl.trim()}
            className="flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold text-white transition-opacity duration-150 disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}
            onMouseEnter={(e) => { if (!downloading) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
            onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
          >
            {downloading ? t.downloading : t.downloadVideo}
          </button>
        </div>
        {downloadError && (
          <p className="mt-2 text-xs" style={{ color: "#ef4444" }}>
            ⚠️ {downloadError}
          </p>
        )}
        {videoInfo && (
          <p className="mt-2 text-xs font-medium truncate" style={{ color: "#6366f1" }}>
            ✓ {videoInfo.title}
          </p>
        )}
      </div>

      {/* Main Content: Video Player + Analysis */}
      {videoInfo ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {/* Video Player */}
          <div
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            <div className="px-4 pt-4 pb-2">
              <h2 className="text-sm font-semibold" style={{ color: "#475569" }}>
                {t.videoPlayer}
              </h2>
            </div>
            <div className="px-4">
              <video
                ref={videoRef}
                src={videoInfo.videoUrl}
                controls
                className="w-full rounded-xl"
                style={{ background: "#000", maxHeight: "320px" }}
                crossOrigin="anonymous"
              />
            </div>
            <div className="p-4">
              <p className="text-xs mb-2" style={{ color: "#94a3b8" }}>
                {t.pauseToAnalyze}
              </p>
              <button
                onClick={captureAndAnalyze}
                disabled={analyzing}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity duration-150 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}
                onMouseEnter={(e) => { if (!analyzing) (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
                onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
              >
                {analyzing ? `⏳ ${t.analyzing}` : `🔍 ${t.analyzeFrame}`}
              </button>
            </div>
          </div>

          {/* Analysis Panel */}
          <div
            className="rounded-2xl flex flex-col"
            style={{
              background: "#ffffff",
              border: "1px solid rgba(0,0,0,0.07)",
              boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            }}
          >
            {/* Prompt + Settings */}
            <div className="p-4 border-b" style={{ borderColor: "rgba(0,0,0,0.06)" }}>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold" style={{ color: "#475569" }}>
                  {t.analysisPrompt}
                </label>
                <div className="flex items-center gap-1.5">
                  <label className="text-xs" style={{ color: "#94a3b8" }}>{t.maxTokens}</label>
                  <input
                    type="number"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(Math.max(64, Math.min(1024, Number(e.target.value))))}
                    className="w-16 rounded-lg px-2 py-0.5 text-xs text-center outline-none"
                    style={{ border: "1px solid rgba(0,0,0,0.1)", color: "#1e293b", background: "#f8fafc" }}
                    min={64}
                    max={1024}
                    step={64}
                  />
                </div>
              </div>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={2}
                className="w-full rounded-xl px-3 py-2 text-xs outline-none resize-none transition-all duration-150"
                style={{
                  border: "1px solid rgba(0,0,0,0.1)",
                  color: "#1e293b",
                  background: "#f8fafc",
                  lineHeight: "1.5",
                }}
                onFocus={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "#6366f1")}
                onBlur={(e) => ((e.currentTarget as HTMLTextAreaElement).style.borderColor = "rgba(0,0,0,0.1)")}
              />
            </div>

            {/* Captured Frame + Result */}
            <div className="p-4 flex-1 flex flex-col gap-3">
              {capturedFrame && (
                <div>
                  <p className="text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>
                    {t.capturedFrame}
                  </p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={capturedFrame}
                    alt="captured"
                    className="w-full rounded-xl object-cover"
                    style={{ maxHeight: "160px" }}
                  />
                </div>
              )}

              <div className="flex-1">
                <p className="text-xs font-semibold mb-1.5" style={{ color: "#475569" }}>
                  {t.analysisResult}
                </p>
                {analyzeError && (
                  <p className="text-xs mb-1" style={{ color: "#ef4444" }}>⚠️ {analyzeError}</p>
                )}
                <div
                  className="rounded-xl p-3 text-xs leading-relaxed overflow-y-auto"
                  style={{
                    background: "#f8fafc",
                    border: "1px solid rgba(0,0,0,0.06)",
                    color: "#334155",
                    minHeight: "120px",
                    maxHeight: "240px",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {result || (
                    <span style={{ color: "#94a3b8" }}>
                      {analyzing ? "분석 중..." : "영상을 재생하다 일시정지 후 화면 분석을 눌러주세요"}
                    </span>
                  )}
                  {analyzing && !result && <span className="animate-pulse">▋</span>}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State */
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
            {t.noVideoYet}
          </p>
          <p className="text-sm" style={{ color: "#94a3b8" }}>
            {t.pauseToAnalyze}
          </p>
        </div>
      )}

      {/* Hidden canvas for frame capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
