import { exec } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { auth } from "@/auth";

const execAsync = promisify(exec);

function getVideosDir() {
  const dir = path.join(process.cwd(), "tmp_videos");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { url } = await request.json();

  // Basic YouTube URL validation
  const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?.*v=|youtu\.be\/)[\w-]+/;
  if (!ytRegex.test(url)) {
    return Response.json({ error: "유효하지 않은 YouTube URL입니다" }, { status: 400 });
  }

  const id = randomUUID();
  const videosDir = getVideosDir();
  const outputPath = path.join(videosDir, `${id}.%(ext)s`);

  try {
    // Get title first
    const { stdout: title } = await execAsync(
      `python -m yt_dlp --get-title --no-playlist "${url}"`
    ).catch(async () => {
      return execAsync(`yt-dlp --get-title --no-playlist "${url}"`);
    });

    // Download video
    await execAsync(
      `python -m yt_dlp -f "best[ext=mp4]/best[height<=720]/best" --no-playlist -o "${outputPath}" "${url}"`
    ).catch(async () => {
      return execAsync(
        `yt-dlp -f "best[ext=mp4]/best[height<=720]/best" --no-playlist -o "${outputPath}" "${url}"`
      );
    });

    // Find the downloaded file
    const files = fs.readdirSync(videosDir).filter((f) => f.startsWith(id));
    if (files.length === 0) {
      return Response.json({ error: "다운로드 실패" }, { status: 500 });
    }

    const filename = files[0];
    return Response.json({
      id,
      filename,
      title: title.trim(),
      videoUrl: `/api/youtube/video/${filename}`,
    });
  } catch (error) {
    console.error("yt-dlp error:", error);
    return Response.json({ error: "영상 다운로드 중 오류가 발생했습니다" }, { status: 500 });
  }
}
