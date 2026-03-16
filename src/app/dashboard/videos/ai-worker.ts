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
  ko: "You must respond only in Korean (한국어). Never use English or any other language.",
  en: "You must respond only in English.",
  ja: "You must respond only in Japanese (日本語). Never use English.",
  es: "You must respond only in Spanish (Español). Never use English.",
  fr: "You must respond only in French (Français). Never use English.",
  zh: "You must respond only in Chinese (中文). Never use English.",
  vi: "You must respond only in Vietnamese (Tiếng Việt). Never use English.",
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

      ctx.postMessage({ type: "status", message: "모델 다운로드 중... (~256MB, 최초 1회)" });
      model = await (AutoModelForVision2Seq as any).from_pretrained(MODEL_ID, {
        dtype: "fp16",
        device: "webgpu",
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
      const userText = `${systemMsg}\n\n${prompt || "Describe this image in detail."}`;
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
