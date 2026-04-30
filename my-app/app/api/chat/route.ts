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

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:streamGenerateContent?alt=sse",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "x-goog-user-project": "my-assistant-494612",
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: "You are a helpful assistant. Be concise." }],
        },
      }),
    },
  );

  console.log("response: ", response);

  if (!response.ok) {
    const errorText = await String(response.body);
    console.error("Gemini API error:", response.status, errorText);
    return new Response(errorText, { status: response.status });
  }

  const messageId = crypto.randomUUID();
  const textPartId = crypto.randomUUID();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "message-start", messageId })}\n\n`,
        ),
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "text-start", id: textPartId })}\n\n`,
        ),
      );

      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();
            if (!jsonStr || jsonStr === "[DONE]") continue;

            try {
              const data = JSON.parse(jsonStr);
              const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) {
                controller.enqueue(
                  encoder.encode(
                    `data: ${JSON.stringify({ type: "text-delta", id: textPartId, delta: text })}\n\n`,
                  ),
                );
              }
            } catch {
              // skip malformed JSON
            }
          }
        }
      }

      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "text-end", id: textPartId })}\n\n`,
        ),
      );
      controller.enqueue(
        encoder.encode(
          `data: ${JSON.stringify({ type: "finish-message", messageId })}\n\n`,
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
