import ytdl from "@distube/ytdl-core";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { auth } from "@/auth";

function getVideosDir() {
  const dir = path.join(process.cwd(), "tmp_videos");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json();
  const url: string = body?.url ?? "";

  if (!ytdl.validateURL(url)) {
    return Response.json({ error: "유효하지 않은 YouTube URL입니다" }, { status: 400 });
  }

  const id = randomUUID();
  const videosDir = getVideosDir();
  const outputPath = path.join(videosDir, `${id}.mp4`);

  try {
    // Get video info
    const info = await ytdl.getInfo(url);
    const title = info.videoDetails.title ?? "영상";

    // Choose best format: prefer mp4 with audio, fallback to any with audio
    let format;
    try {
      format = ytdl.chooseFormat(info.formats, {
        quality: "highestvideo",
        filter: (f) => f.container === "mp4" && !!f.hasAudio,
      });
    } catch {
      format = ytdl.chooseFormat(info.formats, { quality: "highestvideo", filter: "audioandvideo" });
    }

    await new Promise<void>((resolve, reject) => {
      const stream = ytdl.downloadFromInfo(info, { format });
      const file = fs.createWriteStream(outputPath);
      stream.pipe(file);
      stream.on("error", reject);
      file.on("finish", resolve);
      file.on("error", reject);
    });

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
    console.error("ytdl error:", msg);
    // Clean up partial file
    if (fs.existsSync(outputPath)) fs.unlinkSync(outputPath);
    return Response.json(
      { error: `다운로드 실패: ${msg.slice(0, 300)}` },
      { status: 500 }
    );
  }
}
