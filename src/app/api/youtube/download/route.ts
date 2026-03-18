import { Innertube, Platform } from "youtubei.js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import { BG } from "bgutils-js";
import vm from "node:vm";
import { pipeline } from "node:stream/promises";
import { randomUUID } from "crypto";
import path from "path";
import fs from "fs";
import os from "os";
import { Readable } from "node:stream";
import { auth } from "@/auth";

export const maxDuration = 300;

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

/** Netscape cookies.txt → "NAME=VALUE; NAME2=VALUE2" */
function parseCookieTxt(raw: string): string {
  const normalized = raw.replace(/\\n/g, "\n").replace(/\\t/g, "\t");
  return normalized
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

const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

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
  console.log("[ytdl] cookie:", cookie ? `${cookie.split(";").length} pairs` : "none");

  try {
    const videoId = extractVideoId(url);

    // Custom fetch: inject cookies + UA into CDN requests, log 403 body for diagnosis
    const customFetch: typeof fetch = async (input, init) => {
      const reqUrl =
        typeof input === "string" ? input : input instanceof URL ? input.href : (input as Request).url;
      const isGooglevideo = reqUrl.includes("googlevideo.com");

      if (isGooglevideo) {
        // Add alr=yes to allow CDN redirects, cookies, and browser UA
        const cdnUrl = reqUrl.includes("alr=") ? reqUrl : reqUrl + "&alr=yes";
        const headers = new Headers((init?.headers as HeadersInit) ?? {});
        if (cookie) headers.set("Cookie", cookie);
        headers.set("User-Agent", BROWSER_UA);
        headers.set("Accept-Encoding", "identity");
        const res = await fetch(cdnUrl, { ...init, headers });
        if (!res.ok) {
          const errBody = await res.clone().text();
          console.error("[ytdl] CDN", res.status, cdnUrl.substring(0, 120));
          console.error("[ytdl] CDN body:", errBody.substring(0, 300));
        }
        return res;
      }
      return fetch(input, init);
    };

    // Step 1: create Innertube to get visitor_data
    const ytInit = await Innertube.create({
      ...(cookie ? { cookie } : {}),
      fetch: customFetch,
    });
    const visitorData = ytInit.session.context.client.visitorData ?? "";
    console.log("[ytdl] visitorData:", visitorData.substring(0, 20));

    // Step 2: generate full PoToken via BotGuard challenge
    let poToken: string | undefined;
    try {
      const bgConfig = {
        fetch: customFetch as typeof globalThis.fetch,
        globalObj: globalThis,
        identifier: visitorData,
        requestKey: "O43z0dpjhgX20SCx4KAo",
      };
      const challenge = await BG.Challenge.create(bgConfig);
      if (challenge?.program) {
        const interpreterScript =
          challenge.interpreterJavascript?.privateDoNotAccessOrElseSafeScriptWrappedValue;
        if (interpreterScript) {
          // BotGuard interpreter + PoToken generation both need browser globals.
          // Mock them on globalThis before running, clean up after.
          const g = globalThis as Record<string, unknown>;
          const addedKeys: string[] = [];
          const mock = (key: string, val: unknown) => {
            if (!(key in g)) { g[key] = val; addedKeys.push(key); }
          };
          mock("window", globalThis);
          mock("document", {
            createElement: () => ({ style: {}, setAttribute: () => {}, appendChild: () => {}, childNodes: [] }),
            createTextNode: () => ({ nodeType: 3 }),
            createComment: () => ({}),
            body: { appendChild: () => {}, insertBefore: () => {} },
            head: { appendChild: () => {} },
            getElementById: () => null,
            querySelectorAll: () => [],
            addEventListener: () => {},
          });
          mock("navigator", { userAgent: BROWSER_UA, language: "ko-KR", languages: ["ko-KR", "ko"] });
          mock("location", { href: "https://www.youtube.com/", hostname: "www.youtube.com", origin: "https://www.youtube.com" });
          mock("performance", { now: () => Date.now(), mark: () => {}, measure: () => {} });
          mock("screen", { width: 1920, height: 1080 });
          try {
            vm.runInThisContext(interpreterScript);
            console.log("[ytdl] interpreter executed, VM type:", typeof g[challenge.globalName]);
            // PoToken.generate uses the VM — keep mocks alive through this call
            const result = await BG.PoToken.generate({
              program: challenge.program,
              globalName: challenge.globalName,
              bgConfig,
            });
            poToken = result.poToken;
            console.log("[ytdl] poToken generated:", poToken?.substring(0, 20));
          } catch (e) {
            console.warn("[ytdl] PoToken error:", e instanceof Error ? e.message : String(e));
          } finally {
            for (const key of addedKeys) delete g[key];
            // Clean up VM registered by interpreter
            if (challenge.globalName in g) delete g[challenge.globalName];
          }
        } else {
          console.warn("[ytdl] no interpreter script in challenge");
        }
      } else {
        console.warn("[ytdl] BG.Challenge returned no program");
      }
    } catch (e) {
      console.warn("[ytdl] PoToken setup failed:", e instanceof Error ? e.message : String(e));
    }

    // Step 3: recreate Innertube with visitor_data + po_token
    const yt = await Innertube.create({
      ...(cookie ? { cookie } : {}),
      ...(visitorData ? { visitor_data: visitorData } : {}),
      ...(poToken ? { po_token: poToken } : {}),
      fetch: customFetch,
    });

    const info = await yt.getBasicInfo(videoId);
    const title = info.basic_info.title ?? "영상";
    console.log("[ytdl] title:", title);

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
    if (msg.includes("Sign in") || msg.includes("not a bot") || msg.includes("LOGIN_REQUIRED") || msg.toLowerCase().includes("login required")) {
      userMsg = "YouTube가 서버 접근을 차단했습니다. 잠시 후 다시 시도하거나 다른 영상을 이용해주세요.";
    } else if (msg.includes("Private") || msg.includes("private")) {
      userMsg = "비공개 영상은 다운로드할 수 없습니다.";
    } else if (msg.includes("unavailable") || msg.includes("Video unavailable")) {
      userMsg = "해당 영상을 찾을 수 없거나 재생이 불가능합니다.";
    } else if (msg.includes("age") && msg.includes("restrict")) {
      userMsg = "연령 제한 영상은 다운로드할 수 없습니다.";
    } else if (msg.includes("copyright") || msg.includes("removed")) {
      userMsg = "저작권 문제로 다운로드할 수 없는 영상입니다.";
    } else if (msg.includes("non 2xx") || msg.includes("403")) {
      userMsg = "YouTube CDN이 다운로드를 차단했습니다. 쿠키를 갱신하거나 잠시 후 다시 시도해주세요.";
    }

    return Response.json({ error: userMsg }, { status: 500 });
  }
}
