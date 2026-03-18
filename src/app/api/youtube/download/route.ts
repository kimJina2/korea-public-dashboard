import YTDlpWrap from "yt-dlp-wrap";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import os from "os";
import { auth } from "@/auth";

export const maxDuration = 300;

const YTDLP_BIN = path.join(os.tmpdir(), process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp");
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Safari/537.36";

async function ensureYtDlp(): Promise<YTDlpWrap> {
  if (!fs.existsSync(YTDLP_BIN)) {
    console.log("[ytdl] downloading yt-dlp binary...");
    await YTDlpWrap.downloadFromGithub(YTDLP_BIN);
    if (process.platform !== "win32") {
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
  const rawCookies = process.env.YOUTUBE_COOKIES ?? "";
  let cookieFile: string | undefined;

  try {
    const ytdlp = await ensureYtDlp();

    // Write Netscape cookies.txt to temp file (env var uses literal \n\t)
    if (rawCookies.trim()) {
      cookieFile = path.join(os.tmpdir(), `yt_cookies_${id}.txt`);
      const normalized = rawCookies.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
      fs.writeFileSync(cookieFile, normalized);
    }

    // Common args: mobile clients bypass CDN bot detection
    const baseArgs = [
      url,
      "--extractor-args", "youtube:player_client=mweb,android,ios",
      "--user-agent", BROWSER_UA,
      "--no-playlist",
      "--no-warnings",
      ...(cookieFile ? ["--cookies", cookieFile] : []),
    ];

    // Step 1: get title + download in a single yt-dlp call
    // --print runs after extraction so we get the title alongside the download
    let title = "영상";
    console.log("[ytdl] starting download...");
    const stdout = await ytdlp.execPromise([
      ...baseArgs,
      "-f", "18/best[ext=mp4]/best",
      "-o", outputPath,
      "--print", "%(title)s",
    ]);
    title = stdout.trim() || "영상";
    console.log("[ytdl] title:", title);

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
      return Response.json({ error: "다운로드 파일을 찾을 수 없습니다" }, { status: 500 });
    }

    console.log("[ytdl] done:", fs.statSync(outputPath).size, "bytes");
    return Response.json({
      id,
      filename: `${id}.mp4`,
      title,
      videoUrl: `/api/youtube/video/${id}.mp4`,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("youtube download error:", msg);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    let userMsg = "다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.";
    if (
      msg.includes("Sign in") ||
      msg.includes("LOGIN_REQUIRED") ||
      msg.toLowerCase().includes("login required") ||
      msg.includes("not a bot")
    ) {
      userMsg = "YouTube가 서버 접근을 차단했습니다. 잠시 후 다시 시도하거나 다른 영상을 이용해주세요.";
    } else if (msg.includes("Private") || msg.includes("private")) {
      userMsg = "비공개 영상은 다운로드할 수 없습니다.";
    } else if (msg.includes("unavailable") || msg.includes("Video unavailable")) {
      userMsg = "해당 영상을 찾을 수 없거나 재생이 불가능합니다.";
    } else if (msg.includes("age") && msg.includes("restrict")) {
      userMsg = "연령 제한 영상은 다운로드할 수 없습니다.";
    } else if (msg.includes("copyright") || msg.includes("removed")) {
      userMsg = "저작권 문제로 다운로드할 수 없는 영상입니다.";
    } else if (msg.includes("403") || msg.includes("non 2xx")) {
      userMsg = "YouTube CDN이 다운로드를 차단했습니다. 잠시 후 다시 시도해주세요.";
    }

    return Response.json({ error: userMsg }, { status: 500 });
  } finally {
    if (cookieFile && fs.existsSync(cookieFile)) {
      fs.unlinkSync(cookieFile);
    }
  }
}
