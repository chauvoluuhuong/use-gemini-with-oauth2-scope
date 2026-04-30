"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState } from "react";

export default function Chat() {
  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });
  const [input, setInput] = useState("");

  const isLoading = status === "submitted" || status === "streaming";

  return (
    <div className="w-full max-w-lg flex flex-col gap-4">
      <h2 className="text-xl font-bold">Chat with Gemini</h2>
      <div className="border rounded-lg p-4 h-72 overflow-y-auto space-y-3">
        {messages.length === 0 && (
          <p className="text-gray-400 text-center">Ask Gemini anything...</p>
        )}
        {messages.map((m) => (
          <div
            key={m.id}
            className={`p-2 rounded-lg ${
              m.role === "user"
                ? "bg-blue-100 text-right ml-8"
                : "bg-gray-100 mr-8"
            }`}
          >
            <p className="text-sm whitespace-pre-wrap">
              {m.parts
                .filter((p) => p.type === "text")
                .map((p) => p.text)
                .join("")}
            </p>
          </div>
        ))}
        {status === "submitted" && (
          <div className="bg-gray-100 mr-8 p-2 rounded-lg">
            <p className="text-sm text-gray-400">Thinking...</p>
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (input.trim()) {
            sendMessage({ text: input });
            setInput("");
          }
        }}
        className="flex gap-2"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
          className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}
