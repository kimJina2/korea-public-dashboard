import { Innertube, ClientType } from "youtubei.js";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "stream";
import { auth } from "@/auth";

export const maxDuration = 300;

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

async function tryDownload(videoId: string, outputPath: string, clientType: ClientType) {
  const yt = await Innertube.create({
    client_type: clientType,
    generate_session_locally: true,
  });

  const info = await yt.getBasicInfo(videoId);
  const title = info.basic_info.title ?? "영상";

  const stream = await yt.download(videoId, {
    type: "video+audio",
    quality: "best",
    format: "mp4",
  });

  const writeStream = fs.createWriteStream(outputPath);
  const readable = Readable.fromWeb(stream as Parameters<typeof Readable.fromWeb>[0]);
  await new Promise<void>((resolve, reject) => {
    readable.pipe(writeStream);
    writeStream.on("finish", resolve);
    writeStream.on("error", reject);
    readable.on("error", reject);
  });

  return title;
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
    const videoId = extractVideoId(url);

    // IOS 클라이언트 → 실패 시 TV_EMBEDDED 클라이언트로 재시도
    let title = "영상";
    try {
      title = await tryDownload(videoId, outputPath, ClientType.IOS);
    } catch (e1) {
      const m1 = e1 instanceof Error ? e1.message : String(e1);
      console.warn("IOS client failed, trying TV_EMBEDDED:", m1);
      if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
      title = await tryDownload(videoId, outputPath, ClientType.TV_EMBEDDED);
    }

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
