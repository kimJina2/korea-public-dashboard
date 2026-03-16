import YTDlpWrap from "yt-dlp-wrap";
import { randomUUID } from "crypto";
import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import os from "os";
import { auth } from "@/auth";

export const maxDuration = 300; // Vercel Pro: 5분 타임아웃

function getVideosDir() {
  const dir = path.join(os.tmpdir(), "yt_videos");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getYtDlp(): Promise<YTDlpWrap> {
  // 1. 시스템 PATH에 yt-dlp가 설치되어 있으면 그것을 사용
  try {
    execSync("yt-dlp --version", { stdio: "ignore" });
    return new YTDlpWrap("yt-dlp");
  } catch { /* not in PATH, fall through */ }

  // 2. 임시 디렉토리에 바이너리 다운로드
  const binaryDir = path.join(os.tmpdir(), "ytdlp_bin");
  if (!fs.existsSync(binaryDir)) fs.mkdirSync(binaryDir, { recursive: true });

  const ext = process.platform === "win32" ? ".exe" : "";
  const binaryPath = path.join(binaryDir, `yt-dlp${ext}`);

  const downloadAndWait = async () => {
    if (fs.existsSync(binaryPath)) fs.unlinkSync(binaryPath);

    // 플랫폼에 맞는 standalone 바이너리 명시적 다운로드
    const assetName =
      process.platform === "win32" ? "yt-dlp.exe" :
      process.platform === "darwin" ? "yt-dlp_macos" :
      "yt-dlp_linux"; // Linux: Python 불필요한 standalone 바이너리

    const apiRes = await fetch("https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest");
    const release = await apiRes.json();
    const asset = release.assets?.find((a: { name: string }) => a.name === assetName);
    if (!asset) throw new Error(`yt-dlp 바이너리를 찾을 수 없습니다: ${assetName}`);

    const binRes = await fetch(asset.browser_download_url);
    if (!binRes.ok) throw new Error(`바이너리 다운로드 실패: ${binRes.status}`);
    const buf = await binRes.arrayBuffer();
    fs.writeFileSync(binaryPath, Buffer.from(buf));

    if (process.platform !== "win32") {
      fs.chmodSync(binaryPath, 0o755);
    }
    // Windows: 바이러스 스캐너가 파일 잠금 해제 대기
    if (process.platform === "win32") {
      await sleep(3000);
    }
  };

  if (!fs.existsSync(binaryPath)) {
    await downloadAndWait();
  }

  // EBUSY 대비: 실제로 실행 가능한지 확인
  try {
    execSync(`"${binaryPath}" --version`, { stdio: "ignore" });
  } catch (e) {
    const code = (e as NodeJS.ErrnoException).code;
    if (code === "EBUSY" || code === "EACCES") {
      // 잠긴 바이너리 → 재다운로드
      await downloadAndWait();
    }
  }

  return new YTDlpWrap(binaryPath);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const url: string = body?.url ?? "";

  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?.*v=|youtu\.be\/)[\w-]+/;
  if (!ytRegex.test(url)) {
    return Response.json({ error: "유효하지 않은 YouTube URL입니다" }, { status: 400 });
  }

  const id = randomUUID();
  const videosDir = getVideosDir();
  const outputPath = path.join(videosDir, `${id}.mp4`);

  try {
    const ytdlp = await getYtDlp();

    // Get title
    let title = "영상";
    try {
      const info = await ytdlp.getVideoInfo(url);
      if (info?.title) title = info.title;
    } catch { /* optional */ }

    // Download: single-stream formats only (no ffmpeg merge needed)
    await ytdlp.execPromise([
      url,
      "-f", "best[ext=mp4]/best[height<=720][ext=mp4]/best",
      "--no-playlist",
      "-o", outputPath,
    ]);

    if (!fs.existsSync(outputPath)) {
      return Response.json({ error: "다운로드 파일을 찾을 수 없습니다" }, { status: 500 });
    }

    return Response.json({
      id,
      filename: `${id}.mp4`,
      title,
      videoUrl: `/api/youtube/video/${id}.mp4`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("yt-dlp error:", msg);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    return Response.json({ error: msg }, { status: 500 });
  }
}
