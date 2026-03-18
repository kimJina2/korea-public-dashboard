import { auth } from "@/auth";

export const maxDuration = 60;

const LANG_INSTRUCTION: Record<string, string> = {
  ko: "반드시 한국어로만 답변하세요.",
  en: "Respond only in English.",
  ja: "必ず日本語だけで答えてください。",
  es: "Responde únicamente en español.",
  fr: "Répondez uniquement en français.",
  zh: "只能用中文回答。",
  vi: "Chỉ trả lời bằng tiếng Việt.",
};

export async function POST(request: Request) {
  const session = await auth();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  if (!process.env.GROQ_API_KEY) {
    return Response.json({ error: "API key not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { imageDataUrl, prompt, lang, maxTokens } = body as {
    imageDataUrl?: string;
    prompt?: string;
    lang?: string;
    maxTokens?: number;
  };

  if (!imageDataUrl?.startsWith("data:image/")) {
    return Response.json({ error: "Invalid image data" }, { status: 400 });
  }

  const langInstruction = LANG_INSTRUCTION[lang ?? "ko"] ?? LANG_INSTRUCTION.ko;
  const userPrompt = `${langInstruction}\n\n${prompt || "이 이미지를 자세히 분석해서 설명해 주세요."}`;

  try {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "meta-llama/llama-4-scout-17b-16e-instruct",
        max_tokens: maxTokens ?? 512,
        messages: [
          {
            role: "user",
            content: [
              { type: "image_url", image_url: { url: imageDataUrl } },
              { type: "text", text: userPrompt },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq API error:", res.status, err);
      return Response.json({ error: `API 오류 ${res.status}: ${err.slice(0, 200)}` }, { status: 500 });
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    return Response.json({ result: text });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("Groq error:", msg);
    return Response.json({ error: msg.slice(0, 200) }, { status: 500 });
  }
}
