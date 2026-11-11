"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  HelpCircle,
  MessageCircle,
  Minus,
  Sparkles,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { EASE_OUT } from "./motion";

type ChatMessage = { role: "user" | "assistant"; content: string };
type View = "home" | "chat" | "faq";

const WELCOME: ChatMessage = {
  role: "assistant",
  content:
    "Hi there 👋 I'm Aurora, Loopcart's AI. Ask me anything about recovering abandoned carts, predicting shopper behavior, or reaching customers across every channel.",
};

const SUGGESTIONS = [
  "How does cart recovery work?",
  "Which channels does Loopcart cover?",
  "Is there a free plan?",
];

const FALLBACK =
  "Sorry — I couldn't reach the server just now. Please try again in a moment.";

const FAQ: { q: string; a: string }[] = [
  {
    q: "How does cart recovery work?",
    a: "Loopcart detects when a shopper abandons a browse, a cart, or a checkout flow, then follows up automatically across your channels until they come back — no manual workflows required.",
  },
  {
    q: "Which channels does Loopcart cover?",
    a: "Email, SMS, push notifications, WhatsApp, and AI voice calls — all managed from one place, with every channel aware of what the others already said.",
  },
  {
    q: "What is Aurora?",
    a: "Aurora is Loopcart's Large Event Model. It reads live shopping behavior to predict things like exit intent and the next likely action, so your marketing reacts before a shopper is gone.",
  },
  {
    q: "Does Loopcart integrate with my store?",
    a: "Yes — Loopcart connects to Shopify instantly and syncs with popular CRM tools to turn your existing data into revenue.",
  },
  {
    q: "Is there a free plan?",
    a: "You can start free — no credit card required. Request a demo if you'd like a guided tour first.",
  },
];

export function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [view, setView] = useState<View>("home");
  const [faqOpen, setFaqOpen] = useState<number | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    const t = setTimeout(() => setTeaser(true), 1800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (view !== "chat") return;
    const el = scrollRef.current;
    if (el) {
      el.scrollTo({ top: el.scrollHeight, behavior: reduce ? "auto" : "smooth" });
    }
  }, [messages, pending, view, reduce]);

  const send = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || pending) return;

      const next: ChatMessage[] = [
        ...messages,
        { role: "user", content: trimmed },
      ];
      setMessages(next);
      setInput("");
      setPending(true);

      try {
        // Skip the local welcome message — the server only needs the history.
        const history = next.slice(1);
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history }),
        });
        const data = (await res.json()) as { reply?: string };
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data?.reply?.trim() || FALLBACK },
        ]);
      } catch {
        setMessages((prev) => [...prev, { role: "assistant", content: FALLBACK }]);
      } finally {
        setPending(false);
      }
    },
    [messages, pending],
  );

  const viewMotion = {
    initial: { opacity: 0, x: reduce ? 0 : 28 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: reduce ? 0 : -28 },
    transition: { duration: 0.22, ease: EASE_OUT },
  };

  return (
    <>
      {/* Eye-catcher card — greeting bubble above the launcher */}
      <AnimatePresence>
        {teaser && !open && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="hidden md:block fixed bottom-[5.75rem] right-4 z-[70] w-[248px] rounded-2xl bg-white p-4 shadow-[0_12px_40px_rgba(0,0,0,0.45)] sm:right-6"
          >
            <button
              type="button"
              onClick={() => setTeaser(false)}
              aria-label="Dismiss greeting"
              className="absolute right-2 top-2 rounded-full p-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
            >
              <X className="h-3.5 w-3.5" aria-hidden />
            </button>
            <p className="pr-4 text-sm leading-snug text-neutral-900">
              Hi there 👋 Have a question about Loopcart? Ask away — we reply
              instantly.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating launcher */}
      <motion.button
        type="button"
        onClick={() => {
          setOpen((v) => !v);
          setTeaser(false);
        }}
        whileTap={{ scale: 0.9 }}
        aria-label={open ? "Minimize chat" : "Chat with us"}
        aria-expanded={open}
        className="hidden md:flex fixed bottom-5 right-5 z-[70] h-14 w-14 items-center justify-center rounded-full bg-lime text-neutral-900 shadow-[0_10px_36px_rgba(215,247,91,0.35)] transition-[transform,box-shadow] hover:scale-105 sm:bottom-6 sm:right-6"
      >
        <AnimatePresence mode="wait" initial={false}>
          {open ? (
            <motion.span
              key="minimize"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <Minus className="h-6 w-6" aria-hidden />
            </motion.span>
          ) : (
            <motion.span
              key="open"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle className="h-6 w-6" aria-hidden />
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Chat panel with internal routes: home → chat / faq */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Loopcart chat"
            initial={{
              opacity: 0,
              y: reduce ? 0 : 24,
              scale: reduce ? 1 : 0.92,
            }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{
              opacity: 0,
              y: reduce ? 0 : 16,
              scale: reduce ? 1 : 0.95,
            }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            className="hidden md:flex fixed bottom-[5.5rem] right-4 z-[70] h-[min(600px,calc(100dvh-7rem))] w-[min(400px,calc(100vw-2rem))] origin-bottom-right flex-col overflow-hidden rounded-2xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.55)] sm:right-6"
          >
            {/* Header — back arrow on inner routes, avatar on home */}
            <div className="flex items-center gap-3 bg-lime px-4 py-3 text-neutral-900">
              {view === "home" ? (
                <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0c0f07] text-lime">
                  <Sparkles className="h-5 w-5" aria-hidden />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-lime bg-emerald-500" />
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setView("home")}
                  aria-label="Back to menu"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-neutral-900/80 transition-colors hover:bg-neutral-900/10 hover:text-neutral-900"
                >
                  <ArrowLeft className="h-5 w-5" aria-hidden />
                </button>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold leading-tight">
                  {view === "chat" ? "Aurora" : "Loopcart Team"}
                </p>
                <p className="truncate text-xs text-neutral-800/80">
                  {view === "chat"
                    ? "AI assistant · online"
                    : view === "faq"
                      ? "Quick answers"
                      : "Aurora · AI assistant · online"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Minimize chat"
                className="rounded-full p-1.5 text-neutral-900/70 transition-colors hover:bg-neutral-900/10 hover:text-neutral-900"
              >
                <Minus className="h-4 w-4" aria-hidden />
              </button>
            </div>

            {/* Internal routes with slide transitions */}
            <AnimatePresence mode="wait" initial={false}>
              {view === "home" && (
                <motion.div
                  key="home"
                  {...viewMotion}
                  className="flex flex-1 flex-col gap-3 overflow-y-auto bg-white px-4 py-5 text-neutral-900"
                >
                  <div className="rounded-2xl bg-neutral-100 p-4">
                    <p className="text-sm leading-relaxed">
                      Hi there 👋 How can we help you today?
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("chat")}
                    className="group flex items-center gap-3 rounded-2xl border border-neutral-200 p-4 text-left transition-colors hover:border-neutral-900"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-neutral-900">
                      <MessageCircle className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        Start a conversation
                      </span>
                      <span className="block text-xs text-neutral-500">
                        Chat with Aurora, our AI
                      </span>
                    </span>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-neutral-400 transition-colors group-hover:text-neutral-900" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setView("faq")}
                    className="group flex items-center gap-3 rounded-2xl border border-neutral-200 p-4 text-left transition-colors hover:border-neutral-900"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-neutral-900 text-lime">
                      <HelpCircle className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold">
                        Browse quick answers
                      </span>
                      <span className="block text-xs text-neutral-500">
                        Common questions about Loopcart
                      </span>
                    </span>
                    <ArrowLeft className="h-4 w-4 rotate-180 text-neutral-400 transition-colors group-hover:text-neutral-900" aria-hidden />
                  </button>
                </motion.div>
              )}

              {view === "faq" && (
                <motion.div
                  key="faq"
                  {...viewMotion}
                  className="flex flex-1 flex-col overflow-y-auto bg-white px-4 py-4 text-neutral-900"
                >
                  <div className="space-y-2">
                    {FAQ.map((item, i) => (
                      <div
                        key={item.q}
                        className="overflow-hidden rounded-2xl border border-neutral-200"
                      >
                        <button
                          type="button"
                          onClick={() => setFaqOpen(faqOpen === i ? null : i)}
                          aria-expanded={faqOpen === i}
                          className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-neutral-50"
                        >
                          {item.q}
                          <ChevronDown
                            className={`h-4 w-4 shrink-0 transition-transform ${faqOpen === i ? "rotate-180" : ""}`}
                            aria-hidden
                          />
                        </button>
                        <AnimatePresence initial={false}>
                          {faqOpen === i && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: EASE_OUT }}
                              className="overflow-hidden"
                            >
                              <p className="px-4 pb-3.5 text-sm leading-relaxed text-neutral-600">
                                {item.a}
                              </p>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => setView("chat")}
                    className="mt-4 w-full rounded-full bg-lime py-2.5 text-sm font-semibold text-neutral-900 transition-opacity hover:opacity-85"
                  >
                    Still stuck? Ask Aurora
                  </button>
                </motion.div>
              )}

              {view === "chat" && (
                <motion.div
                  key="chat"
                  {...viewMotion}
                  className="flex min-h-0 flex-1 flex-col"
                >
                  {/* Messages */}
                  <div
                    ref={scrollRef}
                    aria-live="polite"
                    className="flex-1 space-y-3 overflow-y-auto bg-white px-4 py-4 text-neutral-900"
                  >
                    {messages.map((m, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: reduce ? 0 : 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, ease: EASE_OUT }}
                        className={
                          m.role === "user" ? "flex justify-end" : "flex justify-start"
                        }
                      >
                        <p
                          className={
                            m.role === "user"
                              ? "max-w-[85%] rounded-2xl rounded-br-md bg-lime px-3.5 py-2.5 text-sm leading-relaxed text-neutral-900"
                              : "max-w-[85%] rounded-2xl rounded-bl-md bg-neutral-100 px-3.5 py-2.5 text-sm leading-relaxed text-neutral-900"
                          }
                        >
                          {m.content}
                        </p>
                      </motion.div>
                    ))}
                    {pending && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex justify-start"
                      >
                        <div
                          className="flex items-center gap-1.5 rounded-2xl rounded-bl-md bg-neutral-100 px-4 py-3"
                          aria-label="Aurora is typing"
                        >
                          {[0, 1, 2].map((d) => (
                            <motion.span
                              key={d}
                              className="h-1.5 w-1.5 rounded-full bg-neutral-400"
                              animate={{ y: [0, -4, 0], opacity: [0.4, 1, 0.4] }}
                              transition={{
                                duration: 0.9,
                                repeat: Infinity,
                                delay: d * 0.15,
                                ease: "easeInOut",
                              }}
                            />
                          ))}
                        </div>
                      </motion.div>
                    )}

                    {/* Quick replies */}
                    {messages.length === 1 && !pending && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {SUGGESTIONS.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => void send(s)}
                            className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-700 transition-colors hover:border-neutral-900 hover:text-neutral-900"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Composer */}
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void send(input);
                    }}
                    className="flex items-center gap-2 border-t border-neutral-200 bg-white p-3"
                  >
                    <input
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Enter your message"
                      aria-label="Message"
                      autoComplete="off"
                      className="h-11 min-w-0 flex-1 rounded-full border border-neutral-200 bg-white px-4 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-900"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim() || pending}
                      aria-label="Send message"
                      className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-neutral-900 transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowUp className="h-4 w-4" aria-hidden />
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Branding footer */}
            <p className="border-t border-neutral-100 bg-white py-2 text-center text-[10px] text-neutral-400">
              Powered by Loopcart AI
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
