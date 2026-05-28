import type { FormEvent, KeyboardEvent } from 'react';
import { useMemo, useRef, useState } from 'react';
import { ConciergeBell, Headphones, MessageCircle, Minus, Send, ShieldCheck, X } from 'lucide-react';
import { apiPost } from '../../lib/api';
import type { ApiResponse } from '../../lib/types';
import supportAvatar from '../../../img/coding.png';
import { useAuth } from '../auth/AuthProvider';

const CHATBOT_SESSION_KEY = 'akibacore.chatbotSessionId';

const starterQuestions = [
  'Which manga are on sale?',
  'Where can I track my order?',
  'Recommend best-selling action manga',
  'What are the free shipping terms?',
];

interface ChatMessage {
  id: string;
  role: 'assistant' | 'user';
  content: string;
}

interface ChatbotReply {
  reply: string;
  suggestions: string[];
  handoff: boolean;
}

function createMessageId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function getChatbotSessionId() {
  if (typeof window === 'undefined') {
    return 'server-session';
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
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sessionId = useMemo(() => getChatbotSessionId(), []);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const hasUserMessage = messages.some((message) => message.role === 'user');

  const showPanel = () => {
    setOpen(true);
    setMinimized(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
  };

  const sendMessage = async (messageText: string) => {
    const trimmedMessage = messageText.trim();
    if (!trimmedMessage || sending) {return;}

    setInput('');
    setError(null);
    setSuggestions([]);
    setSending(true);
    setMessages((current) => [
      ...current,
      { id: createMessageId(), role: 'user', content: trimmedMessage },
    ]);

    try {
      const response = await apiPost<ApiResponse<ChatbotReply>>('/chatbot/message', {
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
          role: 'assistant',
          content: response.data.reply,
        },
      ]);
      setSuggestions(response.data.suggestions || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chatbot is temporarily unavailable');
      setMessages((current) => [
        ...current,
        {
          id: createMessageId(),
          role: 'assistant',
          content: 'Xin loi, AkibaCore AI Support hien chua phan hoi duoc. Ban vui long thu lai sau it phut.',
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
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void sendMessage(input);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-[70] sm:bottom-6 sm:right-6">
      {open && (
        <section
          className={`mb-4 w-[calc(100vw-2rem)] max-w-[420px] overflow-hidden rounded-2xl border border-[#2e333d] bg-[#101217] text-white shadow-[0_28px_90px_rgba(0,0,0,0.58)] transition-all sm:w-[420px] ${
            minimized ? 'h-[76px]' : 'h-[min(660px,calc(100vh-8rem))]'
          }`}
          aria-label="AkibaCore AI customer support chat"
        >
          <div className="flex h-[76px] items-center justify-between border-b border-[#2e333d] bg-[#171a20] px-4">
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#22252d] shadow-[0_0_26px_rgba(230,57,70,0.34)]">
                <img src={supportAvatar.src} alt="AkibaCore support" className="h-full w-full object-cover" />
                <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-[#171a20] bg-emerald-400" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-black uppercase tracking-wide text-white">AkibaCore AI Support</div>
                <div className="mt-0.5 flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
                  Customer care desk
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMinimized((current) => !current)}
                className="flex h-9 w-9 items-center justify-center rounded border border-[#2e333d] text-zinc-300 transition-colors hover:border-[#e63946] hover:text-white"
                aria-label={minimized ? 'Open chat panel' : 'Minimize chat panel'}
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
            <div className="flex h-[calc(100%-76px)] flex-col bg-[radial-gradient(circle_at_50%_20%,rgba(230,57,70,0.12),transparent_32%),linear-gradient(180deg,#101217_0%,#111216_55%,#151119_100%)]">
              <div className="flex-1 space-y-4 overflow-y-auto px-4 py-5">
                {!hasUserMessage && (
                  <div className="flex min-h-[330px] flex-col justify-center">
                    <div className="mx-auto max-w-[310px] text-center">
                      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#22252d] shadow-[0_12px_30px_rgba(0,0,0,0.28)]">
                        <img src={supportAvatar.src} alt="AkibaCore support" className="h-full w-full object-cover" />
                      </div>
                      <div className="text-lg font-black text-white">AkibaCore Support</div>
                      <p className="mt-1 text-xs font-semibold leading-5 text-zinc-500">Chon cau hoi nhanh hoac nhap noi dung ban can ho tro.</p>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <span className="mb-1 px-1 text-[10px] font-black uppercase tracking-wide text-zinc-500">
                      {message.role === 'user' ? 'Me' : 'Our AI'}
                    </span>
                    <div
                      className={`max-w-[84%] rounded-2xl px-4 py-3 text-sm font-semibold leading-6 shadow-[0_12px_28px_rgba(0,0,0,0.16)] ${
                        message.role === 'user'
                          ? 'rounded-br-md bg-[#e63946] text-white'
                          : 'rounded-bl-md border border-[#343d43] bg-white/[0.06] text-zinc-100 backdrop-blur'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                ))}

                {sending && (
                  <div className="flex justify-start">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-[#2e333d] bg-white/[0.06] px-3.5 py-2.5 text-sm text-zinc-300">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-[#e63946]" />
                      AI Support is typing...
                    </div>
                  </div>
                )}

                {!hasUserMessage && (
                  <div>
                    <div className="mb-2 text-[11px] font-black uppercase tracking-wide text-zinc-500">Suggestions on what to ask our AI</div>
                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                      {starterQuestions.map((question) => (
                        <button
                          type="button"
                          key={question}
                          onClick={() => void sendMessage(question)}
                          className="min-h-12 rounded-xl border border-[#343d43] bg-white/[0.08] px-3 py-2 text-left text-xs font-bold leading-4 text-zinc-200 transition-colors hover:border-[#e63946] hover:bg-[#e63946]/10 hover:text-white"
                        >
                          {question}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-[#2e333d] bg-[#15171d]/95 p-4 backdrop-blur">
                {suggestions.length > 0 && (
                  <div className="mb-3 flex flex-wrap gap-2">
                    {suggestions.map((suggestion) => (
                      <button
                        type="button"
                        key={suggestion}
                        onClick={() => void sendMessage(suggestion)}
                        className="rounded-full border border-[#343d43] bg-[#101217] px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-[#e63946] hover:bg-[#e63946]/10 hover:text-white"
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
                    placeholder="Ask me about products, orders, shipping..."
                    className="max-h-24 min-h-12 flex-1 resize-none rounded-xl border border-[#343d43] bg-[#0f1115] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-zinc-500 focus:border-[#e63946]"
                  />
                  <button
                    type="submit"
                    disabled={!input.trim() || sending}
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#e63946] text-white transition-colors hover:bg-[#ff4d5a] disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
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
          <ConciergeBell className="h-7 w-7 text-[#e63946] transition-opacity group-hover:opacity-0" />
          <MessageCircle className="absolute h-7 w-7 text-[#e63946] opacity-0 transition-opacity group-hover:opacity-100" />
        </button>
      )}
    </div>
  );
}
