import { GoogleGenAI } from "@google/genai";
import { UIMessage } from "ai";
import { cookies } from "next/headers";

interface GeminiPart {
  text?: string;
}

interface GeminiContent {
  role: string;
  parts: GeminiPart[];
}

function convertMessagesToGeminiContents(
  messages: UIMessage[],
): GeminiContent[] {
  const contents: GeminiContent[] = [];

  for (const message of messages) {
    const role = message.role === "user" ? "user" : "model";
    const textParts: GeminiPart[] = [];

    for (const part of message.parts) {
      if (part.type === "text") {
        textParts.push({ text: part.text });
      }
    }

    if (textParts.length > 0) {
      contents.push({ role, parts: textParts });
    }
  }

  return contents;
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();
  const contents = convertMessagesToGeminiContents(messages);

  const ai = new GoogleGenAI({
    apiKey: "placeholder",
    httpOptions: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "x-goog-user-project": "my-assistant-494612",
      },
    },
  });

  const response = await ai.models.generateContentStream({
    model: "gemini-3-flash-preview",
    contents,
    config: {
      systemInstruction: "You are a helpful assistant. Be concise.",
    },
  });

  const messageId = crypto.randomUUID();
  const textPartId = crypto.randomUUID();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "start", messageId })}\n\n`,
        ),
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "text-start", id: textPartId })}\n\n`,
        ),
      );

      for await (const chunk of response) {
        const text = chunk.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) {
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({ type: "text-delta", id: textPartId, delta: text })}\n\n`,
            ),
          );
        }
      }

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "text-end", id: textPartId })}\n\n`,
        ),
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "finish", finishReason: "stop" })}\n\n`,
        ),
      );
      controller.enqueue("data: [DONE]\n\n");
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "x-vercel-ai-ui-message-stream": "v1",
      "x-accel-buffering": "no",
    },
  });
}
