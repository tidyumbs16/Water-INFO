"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquareText,
  X,
  Minus,
  Maximize2,
  Send,
  Paperclip,
  Bot,
  User2,
} from "lucide-react";

interface ChatMessage {
  id: string;
  role: "user" | "bot" | "system";
  text: string;
  ts: number;
}
const fmt = (ts: number) => {
  const d = new Date(ts);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const ModernChatbot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, typing, isOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const portalTarget = useMemo(() => {
    if (typeof window === "undefined") return null;
    return document.body;
  }, []);

  const toggleOpen = () => {
    setIsOpen((v) => !v);
    setMinimized(false);

    // ✅ เพิ่มข้อความแนะนำอัตโนมัติ เมื่อเปิดครั้งแรก
    if (!isOpen && messages.length === 0) {
      const guideMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: `📘 วิธีใช้งาน Chatbot:
1) พิมพ์ชื่อ "ภูมิภาค" เช่น 'ภาคเหนือ'
2) เลือกจังหวัดที่อยู่ในภูมิภาคนั้น
3) เลือกเขตประปาที่ต้องการ
4) Bot จะแสดงข้อมูลค่าน้ำ (คุณภาพ, ปริมาณ, แรงดัน, ประสิทธิภาพ) ของวันปัจจุบัน
👉 คุณยังสามารถพิมพ์วันที่ เช่น 2025-09-01 เพื่อดูข้อมูลย้อนหลังได้`,
        ts: Date.now(),
      };
      setMessages([guideMsg]);
    }
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");

    try {
      setSending(true);
      setTyping(true);
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: String(data.response ?? "…"),
        ts: Date.now(),
      };
      setMessages((prev) => [...prev, botMsg]);
    } catch (e) {
      const sys: ChatMessage = {
        id: crypto.randomUUID(),
        role: "system",
        text: "⚠️ ไม่สามารถติดต่อเซิร์ฟเวอร์ได้ ลองใหม่อีกครั้ง",
        ts: Date.now(),
      };
      setMessages((p) => [...p, sys]);
    } finally {
      setSending(false);
      setTyping(false);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const CollapsedBar = (
    <motion.div
      key="collapsed"
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 12, scale: 0.98 }}
      transition={{ duration: 0.18 }}
      className="mt-3 w-[20rem] sm:w-[22rem] overflow-hidden rounded-xl border border-zinc-200/60 bg-white/90 shadow-xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/80"
      role="button"
      aria-label="Expand chat"
      onClick={() => setMinimized(false)}
    >
      <div className="flex items-center justify-between px-4 py-2">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-blue-600 text-white">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Bot Daily</div>
            <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Click to expand</div>
          </div>
        </div>
        <button
          className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none dark:hover:bg-zinc-800"
          aria-label="Expand"
          onClick={(e) => {
            e.stopPropagation();
            setMinimized(false);
          }}
        >
          <Maximize2 className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );

  const ExpandedWindow = (
    <motion.div
      key="expanded"
      id="modern-chat-window"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="mt-3 w-[28rem] sm:w-[34rem] h-[80vh] max-h-[85vh] overflow-hidden rounded-2xl border border-zinc-200/60 bg-white/80 shadow-2xl backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-900/80"
      role="dialog"
      aria-label="Bot Daily"
    >
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200/60 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Bot Daily</div>
              <div className="text-[11px] text-zinc-500 dark:text-zinc-400">Online · beta</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setMinimized(true)}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none dark:hover:bg-zinc-800"
              aria-label="Minimize"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 focus:outline-none dark:hover:bg-zinc-800"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div
          ref={chatBodyRef}
          className="flex-1 overflow-y-auto px-3 py-3"
          style={{ scrollBehavior: "smooth", overscrollBehavior: "contain" }}
        >
          {messages.length === 0 && (
            <div className="flex items-center justify-center py-10 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Ask me anything about water quality and metrics.
            </div>
          )}

          <div className="space-y-2">
            {messages.map((m) => (
              <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                {m.role !== "user" && (
                  <div className="mr-2 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-600/90 text-white shadow-md">
                    {m.role === "bot" ? <Bot className="h-4 w-4" /> : <span className="text-[10px]">i</span>}
                  </div>
                )}
                <div
                  className={
                    m.role === "user"
                      ? "max-w-[75%] rounded-2xl rounded-br-sm bg-gradient-to-br from-blue-600 to-indigo-600 px-3 py-2 text-sm text-white shadow-md"
                      : m.role === "bot"
                      ? "max-w-[75%] rounded-2xl rounded-bl-sm bg-white/90 px-3 py-2 text-sm text-zinc-900 shadow-md ring-1 ring-zinc-200/60 dark:bg-zinc-800/90 dark:text-zinc-100 dark:ring-zinc-700/60"
                      : "max-w-[75%] rounded-md bg-amber-50 px-2 py-1 text-xs text-amber-700 ring-1 ring-amber-200"
                  }
                >
                  <div className="whitespace-pre-wrap leading-relaxed">{m.text}</div>
                  <div
                    className={`mt-1 text-[10px] ${
                      m.role === "user" ? "text-white/70" : "text-zinc-500 dark:text-zinc-400"
                    }`}
                  >
                    {fmt(m.ts)}
                  </div>
                </div>
                {m.role === "user" && (
                  <div className="ml-2 flex h-8 w-8 flex-none items-center justify-center rounded-full bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-100">
                    <User2 className="h-4 w-4" />
                  </div>
                )}
              </div>
            ))}

            {typing && (
              <div className="flex items-center gap-2 pl-2 pt-1 text-zinc-500">
                <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:-0.2s]" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400" />
                <div className="h-2 w-2 animate-bounce rounded-full bg-zinc-400 [animation-delay:0.2s]" />
              </div>
            )}
          </div>
        </div>

        {/* Footer / Input */}
        <div className="border-t border-zinc-200/60 bg-white/70 px-3 py-3 pb-[calc(env(safe-area-inset-bottom)+0.5rem)] backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/70">
          <div className="flex items-end gap-2">
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg text-zinc-500 hover:bg-zinc-100 focus:outline-none dark:hover:bg-zinc-800"
              aria-label="Attach"
              title="Attach"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder="Type a message… (Enter to send, Shift+Enter for new line)"
              className="min-h-[40px] max-h-36 flex-1 resize-none rounded-xl border border-zinc-200/60 bg-white/80 px-3 py-2 text-sm text-zinc-900 shadow-inner outline-none placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-100"
            />

            <button
              onClick={sendMessage}
              disabled={sending || !input.trim()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-600 px-3 text-sm font-semibold text-white shadow-md transition-[filter,transform] hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60 focus:outline-none focus:ring-4 focus:ring-indigo-300"
            >
              <Send className="h-4 w-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  const ChatWindow = (
    <div className="fixed bottom-5 right-5 z-[9999]">
      <motion.button
        onClick={toggleOpen}
        whileTap={{ scale: 0.97 }}
        className="group relative flex items-center gap-2 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 px-4 py-3 text-white shadow-lg shadow-indigo-600/20 backdrop-blur-md focus:outline-none focus:ring-4 focus:ring-indigo-300"
        aria-expanded={isOpen}
        aria-controls="modern-chat-window"
      >
        <span className="absolute -top-1 -right-1 inline-flex h-3 w-3 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
          <span className="relative inline-flex h-3 w-3 rounded-full bg-emerald-500" />
        </span>
        <MessageSquareText className="h-5 w-5" />
        <span className="hidden sm:block text-sm font-semibold">Chat with Bot</span>
      </motion.button>

      <AnimatePresence initial={false}>
        {isOpen && <>{minimized ? CollapsedBar : ExpandedWindow}</>}
      </AnimatePresence>
    </div>
  );

  if (!mounted) return null;
  return createPortal(ChatWindow, document.body);
};

export default ModernChatbot;
