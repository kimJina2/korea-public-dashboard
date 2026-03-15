import { exec } from "child_process";
import { promisify } from "util";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import { auth } from "@/auth";

const execAsync = promisify(exec);
const EXEC_OPTS = { timeout: 5 * 60 * 1000, maxBuffer: 1024 * 1024 * 10 };

function getVideosDir() {
  const dir = path.join(process.cwd(), "tmp_videos");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
}

async function runCommand(cmd: string): Promise<{ stdout: string; stderr: string }> {
  return execAsync(cmd, EXEC_OPTS);
}

async function ytdlp(args: string): Promise<{ stdout: string; stderr: string }> {
  // Try yt-dlp binary first, then python -m yt_dlp
  try {
    return await runCommand(`yt-dlp ${args}`);
  } catch {
    return await runCommand(`python -m yt_dlp ${args}`);
  }
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
  // Fixed mp4 output — no shell templating issues
  const outputPath = path.join(videosDir, `${id}.mp4`);

  try {
    // Get title (non-fatal if it fails)
    let title = "영상";
    try {
      const { stdout } = await ytdlp(`--get-title --no-playlist "${url}"`);
      if (stdout.trim()) title = stdout.trim();
    } catch {
      // title is optional
    }

    // Download
    await ytdlp(
      `-f "best[ext=mp4]/bestvideo[ext=mp4]+bestaudio/best" --no-playlist --merge-output-format mp4 -o "${outputPath}" "${url}"`
    );

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
    return Response.json(
      { error: `다운로드 실패: ${msg.slice(0, 200)}` },
      { status: 500 }
    );
  }
}
