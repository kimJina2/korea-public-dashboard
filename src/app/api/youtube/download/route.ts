import YTDlpWrap from "yt-dlp-wrap";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { auth } from "@/auth";

export const maxDuration = 300; // Vercel Pro: 5분 타임아웃

function getVideosDir() {
  const dir = path.join("/tmp", "yt_videos");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function getYtDlp(): Promise<YTDlpWrap> {
  const binaryDir = path.join("/tmp", "ytdlp_bin");
  if (!fs.existsSync(binaryDir)) fs.mkdirSync(binaryDir, { recursive: true });

  const ext = process.platform === "win32" ? ".exe" : "";
  const binaryPath = path.join(binaryDir, `yt-dlp${ext}`);

  if (!fs.existsSync(binaryPath)) {
    // Auto-download latest yt-dlp binary
    await YTDlpWrap.downloadFromGithub(binaryPath);
    // Make executable on Unix/Linux (Vercel)
    if (process.platform !== "win32") {
      fs.chmodSync(binaryPath, 0o755);
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
    // Do not expose internal error details to client
    return Response.json({ error: "다운로드에 실패했습니다. 잠시 후 다시 시도해주세요." }, { status: 500 });
  }
}
