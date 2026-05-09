import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, UIMessage } from "ai";
import { cookies } from "next/headers";
import { readFileSync } from "fs";
import { join } from "path";

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const secretPath = join(process.cwd(), "..", "oauth2-client-secret.json");
  const secret = JSON.parse(readFileSync(secretPath, "utf-8"));
  const projectId = secret.web.project_id;

  const google = createGoogleGenerativeAI({
    apiKey: "placeholder",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "x-goog-user-project": projectId,
    },
  });

  const { textStream } = streamText({
    model: google("models/gemini-3-flash-preview"),
    system: "You are a helpful assistant. Be concise.",
    messages: messages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text)
        .join(""),
    })),
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

      for await (const text of textStream) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({ type: "text-delta", id: textPartId, delta: text })}\n\n`,
          ),
        );
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
