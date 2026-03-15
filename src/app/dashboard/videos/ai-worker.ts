/* eslint-disable @typescript-eslint/no-explicit-any */
import { pipeline, TextStreamer, RawImage } from "@huggingface/transformers";

const MODEL_ID = "onnx-community/SmolVLM-500M-Instruct";

const ctx = self as any;
let pipe: any = null;

ctx.addEventListener("message", async (event: MessageEvent) => {
  const { type, imageDataUrl, prompt, maxTokens } = event.data as {
    type: "load" | "analyze";
    imageDataUrl?: string;
    prompt?: string;
    maxTokens?: number;
  };

  if (type === "load") {
    try {
      ctx.postMessage({ type: "status", message: "모델 다운로드 중... (~500MB, 최초 1회)" });

      pipe = await (pipeline as any)("image-text-to-text", MODEL_ID, {
        dtype: {
          embed_tokens: "q4",
          vision_encoder: "fp16",
          decoder_model_merged: "q4",
        },
        device: "webgpu",
        progress_callback: (info: any) => {
          if (info.status === "downloading" && info.progress !== undefined) {
            ctx.postMessage({ type: "progress", progress: info.progress });
          } else if (info.status === "loading") {
            ctx.postMessage({ type: "status", message: `로딩 중: ${info.file ?? ""}` });
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
    if (!pipe || !imageDataUrl) {
      ctx.postMessage({ type: "error", message: "모델이 준비되지 않았습니다" });
      return;
    }

    try {
      const image = await RawImage.fromURL(imageDataUrl);

      const messages = [
        {
          role: "user",
          content: [
            { type: "image", image },
            {
              type: "text",
              text:
                prompt ||
                "이 이미지를 자세히 분석해서 한국어로 설명해 주세요. 화면에 보이는 모든 요소, 텍스트, 사람, 물체, 배경, 분위기 등을 상세하게 묘사해 주세요.",
            },
          ],
        },
      ];

      const streamer = new TextStreamer(pipe.tokenizer, {
        skip_prompt: true,
        callback_function: (token: string) => {
          ctx.postMessage({ type: "token", token });
        },
      });

      await pipe(messages, {
        max_new_tokens: maxTokens ?? 512,
        do_sample: false,
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
