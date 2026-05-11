import { GoogleGenAI } from "@google/genai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { streamText, type UIMessage } from "ai";
import { cookies } from "next/headers";

function convertUIMessagesToCoreMessages(messages: UIMessage[]) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "assistant" as const : m.role as "user" | "system",
    content: m.parts
      .filter((p): p is Extract<typeof p, { type: "text" }> => p.type === "text")
      .map((p) => p.text)
      .join(""),
  }));
}

export async function POST(req: Request) {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("access_token")?.value;

  if (!accessToken) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages }: { messages: UIMessage[] } = await req.json();

  const authHeaders = {
    Authorization: `Bearer ${accessToken}`,
    "x-goog-user-project": "my-assistant-494612",
  };

  const ai = new GoogleGenAI({
    apiKey: "placeholder",
    httpOptions: { headers: authHeaders },
  });

  const google = createGoogleGenerativeAI({
    apiKey: "placeholder",
    headers: authHeaders,
  });

  const result = streamText({
    model: google("gemini-3-flash-preview"),
    system: "You are a helpful assistant. Be concise.",
    messages: convertUIMessagesToCoreMessages(messages),
  });

  return result.toUIMessageStreamResponse();
}
