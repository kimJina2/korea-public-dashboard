/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  AutoProcessor,
  AutoModelForVision2Seq,
  RawImage,
  TextStreamer,
} from "@huggingface/transformers";

// SmolVLM-256M: HuggingFace official browser-ready vision model
const MODEL_ID = "HuggingFaceTB/SmolVLM-256M-Instruct";

const ctx = self as any;
let processor: any = null;
let model: any = null;

const LANG_SYSTEM: Record<string, string> = {
  ko: "반드시 한국어로만 답변하세요. 영어를 절대 사용하지 마세요.",
  en: "Respond only in English. Do not use any other language.",
  ja: "必ず日本語だけで答えてください。英語を使わないでください。",
  es: "Responde únicamente en español. No uses ningún otro idioma.",
  fr: "Répondez uniquement en français. N'utilisez aucune autre langue.",
  zh: "只能用中文回答。不要使用其他语言。",
  vi: "Chỉ trả lời bằng tiếng Việt. Không sử dụng ngôn ngữ khác.",
};

ctx.addEventListener("message", async (event: MessageEvent) => {
  const { type, imageDataUrl, prompt, maxTokens, lang } = event.data as {
    type: "load" | "analyze";
    imageDataUrl?: string;
    prompt?: string;
    maxTokens?: number;
    lang?: string;
  };

  if (type === "load") {
    try {
      ctx.postMessage({ type: "status", message: "프로세서 로딩 중..." });
      processor = await AutoProcessor.from_pretrained(MODEL_ID);

      // WebGPU 지원 여부 확인 후 폴백
      const hasWebGPU = typeof navigator !== "undefined" && !!("gpu" in navigator && (navigator as any).gpu);
      const device = hasWebGPU ? "webgpu" : "wasm";
      const dtype = hasWebGPU ? "fp16" : "q4";

      ctx.postMessage({
        type: "status",
        message: hasWebGPU
          ? "모델 다운로드 중... (~256MB, 최초 1회)"
          : "모델 다운로드 중... (~64MB, CPU 모드, 최초 1회)",
      });
      model = await (AutoModelForVision2Seq as any).from_pretrained(MODEL_ID, {
        dtype,
        device,
        progress_callback: (info: any) => {
          if (info.status === "downloading") {
            const loaded = info.loaded ?? 0;
            const total = info.total ?? 0;
            const loadedMB = (loaded / 1024 / 1024).toFixed(1);
            const totalMB = total > 0 ? `/${(total / 1024 / 1024).toFixed(0)}MB` : "";
            const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
            ctx.postMessage({
              type: "status",
              message: `다운로드 중... ${loadedMB}MB${totalMB} (${pct}%)`,
            });
            ctx.postMessage({ type: "progress", progress: total > 0 ? loaded / total : 0 });
          } else if (info.status === "loading") {
            ctx.postMessage({ type: "status", message: `모델 로딩 중...` });
          }
        },
      });

      ctx.postMessage({ type: "ready" });
    } catch (error) {
      ctx.postMessage({
        type: "error",
        message: `모델 로드 실패: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  if (type === "analyze") {
    if (!processor || !model || !imageDataUrl) {
      ctx.postMessage({ type: "error", message: "모델이 준비되지 않았습니다" });
      return;
    }

    try {
      const image = await RawImage.fromURL(imageDataUrl);

      const systemMsg = LANG_SYSTEM[lang ?? "ko"] ?? LANG_SYSTEM.ko;
      const userText = `${systemMsg}\n\n${prompt || "Describe this image in detail."}\n\n${systemMsg}`;
      const messages = [
        {
          role: "user",
          content: [
            { type: "image", image },
            {
              type: "text",
              text: userText,
            },
          ],
        },
      ];

      const text = processor.apply_chat_template(messages, {
        tokenize: false,
        add_generation_prompt: true,
      });

      const inputs = await processor(text, image, { do_image_splitting: false });

      const streamer = new TextStreamer(processor.tokenizer, {
        skip_prompt: true,
        callback_function: (token: string) => {
          ctx.postMessage({ type: "token", token });
        },
      });

      await model.generate({
        ...inputs,
        max_new_tokens: maxTokens ?? 512,
        do_sample: false,
        repetition_penalty: 1.3,
        no_repeat_ngram_size: 3,
        streamer,
      });

      ctx.postMessage({ type: "done" });
    } catch (error) {
      ctx.postMessage({
        type: "error",
        message: `분석 실패: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
});
