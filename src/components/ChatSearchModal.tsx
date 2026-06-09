import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, MessageCircle, Search } from "lucide-react";
import { cn } from "../lib/utils";

interface ChatSession {
  id: string;
  title?: string;
  messages: any[];
  updatedAt: number;
}

interface ChatSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  chats: ChatSession[];
  currentChatId: string | null;
  onSelectChat: (id: string) => void;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

const HighlightMatch = React.memo(({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;
  const escaped = escapeRegex(query);
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <span key={i} className="text-blue-500 font-semibold bg-blue-50 px-0.5 rounded-sm">{part}</span>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
});

const ONE_DAY = 24 * 60 * 60 * 1000;

// Buttery smooth Apple-like spring for the modal
const MODAL_SPRING = { type: "spring" as const, damping: 24, stiffness: 280, mass: 0.6 };
// Bouncy, light spring for height expansion
const EXPAND_SPRING = { type: "spring" as const, damping: 20, stiffness: 230, mass: 0.7 };
const ITEM_SPRING = { type: "spring" as const, damping: 24, stiffness: 300, mass: 0.4 };

const listVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.02,
    },
  },
  exit: {
    transition: {
      staggerChildren: 0.01,
      staggerDirection: -1,
    },
  }
};

const rowVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.98 },
  show: { opacity: 1, y: 0, scale: 1, transition: ITEM_SPRING },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } }
};

const ChatRow = React.memo(function ChatRow({
  chat,
  query,
  currentChatId,
  onSelect,
}: {
  chat: ChatSession & { snippet: string | null };
  query: string;
  currentChatId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <motion.button
      layout="position"
      variants={rowVariants}
      onClick={() => onSelect(chat.id)}
      className={cn(
        "w-full flex items-center gap-4 px-4 py-3 rounded-xl text-left",
        "hover:bg-slate-100/80 active:bg-slate-200/60 focus-visible:bg-slate-100 focus-visible:outline-none",
        chat.id === currentChatId && "bg-slate-50"
      )}
    >
      <div className="flex items-center justify-center shrink-0 w-6 h-6">
        <MessageCircle className="w-5 h-5 text-slate-900 stroke-[1.5]" />
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <span
          className={cn(
            "text-[15px] truncate block leading-snug text-slate-900",
            chat.id === currentChatId && "font-medium"
          )}
        >
          {chat.title || "New Chat"}
        </span>
        {chat.snippet && query && (
          <span className="text-[13px] text-slate-500 truncate block mt-0.5">
            <HighlightMatch text={chat.snippet} query={query} />
          </span>
        )}
      </div>
    </motion.button>
  );
});

const GroupLabel = ({ title }: { title: string }) => (
  <motion.h3 
    variants={rowVariants}
    className="px-4 text-[13px] font-medium text-slate-400 mb-1 mt-4"
  >
    {title}
  </motion.h3>
);

export function ChatSearchModal({
  isOpen,
  onClose,
  chats,
  currentChatId,
  onSelectChat,
}: ChatSearchModalProps) {
  const [query, setQuery] = useState("");
  const [isListExpanded, setIsListExpanded] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      const t1 = setTimeout(() => inputRef.current?.focus(), 40);
      const t2 = setTimeout(() => setIsListExpanded(true), 150); // Fast delay to let modal settle before bouncy expand
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setQuery("");
      setIsListExpanded(false);
    }
  }, [isOpen]);

  const initiateClose = useCallback(() => {
    setIsListExpanded(false);
    setTimeout(() => onClose(), 120); // Let collapse start before closing modal
  }, [onClose]);

  const handleSelect = useCallback((id: string) => {
    setIsListExpanded(false);
    setTimeout(() => onSelectChat(id), 120);
  }, [onSelectChat]);

  const filteredChats = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return chats.map(c => ({ ...c, snippet: null as string | null }));
    return chats
      .map((chat) => {
        const title = chat.title || "New Chat";
        const titleMatch = title.toLowerCase().includes(q);
        const matchingMessage = chat.messages.find(
          (m) => m.content && m.content.toLowerCase().includes(q)
        );
        if (!titleMatch && !matchingMessage) return null;
        let snippet: string | null = null;
        if (matchingMessage && !titleMatch) {
          const content = matchingMessage.content;
          const index = content.toLowerCase().indexOf(q);
          const start = Math.max(0, index - 40);
          const end = Math.min(content.length, index + q.length + 40);
          snippet =
            (start > 0 ? "..." : "") +
            content.substring(start, end).replace(/\n/g, " ") +
            (end < content.length ? "..." : "");
        }
        return { ...chat, snippet };
      })
      .filter(Boolean) as (ChatSession & { snippet: string | null })[];
  }, [query, chats]);

  const dateGroups = useMemo(() => {
    if (query) return null;
    const now = Date.now();
    return {
      today: filteredChats.filter((c) => now - c.updatedAt < ONE_DAY),
      yesterday: filteredChats.filter(
        (c) => now - c.updatedAt >= ONE_DAY && now - c.updatedAt < 2 * ONE_DAY
      ),
      week: filteredChats.filter(
        (c) => now - c.updatedAt >= 2 * ONE_DAY && now - c.updatedAt < 7 * ONE_DAY
      ),
      older: filteredChats.filter((c) => now - c.updatedAt >= 7 * ONE_DAY),
    };
  }, [query, filteredChats]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[10vh] px-4">
          {/* Backdrop: solid color for massive performance gain */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="absolute inset-0 bg-slate-900/20"
            onClick={initiateClose}
          />

          {/* Modal panel: uses willChange and spring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -10 }}
            transition={{ ...MODAL_SPRING, opacity: { duration: 0.2 } }}
            style={{ willChange: "transform, opacity", transformOrigin: "top center" }}
            className="relative w-full max-w-[680px] bg-white rounded-[24px] shadow-[0_24px_64px_-16px_rgba(0,0,0,0.16),0_0_0_1px_rgba(0,0,0,0.06)] flex flex-col max-h-[80vh] overflow-hidden"
          >
            {/* Search bar */}
            <div className="flex items-center px-5 py-4 shrink-0 relative z-10 border-b border-slate-100/80">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search chats..."
                className="flex-1 bg-transparent border-none outline-none text-[16px] text-slate-800 placeholder:text-slate-400"
                onKeyDown={(e) => {
                  if (e.key === "Escape") initiateClose();
                }}
              />
              <button
                onClick={initiateClose}
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
              >
                <X className="w-5 h-5 stroke-[1.5]" />
              </button>
            </div>

            {/* Content Accordion (Optimized Bouncy Height) */}
            <AnimatePresence>
              {isListExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{
                    height: EXPAND_SPRING,
                    opacity: { duration: 0.2 },
                  }}
                  style={{ willChange: "height, opacity" }}
                  className="overflow-hidden"
                >
                  <div className="overflow-y-auto px-2 py-3 max-h-[calc(80vh-65px)]">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={query ? "search" : "browse"}
                        variants={listVariants}
                        initial="hidden"
                        animate="show"
                        exit="exit"
                        className="flex flex-col gap-0.5"
                      >
                        {!query ? (
                          <>
                            {dateGroups && (
                              <>
                                {dateGroups.today.length > 0 && (
                                  <>
                                    <GroupLabel title="Today" />
                                    {dateGroups.today.map(chat => (
                                      <ChatRow key={chat.id} chat={chat} query={query} currentChatId={currentChatId} onSelect={handleSelect} />
                                    ))}
                                  </>
                                )}
                                {dateGroups.yesterday.length > 0 && (
                                  <>
                                    <GroupLabel title="Yesterday" />
                                    {dateGroups.yesterday.map(chat => (
                                      <ChatRow key={chat.id} chat={chat} query={query} currentChatId={currentChatId} onSelect={handleSelect} />
                                    ))}
                                  </>
                                )}
                                {dateGroups.week.length > 0 && (
                                  <>
                                    <GroupLabel title="Previous 7 Days" />
                                    {dateGroups.week.map(chat => (
                                      <ChatRow key={chat.id} chat={chat} query={query} currentChatId={currentChatId} onSelect={handleSelect} />
                                    ))}
                                  </>
                                )}
                                {dateGroups.older.length > 0 && (
                                  <>
                                    <GroupLabel title="Older" />
                                    {dateGroups.older.map(chat => (
                                      <ChatRow key={chat.id} chat={chat} query={query} currentChatId={currentChatId} onSelect={handleSelect} />
                                    ))}
                                  </>
                                )}
                              </>
                            )}
                          </>
                        ) : (
                          <>
                            {filteredChats.length === 0 ? (
                              <motion.div
                                variants={rowVariants}
                                className="py-16 text-center flex flex-col items-center text-slate-400"
                              >
                                <Search className="w-10 h-10 mb-4 opacity-20 stroke-[1.5]" />
                                <p className="text-[15px] font-medium text-slate-500">No chats found for "{query}"</p>
                              </motion.div>
                            ) : (
                              filteredChats.map(chat => (
                                <ChatRow key={chat.id} chat={chat} query={query} currentChatId={currentChatId} onSelect={handleSelect} />
                              ))
                            )}
                          </>
                        )}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
