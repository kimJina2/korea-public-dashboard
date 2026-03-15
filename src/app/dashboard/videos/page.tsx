"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useLanguage } from "@/contexts/language-context";

type ModelStatus = "idle" | "loading" | "ready" | "error";

interface VideoInfo {
  title: string;
  videoUrl: string;
}

interface WorkerMessage {
  type: "status" | "progress" | "ready" | "token" | "done" | "error";
  message?: string;
  token?: string;
  progress?: number;
}

export default function VideosPage() {
  const { t } = useLanguage();
  const [ytUrl, setYtUrl] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>("idle");
  const [modelProgress, setModelProgress] = useState(0);
  const [modelMessage, setModelMessage] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [tokenCount, setTokenCount] = useState(0);
  const [capturedFrame, setCapturedFrame] = useState<string | null>(null);
  const [prompt, setPrompt] = useState(
    "이 이미지를 자세히 분석해서 한국어로 설명해 주세요. 화면에 보이는 모든 요소, 텍스트, 사람, 물체, 배경, 분위기 등을 상세하게 묘사해 주세요."
  );
  const [maxTokens, setMaxTokens] = useState(512);
  const [webgpuSupported, setWebgpuSupported] = useState(true);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const resultRef = useRef("");

  useEffect(() => {
    if (typeof navigator !== "undefined" && !("gpu" in navigator)) {
      setWebgpuSupported(false);
    }
    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  const loadModel = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
    }

    const worker = new Worker(new URL("./ai-worker.ts", import.meta.url));
    workerRef.current = worker;

    worker.addEventListener("message", (e: MessageEvent<WorkerMessage>) => {
      const { type, message, token, progress } = e.data;
      switch (type) {
        case "status":
          setModelStatus("loading");
          setModelMessage(message ?? "");
          break;
        case "progress":
          if (progress !== undefined) setModelProgress(Math.round(progress * 100));
          break;
        case "ready":
          setModelStatus("ready");
          setModelMessage("");
          setModelProgress(100);
          break;
        case "token":
          if (token) {
            resultRef.current += token;
            setResult(resultRef.current);
            setTokenCount((c) => c + 1);
          }
          break;
        case "done":
          setAnalyzing(false);
          break;
        case "error":
          setModelStatus((prev) => (prev === "loading" ? "error" : prev));
          setAnalyzing(false);
          setModelMessage(message ?? "오류 발생");
          console.error("Worker error:", message);
          break;
      }
    });

    setModelStatus("loading");
    setModelProgress(0);
    worker.postMessage({ type: "load" });
  }, []);

  const captureAndAnalyze = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const worker = workerRef.current;
    if (!video || !canvas || !worker || modelStatus !== "ready") return;

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCapturedFrame(dataUrl);

    setAnalyzing(true);
    resultRef.current = "";
    setResult("");
    setTokenCount(0);

    worker.postMessage({ type: "analyze", imageDataUrl: dataUrl, prompt, maxTokens });
  }, [modelStatus, prompt, maxTokens]);

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
      const data = await res.json();
      if (!res.ok) {
        setDownloadError(data.error ?? "다운로드 실패");
      } else {
        setVideoInfo({ title: data.title, videoUrl: data.videoUrl });
      }
    } catch {
      setDownloadError("네트워크 오류");
    } finally {
      setDownloading(false);
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

      {/* WebGPU Warning */}
      {!webgpuSupported && (
        <div
          className="mb-4 rounded-xl px-4 py-3 text-sm"
          style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#dc2626" }}
        >
          ⚠️ {t.webgpuNotSupported}
        </div>
      )}

      {/* Model Status Bar */}
      <div
        className="mb-4 rounded-2xl overflow-hidden"
        style={{
          background: "#ffffff",
          border: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        }}
      >
        {modelStatus === "loading" && (
          <div className="h-1 relative overflow-hidden" style={{ background: "rgba(99,102,241,0.1)" }}>
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${modelProgress}%`,
                background: "linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)",
              }}
            />
          </div>
        )}
        {modelStatus === "ready" && (
          <div className="h-1" style={{ background: "linear-gradient(90deg, #6366f1 0%, #3b82f6 100%)" }} />
        )}
        <div className="flex items-center justify-between px-4 py-3 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{
                background:
                  modelStatus === "ready"
                    ? "#22c55e"
                    : modelStatus === "loading"
                    ? "#f59e0b"
                    : modelStatus === "error"
                    ? "#ef4444"
                    : "#94a3b8",
              }}
            />
            <span className="text-sm font-medium truncate" style={{ color: "#475569" }}>
              {modelStatus === "ready"
                ? t.modelReady
                : modelStatus === "loading"
                ? modelMessage || t.modelLoading
                : modelStatus === "error"
                ? t.modelError
                : "Qwen3.5 Vision 0.8B (WebGPU)"}
            </span>
            {modelStatus === "loading" && modelProgress > 0 && (
              <span className="text-xs flex-shrink-0" style={{ color: "#94a3b8" }}>
                {modelProgress}%
              </span>
            )}
          </div>
          {modelStatus !== "loading" && (
            <button
              onClick={loadModel}
              disabled={!webgpuSupported}
              className="flex-shrink-0 rounded-xl px-3 py-1.5 text-xs font-semibold text-white transition-opacity duration-150 disabled:opacity-40"
              style={{ background: "linear-gradient(135deg, #6366f1 0%, #3b82f6 100%)" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.opacity = "0.85")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.opacity = "1")}
            >
              {modelStatus === "ready" ? "재로드" : t.loadModel}
            </button>
          )}
        </div>
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
                disabled={analyzing || modelStatus !== "ready"}
                className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-opacity duration-150 disabled:opacity-40"
                style={{ background: "linear-gradient(135deg, #f97316 0%, #ef4444 100%)" }}
                onMouseEnter={(e) => { if (!analyzing && modelStatus === "ready") (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
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
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-xs font-semibold" style={{ color: "#475569" }}>
                    {t.analysisResult}
                  </p>
                  {tokenCount > 0 && (
                    <span className="text-xs" style={{ color: "#94a3b8" }}>
                      {tokenCount} tokens
                    </span>
                  )}
                </div>
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
                      {modelStatus === "ready"
                        ? "영상을 재생하다 일시정지 후 화면 분석을 눌러주세요"
                        : modelStatus === "loading"
                        ? "모델 로딩 중..."
                        : "모델 로드 버튼을 눌러 AI를 준비하세요"}
                    </span>
                  )}
                  {analyzing && <span className="animate-pulse">▋</span>}
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
