import YTDlpWrap from "yt-dlp-wrap";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import os from "os";
import { auth } from "@/auth";

export const maxDuration = 300;

const YTDLP_BIN = path.join(os.tmpdir(), process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");

// yt-dlp GitHub releases: "yt-dlp" is a Python script on Linux; "yt-dlp_linux" is the standalone binary.
// YTDlpWrap.downloadFromGithub downloads the Python script which requires python3 (not available on Vercel).
// We download the correct standalone binary directly.
const YTDLP_LINUX_URL = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux";

async function ensureYtDlp(): Promise<YTDlpWrap> {
  if (!fs.existsSync(YTDLP_BIN)) {
    console.log("[ytdl] downloading yt-dlp binary...");
    if (process.platform === "linux") {
      const res = await fetch(YTDLP_LINUX_URL);
      if (!res.ok) throw new Error(`Failed to download yt-dlp_linux: HTTP ${res.status}`);
      const buf = await res.arrayBuffer();
      fs.writeFileSync(YTDLP_BIN, Buffer.from(buf));
      fs.chmodSync(YTDLP_BIN, 0o755);
    } else if (process.platform === "win32") {
      await YTDlpWrap.downloadFromGithub(YTDLP_BIN);
    } else {
      await YTDlpWrap.downloadFromGithub(YTDLP_BIN);
      fs.chmodSync(YTDLP_BIN, 0o755);
    }
    console.log("[ytdl] yt-dlp binary downloaded");
  }
  return new YTDlpWrap(YTDLP_BIN);
}

function getVideosDir() {
  const dir = path.join(os.tmpdir(), "yt_videos");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
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
    const ytdlp = await ensureYtDlp();

    // Write cookies to /tmp if YT_COOKIES_B64 env var is set
    const cookiesPath = path.join(os.tmpdir(), "yt-cookies.txt");
    if (process.env.YT_COOKIES_B64) {
      const decoded = Buffer.from(process.env.YT_COOKIES_B64, "base64").toString("utf8");
      fs.writeFileSync(cookiesPath, decoded);
    }

    // NOTE: do NOT specify player_client — mweb/android/ios all require GVS PO Token
    // which causes "Requested format is not available". Let yt-dlp auto-select
    // (defaults to android_vr which works without a PO Token).
    const baseArgs: string[] = [
      url,
      "--no-playlist",
    ];
    if (process.env.YT_COOKIES_B64 && fs.existsSync(cookiesPath)) {
      baseArgs.push("--cookies", cookiesPath);
    }
    // Pass current Node.js binary path so yt-dlp can solve YouTube's n-challenge
    baseArgs.push("--js-runtimes", `node:${process.execPath}`);

    // Step 1: get title + download in a single yt-dlp call
    // --print runs after extraction so we get the title alongside the download
    let title = "영상";
    console.log("[ytdl] starting download...");
    const stdout = await ytdlp.execPromise([
      ...baseArgs,
      "--no-simulate",
      "-f", "18/best[ext=mp4]/best",
      "-o", outputPath,
      "--print", "%(title)s",
    ]);
    title = stdout.trim() || "영상";
    console.log("[ytdl] title:", title);

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      return Response.json({ error: "다운로드 파일을 찾을 수 없습니다" }, { status: 500 });
    }

    const fileSize = fs.statSync(outputPath).size;
    console.log("[ytdl] done:", fileSize, "bytes");

    // Return video binary directly — Vercel serverless /tmp is not shared across
    // function instances, so a separate /api/youtube/video route would 404.
    const videoBuffer = fs.readFileSync(outputPath);
    fs.unlinkSync(outputPath);

    return new Response(videoBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(fileSize),
        "X-Video-Title": encodeURIComponent(title),
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("youtube download error:", msg);
    console.error("youtube download stack:", stack?.split("\n")[1] ?? "");
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    return Response.json({ error: msg, stack: stack?.split("\n")[1] ?? "" }, { status: 500 });
  }
}
