import { Innertube, Platform } from "youtubei.js";
import vm from "node:vm";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "node:stream";
import { auth } from "@/auth";

export const maxDuration = 300;

// Node.js vm evaluator를 모듈 로드 시점에 즉시 등록 (import 직후)
// youtubei.js node.js platform 초기화 이후 override하여 n-parameter 디코딩 활성화
Platform.load({
  ...Platform.shim,
  eval: (data: { output: string; exported: string[] }, env: Record<string, unknown>) => {
    const ctx = vm.createContext({ ...env, __jsExtractorGlobal: globalThis });
    return vm.runInContext("(function() {" + data.output + "})()", ctx);
  },
});

function getVideosDir() {
  const dir = path.join(os.tmpdir(), "yt_videos");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function extractVideoId(url: string): string {
  const match = url.match(/(?:v=|youtu\.be\/)([^&?/\s]+)/);
  if (!match) throw new Error("YouTube 영상 ID를 찾을 수 없습니다");
  return match[1];
}

/** Netscape cookies.txt → "NAME=VALUE; NAME2=VALUE2" 형식 변환 */
function parseCookieTxt(raw: string): string {
  return raw
    .split("\n")
    .filter((line) => line && !line.startsWith("#"))
    .map((line) => {
      const parts = line.split("\t");
      if (parts.length < 7) return null;
      return `${parts[5].trim()}=${parts[6].trim()}`;
    })
    .filter(Boolean)
    .join("; ");
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
  const cookie = rawCookies.trim() ? parseCookieTxt(rawCookies) : undefined;

  try {
    const videoId = extractVideoId(url);

    const yt = await Innertube.create({
      ...(cookie ? { cookie } : {}),
    });

    const info = await yt.getBasicInfo(videoId);
    const title = info.basic_info.title ?? "영상";

    const stream = await yt.download(videoId, {
      type: "video+audio",
      quality: "best",
      format: "any",
    });

    const readable = Readable.fromWeb(stream as Parameters<typeof Readable.fromWeb>[0]);
    await pipeline(readable, fs.createWriteStream(outputPath)).catch((err: NodeJS.ErrnoException) => {
      if (err.code !== "ERR_INVALID_STATE") throw err;
    });

    if (!fs.existsSync(outputPath) || fs.statSync(outputPath).size === 0) {
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
    console.error("youtube download error:", msg);
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);

    let userMsg = "다운로드에 실패했습니다. 잠시 후 다시 시도해주세요.";
    if (
      msg.includes("Sign in") ||
      msg.includes("not a bot") ||
      msg.includes("LOGIN_REQUIRED") ||
      msg.toLowerCase().includes("login required")
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
    }

    return Response.json({ error: userMsg }, { status: 500 });
  }
}
