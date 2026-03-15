import path from "path";
import fs from "fs";
import { Readable } from "stream";
import { auth } from "@/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  const session = await auth();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { filename } = await params;

  // Security: prevent path traversal
  const safeName = path.basename(filename);
  const filePath = path.join(process.cwd(), "tmp_videos", safeName);

  if (!fs.existsSync(filePath)) {
    return new Response("Not found", { status: 404 });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = request.headers.get("range");

  const ext = path.extname(safeName).toLowerCase();
  const contentType = ext === ".webm" ? "video/webm" : "video/mp4";

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const nodeStream = fs.createReadStream(filePath, { start, end });
    const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

    return new Response(webStream, {
      status: 206,
      headers: {
        "Content-Range": `bytes ${start}-${end}/${fileSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": String(chunkSize),
        "Content-Type": contentType,
      },
    });
  }

  const nodeStream = fs.createReadStream(filePath);
  const webStream = Readable.toWeb(nodeStream) as ReadableStream<Uint8Array>;

  return new Response(webStream, {
    headers: {
      "Content-Length": String(fileSize),
      "Content-Type": contentType,
      "Accept-Ranges": "bytes",
    },
  });
}
