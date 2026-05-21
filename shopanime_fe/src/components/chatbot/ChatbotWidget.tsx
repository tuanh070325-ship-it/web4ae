import { FormEvent, KeyboardEvent, useMemo, useRef, useState } from "react";
import { Bot, Headphones, MessageCircle, Minus, Send, X } from "lucide-react";
import { apiPost } from "../../lib/api";
import type { ApiResponse } from "../../lib/types";
import { useAuth } from "../auth/AuthProvider";

const CHATBOT_SESSION_KEY = "akibacore.chatbotSessionId";

interface ChatMessage {
  id: string;
  role: "assistant" | "user";
  content: string;
}

interface ChatbotReply {
  reply: string;
  suggestions: string[];
  handoff: boolean;
}

function createMessageId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getChatbotSessionId() {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existingSessionId = localStorage.getItem(CHATBOT_SESSION_KEY);
  if (existingSessionId) {
    return existingSessionId;
  }

  const sessionId = createMessageId();
  localStorage.setItem(CHATBOT_SESSION_KEY, sessionId);
  return sessionId;
}

export function ChatbotWidget() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Xin chao, minh la AkibaCore AI Support. Minh co the ho tro ve san pham, don hang, gio hang va uu dai.",
    },
  ]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useMemo(() => getChatbotSessionId(), []);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const showPanel = () => {
    setOpen(true);
    setMinimized(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || sending) return;

    setInput("");
    setError(null);
    setSuggestions([]);
    setSending(true);
    setMessages((current) => [
      ...current,
      { id: createMessageId(), role: "user", content: trimmedMessage },
    ]);

    try {
      const response = await apiPost<ApiResponse<ChatbotReply>>("/chatbot/message", {
        message: trimmedMessage,
        sessionId,
        pageUrl: `${window.location.pathname}${window.location.search}`,
        user: user
          ? {
              id: user.id,
              username: user.username,
              email: user.email,
            }
          : undefined,
      });

      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: response.data.reply,
        },
      ]);
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Chatbot is temporarily unavailable");
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: "assistant",
          content: "Xin loi, AkibaCore AI Support hien chua phan hoi duoc. Ban vui long thu lai sau it phut.",
        },
      ]);
    } finally {
      setSending(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendMessage(input);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open && (
        <section
          className={`mb-4 w-[calc(100vw-2rem)] max-w-[390px] overflow-hidden rounded-lg border border-[#2e333d] bg-[#111216] text-white shadow-[0_24px_80px_rgba(0,0,0,0.52)] transition-all sm:w-[390px] ${
            minimized ? "h-[72px]" : "h-[min(620px,calc(100vh-8rem))]"
          }`}
          aria-label="AkibaCore AI customer support chat"
        >
          <div className="flex h-[72px] items-center justify-between border-b border-[#2e333d] bg-[#171a20] px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#e63946] text-white shadow-[0_0_24px_rgba(230,57,70,0.42)]">
                <Bot className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black uppercase tracking-wide text-white">AkibaCore AI Support</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Customer care assistant
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMinimized((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded border border-[#2e333d] text-zinc-300 transition-colors hover:border-[#e63946] hover:text-white"
                aria-label={minimized ? "Open chat panel" : "Minimize chat panel"}
              >
                <Minus className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded border border-[#2e333d] text-zinc-300 transition-colors hover:border-[#e63946] hover:text-white"
                aria-label="Close chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {!minimized && (
            <div className="flex h-[calc(100%-72px)] flex-col">
              <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[82%] rounded-lg px-3.5 py-2.5 text-sm leading-6 ${
                        message.role === "user"
                          ? "bg-[#e63946] text-white"
                          : "border border-[#2e333d] bg-[#1a1b22] text-zinc-100"
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-lg border border-[#2e333d] bg-[#1a1b22] px-3.5 py-2.5 text-sm text-zinc-300">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#e63946]" />
                      AI Support is typing...
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#2e333d] bg-[#15171d] p-4">
                {suggestions.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        onClick={() => void sendMessage(suggestion)}
                        className="rounded-full border border-[#2e333d] bg-[#111216] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#e63946] hover:text-white"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}

                {error && <div className="mb-3 text-xs font-semibold text-[#ff8aa0]">{error}</div>}

                <form onSubmit={submitMessage} className="flex items-end gap-2">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={handleInputKeyDown}
                    rows={1}
                    maxLength={2000}
                    placeholder="Nhap cau hoi cua ban..."
                    className="max-h-24 min-h-11 flex-1 resize-none rounded border border-[#2e333d] bg-[#0f1115] px-3 py-2.5 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-[#e63946]"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded bg-[#e63946] text-white transition-colors hover:bg-[#ff4d5a] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
                    aria-label="Send chat message"
                  >
                    <Send className="h-4 w-4" />
                  </button>
                </form>
              </div>
            </div>
          )}
        </section>
      )}

      {!open && (
        <button
          type="button"
          onClick={showPanel}
          className="group flex h-16 w-16 items-center justify-center rounded-full border border-[#2e333d] bg-[#111216] text-white shadow-[0_16px_50px_rgba(0,0,0,0.45),0_0_0_4px_rgba(230,57,70,0.12)] transition-all hover:-translate-y-1 hover:border-[#e63946]"
          aria-label="Open AkibaCore AI support chat"
        >
          <span className="absolute -left-36 hidden rounded bg-[#111216] px-3 py-2 text-xs font-black uppercase tracking-wide text-white shadow-xl ring-1 ring-[#2e333d] transition-colors group-hover:ring-[#e63946] sm:block">
            AI Support
          </span>
          <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-400 ring-4 ring-[#111216]">
            <Headphones className="h-3 w-3 text-[#111216]" />
          </span>
          <MessageCircle className="h-7 w-7 text-[#e63946]" />
        </button>
      )}
    </div>
  );
}
