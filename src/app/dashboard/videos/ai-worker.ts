/// <reference lib="webworker" />

import {
  AutoProcessor,
  AutoModelForVision2Seq,
  RawImage,
  TextStreamer,
  type PretrainedModelOptions,
} from "@huggingface/transformers";

const MODEL_ID = "onnx-community/Qwen3.5-0.8B-ONNX";

let processor: InstanceType<typeof AutoProcessor> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let model: any = null;

self.addEventListener("message", async (event: MessageEvent) => {
  const { type, imageDataUrl, prompt } = event.data as {
    type: "load" | "analyze";
    imageDataUrl?: string;
    prompt?: string;
  };

  if (type === "load") {
    try {
      self.postMessage({ type: "status", message: "프로세서 로딩 중..." });

      processor = await AutoProcessor.from_pretrained(MODEL_ID);

      self.postMessage({ type: "status", message: "모델 다운로드 중... (~500MB, 최초 1회)" });

      const modelOptions: PretrainedModelOptions = {
        dtype: {
          embed_tokens: "q4",
          vision_encoder: "fp16",
          decoder_model_merged: "q4",
        } as Record<string, string>,
        device: "webgpu",
        progress_callback: (info: { status: string; progress?: number; file?: string }) => {
          if (info.status === "downloading" && info.progress !== undefined) {
            self.postMessage({ type: "progress", progress: info.progress });
          } else if (info.status === "loading") {
            self.postMessage({ type: "status", message: `로딩 중: ${info.file ?? ""}` });
          }
        },
      };

      model = await AutoModelForVision2Seq.from_pretrained(MODEL_ID, modelOptions);

      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({
        type: "error",
        message: `모델 로드 실패: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  if (type === "analyze") {
    if (!processor || !model || !imageDataUrl) {
      self.postMessage({ type: "error", message: "모델이 준비되지 않았습니다" });
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const text = (processor as any).apply_chat_template(messages, {
        tokenize: false,
        add_generation_prompt: true,
      });

      const inputs = await (processor as (...args: unknown[]) => Promise<unknown>)(
        text,
        image,
        { do_image_splitting: false }
      );

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const streamer = new TextStreamer((processor as any).tokenizer, {
        skip_prompt: true,
        callback_function: (token: string) => {
          self.postMessage({ type: "token", token });
        },
      });

      await model.generate({
        ...(inputs as object),
        max_new_tokens: 512,
        do_sample: false,
        streamer,
      });

      self.postMessage({ type: "done" });
    } catch (error) {
      self.postMessage({
        type: "error",
        message: `분석 실패: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }
});
