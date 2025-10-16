"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type ChatRole = "user" | "assistant" | "system";

type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  status?: "pending" | "error";
};

const createMessage = (role: ChatRole, content: string): ChatMessage => ({
  id: crypto.randomUUID(),
  role,
  content,
});

const initialMessages: ChatMessage[] = [
  createMessage(
    "assistant",
    "Hi there! I’m Agentic Chat, your AI assistant. Ask me anything or describe what you need and I’ll help."
  ),
];

export default function Home() {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const updateAssistantMessage = useCallback(
    (updater: (message: ChatMessage) => ChatMessage) => {
      setMessages((prev) => {
        const copy = [...prev];
        for (let i = copy.length - 1; i >= 0; i -= 1) {
          if (copy[i].role === "assistant") {
            copy[i] = updater(copy[i]);
            break;
          }
        }
        return copy;
      });
    },
    []
  );

  const handleSubmit = useCallback(
    async (override?: string) => {
      const trimmed = (override ?? input).trim();
      if (!trimmed || isLoading) {
        return;
      }

      const userMessage = createMessage("user", trimmed);
      const pendingAssistant: ChatMessage = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "",
        status: "pending",
      };

      setMessages((prev) => [...prev, userMessage, pendingAssistant]);
      setInput("");
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: [
              ...messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
              })),
              { role: userMessage.role, content: userMessage.content },
            ],
          }),
        });

        if (!response.ok || !response.body) {
          throw new Error(
            `Request failed with status ${response.status}. Please try again.`
          );
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let accumulated = "";

        const readStream = async (): Promise<void> => {
          const { value, done } = await reader.read();
          if (done) {
            return;
          }

          accumulated += decoder.decode(value, { stream: true });
          updateAssistantMessage((message) => ({
            ...message,
            content: accumulated,
            status: "pending",
          }));
          await readStream();
        };

        await readStream();

        const finalOutput = (accumulated + decoder.decode()).trim();

        updateAssistantMessage((message) => ({
          ...message,
          content: finalOutput,
          status: undefined,
        }));
      } catch (err) {
        const description =
          err instanceof Error ? err.message : "Unexpected error occurred.";
        setError(description);
        updateAssistantMessage((message) => ({
          ...message,
          status: "error",
          content:
            message.content ||
            "I ran into a problem generating that response. Please try again.",
        }));
      } finally {
        setIsLoading(false);
      }
    },
    [input, isLoading, messages, updateAssistantMessage]
  );

  const handleReset = useCallback(() => {
    setMessages(initialMessages);
    setError(null);
    setInput("");
  }, []);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit]
  );

  return (
    <div className="flex min-h-screen flex-col bg-slate-950 text-slate-100">
      <header className="border-b border-white/10 bg-black/30 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
              Agentic Chat
            </p>
            <h1 className="text-xl font-semibold text-white">
              Chat with your AI assistant
            </h1>
          </div>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-white/50 hover:text-white"
          >
            New chat
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-4xl flex-col px-6 py-4">
          <div
            className="flex-1 space-y-6 overflow-y-auto rounded-2xl border border-white/5 bg-white/5 p-6 shadow-xl"
          >
            {messages.map((message) => (
              <article
                key={message.id}
                className={`flex items-start gap-3 ${
                  message.role === "user" ? "flex-row-reverse text-right" : ""
                }`}
              >
                <span
                  className={`mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-medium ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-emerald-500/20 text-emerald-200"
                  }`}
                >
                  {message.role === "user" ? "You" : "AI"}
                </span>
                <div
                  className={`max-w-full whitespace-pre-wrap rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                    message.role === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-slate-900/80 text-slate-100 ring-1 ring-white/5"
                  }`}
                >
                  {message.content || (
                    <span className="text-slate-400">
                      {message.status === "pending"
                        ? "Generating response..."
                        : ""}
                    </span>
                  )}
                  {message.status === "error" && (
                    <span className="mt-2 block text-xs text-rose-300/80">
                      Something went wrong. Please try again.
                    </span>
                  )}
                </div>
              </article>
            ))}
            <div ref={endRef} />
          </div>

          <div className="mt-6 space-y-3">
            {error && (
              <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs text-rose-200 shadow-sm">
                {error}
              </p>
            )}
            <form
              className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/60 p-4 shadow-2xl focus-within:border-white/40 focus-within:shadow-white/5"
              onSubmit={(event) => {
                event.preventDefault();
                void handleSubmit();
              }}
            >
              <textarea
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything…"
                rows={2}
                className="w-full resize-none bg-transparent text-sm text-white placeholder:text-slate-500 focus:outline-none"
                aria-label="Chat message"
              />
              <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                <span>Press Enter to send • Shift + Enter for new line</span>
                <div className="flex items-center gap-2">
                  {isLoading && (
                    <span className="flex items-center gap-2 text-emerald-300">
                      <span className="h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                      Thinking…
                    </span>
                  )}
                  <button
                    type="submit"
                    disabled={isLoading || !input.trim()}
                    className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 font-medium text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                      className="h-4 w-4"
                    >
                      <path d="M2.94 2.94a1.5 1.5 0 0 1 1.537-.371l12 4a1.5 1.5 0 0 1 0 2.862l-12 4A1.5 1.5 0 0 1 2 12.06V7.94a1.5 1.5 0 0 1 .94-1.371l7.38-2.953-7.38-2.953A1.5 1.5 0 0 1 2.94 2.94Z" />
                    </svg>
                    Send
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
