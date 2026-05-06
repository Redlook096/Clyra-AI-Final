/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, {
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useCallback,
    useState,
} from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import {
    AppWindow,
    ArrowUpIcon,
    Check,
    FileUp,
    Folder,
    MessageCircleDashed,
    MousePointer2,
    Paperclip,
    Pencil,
    Play,
    Search,
    Settings,
    SquarePen,
    Trash2,
    X,
    XIcon,
} from "lucide-react";
import { cn } from "./lib/utils";
import { SettingsModal } from "./components/SettingsModal";
import { ShiningText } from "./components/ShiningText";
import { BlurredStaggerStream } from "@/components/ui/blurred-stagger-text";
import { MarkdownMessageContent } from "./components/MarkdownMessageContent";
import { VibeAgentMessageBody } from "./components/vibe/VibeAgentMessageBody";
import { VibeLivePreviewPanel } from "./components/vibe/VibeLivePreviewPanel";
import { VIBE_CURSOR_AGENT_SYSTEM_PROMPT } from "./lib/vibeAgentConstants";
import { extractVibeFilesFromContent } from "./lib/parseVibeAgentContent";

let geminiSingleton: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
    const key = process.env.GEMINI_API_KEY;
    if (!key) return null;
    geminiSingleton ??= new GoogleGenAI({ apiKey: key });
    return geminiSingleton;
}

/** Standard chat: shimmer until the model emits answer text (`content`), then hide so stagger can print it. */
function ChatThinkingLabel({
    isThinking,
    isStreaming,
    content,
}: {
    isThinking: boolean;
    isStreaming: boolean;
    content: string;
}) {
    const visible = content.length === 0 && (isThinking || isStreaming);

    if (!visible) return null;

    return (
        <div className="flex items-center gap-1" aria-live="polite">
            <ShiningText text="Thinking" preset="thinkingChat" />
        </div>
    );
}

const AnimatedMessage = ({
    messageId,
    content,
    isThinking,
    isStreaming,
    fontSizeClass,
    markdownSupport,
    codeHighlighting = true,
    assistantKind = "chat",
    isLastAssistant,
    onVibePreviewReady,
}: {
    messageId?: string;
    content: string;
    isThinking?: boolean;
    isStreaming?: boolean;
    reasoningContent?: string;
    vibeUserPrompt?: string;
    fontSizeClass?: string;
    markdownSupport?: boolean;
    codeHighlighting?: boolean;
    assistantKind?: "chat" | "vibe";
    isLastAssistant?: boolean;
    onVibePreviewReady?: (messageId: string, filesByPath: Record<string, string>) => void;
}) => {
    const isVibe = assistantKind === "vibe";
    /** Vibe agent now drives its own thought UI from the model's <<<VIBE_THINKING>>> blocks. While we have no
     *  content yet, show the unified "Thinking" shimmer so the seam into the inline VibeThoughtPanel is clean. */
    const suppressVibeAnswerBody = isVibe && !!isThinking && content.length === 0;
    return (
        <div className={cn("pt-0.5 font-medium text-inherit w-full relative flex flex-col gap-2", fontSizeClass)}>
            <ChatThinkingLabel isThinking={!!isThinking} isStreaming={!!isStreaming} content={content} />
            {content.length > 0 && !suppressVibeAnswerBody ? (
                <div className={cn("markdown-body mt-1", isVibe && "markdown-body--vibe")} data-invert-ignore>
                    {isVibe ? (
                        <VibeAgentMessageBody
                            key={messageId ?? "vibe-body"}
                            messageId={messageId}
                            content={content}
                            isStreaming={!!isStreaming}
                            fontSizeClass={fontSizeClass}
                            isLastAssistant={!!isLastAssistant}
                            onVibePreviewReady={onVibePreviewReady}
                        />
                    ) : markdownSupport ? (
                        isStreaming ? (
                            <BlurredStaggerStream
                                text={content}
                                isStreaming
                                className={cn("text-inherit", fontSizeClass)}
                            />
                        ) : (
                            <MarkdownMessageContent
                                content={content}
                                codeHighlighting={!!codeHighlighting}
                                codePresentation="default"
                            />
                        )
                    ) : (
                        <BlurredStaggerStream
                            text={content}
                            isStreaming={!!isStreaming}
                            className={cn("text-inherit", fontSizeClass)}
                        />
                    )}
                </div>
            ) : null}
        </div>
    );
};

interface UseAutoResizeTextareaProps {
    minHeight: number;
    maxHeight?: number;
}

function useAutoResizeTextarea({
    minHeight,
    maxHeight,
}: UseAutoResizeTextareaProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const adjustHeight = useCallback(
        (reset?: boolean) => {
            const textarea = textareaRef.current;
            if (!textarea) return;

            if (reset) {
                textarea.style.height = `${minHeight}px`;
                return;
            }

            window.requestAnimationFrame(() => {
                textarea.style.height = `${minHeight}px`;
                const newHeight = Math.max(
                    minHeight,
                    Math.min(
                        textarea.scrollHeight,
                        maxHeight ?? Number.POSITIVE_INFINITY
                    )
                );
                textarea.style.height = `${newHeight}px`;
            });
        },
        [minHeight, maxHeight]
    );

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = `${minHeight}px`;
        }
    }, [minHeight]);

    useEffect(() => {
        const handleResize = () => adjustHeight();
        window.addEventListener("resize", handleResize);
        return () => window.removeEventListener("resize", handleResize);
    }, [adjustHeight]);

    return { textareaRef, adjustHeight };
}

interface CommandSuggestion {
    id: string;
    icon: (isActive: boolean) => React.ReactNode;
    label: string;
    description: string;
    prefix: string;
}

interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center", containerClassName)}>
        <textarea
          className={cn(
            "flex w-full bg-transparent px-4 py-3 text-base text-slate-800",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-slate-400 font-medium",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none focus:ring-0 focus-visible:ring-offset-0",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)
Textarea.displayName = "Textarea"

const HighlightText = ({ text, highlight }: { text: string; highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const lower = highlight.toLowerCase();
    const parts = text.split(new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
    return (
        <>
            {parts.map((part, i) =>
                part.toLowerCase() === lower ? (
                    <span key={i} className="text-blue-500 font-medium transition-colors duration-300 ease-out">
                        {part}
                    </span>
                ) : (
                    part
                )
            )}
        </>
    );
};

export const FullscreenContext = React.createContext({
    isFullscreen: false,
    setIsFullscreen: (v: boolean) => {}
});

export default function App() {
    interface Message {
        id: string;
        role: 'user' | 'assistant';
        content: string;
        reasoningContent?: string;
        isThinking?: boolean;
        isStreaming?: boolean;
        /** `vibe` keeps the expandable thought UI; normal chat uses the “Thinking:” line only. */
        assistantKind?: 'chat' | 'vibe';
        /** User prompt for this Vibe reply—drives the fixed Thought summary. */
        vibeUserPrompt?: string;
    }

    interface ChatSession {
        id: string;
        title: string;
        messages: Message[];
        updatedAt: number;
    }

    const [selectedCommand, setSelectedCommand] = useState<CommandSuggestion | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [chats, setChats] = useState<ChatSession[]>(() => {
        try {
            const saved = localStorage.getItem('vibe-coder-chats');
            if (saved) return JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load chats:', e);
        }
        return [];
    });
    
    useEffect(() => {
        try {
            localStorage.setItem('vibe-coder-chats', JSON.stringify(chats));
        } catch (e) {
            console.error('Failed to save chats:', e);
        }
    }, [chats]);

    const [currentChatId, setCurrentChatId] = useState<string | null>(null);
    const currentChatIdRef = useRef<string | null>(null);
    useEffect(() => {
        currentChatIdRef.current = currentChatId;
    }, [currentChatId]);
    const [searchQuery, setSearchQuery] = useState("");
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [isInputExpanded, setIsInputExpanded] = useState(false);
    const inputContainerRef = useRef<HTMLDivElement>(null);
    const { textareaRef, adjustHeight } = useAutoResizeTextarea({
        minHeight: 52,
        maxHeight: 200,
    });
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [isTemporaryChat, setIsTemporaryChat] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [theme, setTheme] = useState('Light');
    const [sendOnEnter, setSendOnEnter] = useState(true);
    const [fontSize, setFontSize] = useState('Medium');
    const [autoScroll, setAutoScroll] = useState(true);
    const [animationSpeed, setAnimationSpeed] = useState(1);
    const [codeHighlighting, setCodeHighlighting] = useState(true);
    const [markdownSupport, setMarkdownSupport] = useState(true);
    const [systemPrompt, setSystemPrompt] = useState("");
    const [temperature, setTemperature] = useState(0.7);
    const [userBubbleColor, setUserBubbleColor] = useState('#e2e8f0');
    const commandPaletteRef = useRef<HTMLDivElement>(null);
    const searchInputRef = useRef<HTMLInputElement>(null);
    /** When true, stream / layout growth will keep the chat column pinned to the bottom (normal chat behavior). */
    const chatNearBottomRef = useRef(true);

    useEffect(() => {
        setIsSearching(searchQuery.length > 0);
    }, [searchQuery]);

    const lastAssistantId = useMemo(() => {
        for (let i = messages.length - 1; i >= 0; i--) {
            if (messages[i]!.role === "assistant") return messages[i]!.id;
        }
        return null as string | null;
    }, [messages]);

    const [vibePreviewMessageId, setVibePreviewMessageId] = useState<string | null>(null);
    const [vibePreviewFiles, setVibePreviewFiles] = useState<Record<string, string> | null>(null);

    const handleVibePreviewReady = useCallback((messageId: string, files: Record<string, string>) => {
        if (Object.keys(files).length === 0) return;
        setVibePreviewMessageId(messageId);
        setVibePreviewFiles(files);
    }, []);

    /** Keeps Vibe streams writing into the correct chat in `chats` even when the user switches away. */
    const patchMessagesForChat = useCallback((chatId: string, update: (prev: Message[]) => Message[]) => {
        setChats((prevChats) => {
            const i = prevChats.findIndex((c) => c.id === chatId);
            if (i < 0) return prevChats;
            const nextMsgs = update(prevChats[i]!.messages);
            const next = [...prevChats];
            next[i] = { ...next[i]!, messages: nextMsgs, updatedAt: Date.now() };
            return next;
        });
        setMessages((prev) => (currentChatIdRef.current === chatId ? update(prev) : prev));
    }, []);

    const showVibeLivePreview =
        !!vibePreviewFiles &&
        vibePreviewMessageId != null &&
        vibePreviewMessageId === lastAssistantId &&
        messages.some(
            (m) =>
                m.id === lastAssistantId &&
                m.role === "assistant" &&
                !m.isStreaming,
        );

    useEffect(() => {
        if (!vibePreviewMessageId) return;
        if (!messages.some((m) => m.id === vibePreviewMessageId)) {
            setVibePreviewMessageId(null);
            setVibePreviewFiles(null);
        }
    }, [messages, vibePreviewMessageId]);

    const chatScrollSignature = useMemo(
        () =>
            messages
                .map((m) => `${m.id}:${m.content.length}:${m.isStreaming ? 1 : 0}:${m.isThinking ? 1 : 0}`)
                .join("|"),
        [messages],
    );

    useEffect(() => {
        const el = document.getElementById("chat-container");
        if (!el) return;
        const onScroll = () => {
            const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
            chatNearBottomRef.current = gap < 120;
        };
        el.addEventListener("scroll", onScroll, { passive: true });
        onScroll();
        return () => el.removeEventListener("scroll", onScroll);
    }, [messages.length]);

    useLayoutEffect(() => {
        if (!autoScroll) return;
        const el = document.getElementById("chat-container");
        if (!el || messages.length === 0) return;
        if (!chatNearBottomRef.current) return;
        el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }, [chatScrollSignature, autoScroll, messages.length, showVibeLivePreview]);

    useEffect(() => {
        if (toastMessage) {
            const t = setTimeout(() => setToastMessage(null), 1800);
            return () => clearTimeout(t);
        }
    }, [toastMessage]);

    useEffect(() => {
        const handleGlobalKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                setValue("/");
                setTimeout(() => {
                    textareaRef.current?.focus();
                }, 10);
            }
        };
        window.addEventListener('keydown', handleGlobalKeyDown);
        return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    }, []);

    const isExpanded =
        isInputExpanded ||
        value.trim().length > 0 ||
        attachments.length > 0 ||
        selectedCommand !== null ||
        messages.length > 0;

    useEffect(() => {
        if (messages.length === 0 || isTemporaryChat) return;
        
        setChats(prevChats => {
            const existingChatIndex = prevChats.findIndex(c => c.id === currentChatId);
            
            if (existingChatIndex >= 0) {
                const newChats = [...prevChats];
                newChats[existingChatIndex] = {
                    ...newChats[existingChatIndex],
                    messages,
                    updatedAt: Date.now()
                };
                return newChats.sort((a, b) => b.updatedAt - a.updatedAt);
            } else if (currentChatId) {
                const title = messages[0].content.slice(0, 30) + (messages[0].content.length > 30 ? "..." : "");
                const newChat = {
                    id: currentChatId,
                    title,
                    messages,
                    updatedAt: Date.now()
                };
                return [newChat, ...prevChats].sort((a, b) => b.updatedAt - a.updatedAt);
            }
            return prevChats;
        });
    }, [messages, currentChatId, isTemporaryChat]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                inputContainerRef.current && 
                !inputContainerRef.current.contains(event.target as Node) &&
                value.trim().length === 0 &&
                attachments.length === 0 &&
                !selectedCommand
            ) {
                setIsInputExpanded(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [value, attachments.length, selectedCommand]);

    const commandSuggestions: CommandSuggestion[] = [
        { 
            id: 'vibe',
            icon: (isActive) => (
                <div className="relative flex items-center justify-center w-[18px] text-slate-700">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
                        <path d="M8 7L13 12L8 17" />
                        <motion.path 
                            d="M15 17H20"
                            animate={isActive ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
                            transition={isActive ? { repeat: Infinity, duration: 1, times: [0, 0.49, 0.5, 1], ease: "linear" } : {}}
                        />
                    </svg>
                </div>
            ), 
            label: "Vibe Coder", 
            description: "Generate website and desktop apps", 
            prefix: "/vibe" 
        },
        { 
            id: 'clip',
            icon: (isActive) => (
                <div className="relative flex items-center justify-center w-full h-full text-slate-700">
                    <motion.div animate={isActive ? { scale: [1, 1.15, 1], rotate: [0, 5, 0] } : { scale: 1, rotate: 0 }} transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}>
                        <Play className="w-4 h-4" />
                    </motion.div>
                    {isActive && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0.5 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
                            className="absolute inset-0 border border-slate-700 rounded-md"
                        />
                    )}
                </div>
            ), 
            label: "AI Clip", 
            description: "Clip most viral moments with AI generated subtitles", 
            prefix: "/clip" 
        },
        { 
            id: 'browse',
            icon: (isActive) => (
                <div className="relative flex items-center justify-center w-full h-full text-slate-700">
                    <AppWindow className="w-4 h-4" />
                    <motion.div 
                        initial={{ x: 0, y: 0 }}
                        animate={isActive ? { 
                            x: [2, -2, 2], 
                            y: [2, -1, 2],
                            scale: [1, 0.8, 1] // click effect
                        } : { x: 0, y: 0, scale: 1 }}
                        transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                        className="absolute -bottom-1 -right-1"
                    >
                        <MousePointer2 className="w-3 h-3 text-slate-700 fill-slate-100" />
                    </motion.div>
                </div>
            ), 
            label: "Agentic Browser", 
            description: "Let the AI control your browser", 
            prefix: "/browse" 
        }
    ];

    const isCommandMode = value.startsWith('/') && !value.includes(' ');
    const commandQuery = isCommandMode ? value.substring(1).toLowerCase() : "";
    const memoizedChats = React.useMemo(() => chats, [chats]);
    const filteredChats = React.useMemo(() => {
        if (!searchQuery) return memoizedChats;
        return memoizedChats.filter(chat => 
            chat.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
            chat.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()))
        );
    }, [memoizedChats, searchQuery]);

    const filteredSuggestions = isCommandMode
        ? commandSuggestions.filter(cmd => cmd.label.toLowerCase().includes(commandQuery))
        : commandSuggestions;

    useEffect(() => {
        if (isCommandMode && filteredSuggestions.length > 0) {
            setShowCommandPalette(true);
            if (activeSuggestion >= filteredSuggestions.length || activeSuggestion === -1) {
                setActiveSuggestion(0);
            }
        } else {
            setShowCommandPalette(false);
            setActiveSuggestion(-1);
        }
    }, [isCommandMode, commandQuery, filteredSuggestions.length]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Node;
            const commandButton = document.querySelector('[data-command-button]');
            
            if (commandPaletteRef.current && 
                !commandPaletteRef.current.contains(target) && 
                !commandButton?.contains(target)) {
                setShowCommandPalette(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const handleResize = () => {
            // Assume base design was for a window around 1200x800, maybe standard laptop.
            const baseWidth = 1200;
            const baseHeight = 800;
            const screenW = window.screen.width;
            const screenH = window.screen.height;
            const innerW = window.innerWidth;
            const innerH = window.innerHeight;
            
            // Check if we are basically fullscreen (allowing for generic UI shells)
            if (innerW >= screenW - 40 && innerH >= screenH - 120) {
                // Determine scale while maintaining position ratios
                const scaleW = innerW / baseWidth;
                const scaleH = innerH / baseHeight;
                // Take the smaller scale to ensure it fits, but don't shrink below 1
                const newScale = Math.max(1, Math.min(scaleW, scaleH));
                document.documentElement.style.setProperty('--app-scale', newScale.toString());
            } else {
                document.documentElement.style.setProperty('--app-scale', '1');
            }
        };

        handleResize(); // trigger on mount
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (showCommandPalette && filteredSuggestions.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev < filteredSuggestions.length - 1 ? prev + 1 : 0
                );
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setActiveSuggestion(prev => 
                    prev > 0 ? prev - 1 : filteredSuggestions.length - 1
                );
            } else if (e.key === 'Tab' || e.key === 'Enter') {
                e.preventDefault();
                const targetIndex = activeSuggestion >= 0 ? activeSuggestion : 0;
                if (targetIndex >= 0 && targetIndex < filteredSuggestions.length) {
                    const selectedCmd = filteredSuggestions[targetIndex];
                    const originalIndex = commandSuggestions.findIndex(c => c.prefix === selectedCmd.prefix);
                    selectCommandSuggestion(originalIndex);
                }
            } else if (e.key === 'Escape') {
                e.preventDefault();
                setShowCommandPalette(false);
                setValue("");
                setSelectedCommand(null);
                setIsInputExpanded(false);
                adjustHeight();
                textareaRef.current?.blur();
            }
        } else if (e.key === "Enter" && !e.shiftKey) {
            if (sendOnEnter) {
                e.preventDefault();
                if (value.trim() || selectedCommand) {
                    handleSendMessage();
                }
            }
        } else if (e.key === "Enter" && e.shiftKey) {
            if (!sendOnEnter) {
                e.preventDefault();
                if (value.trim() || selectedCommand) {
                    handleSendMessage();
                }
            }
        } else if (e.key === "Escape") {
            if (value || selectedCommand) {
                e.preventDefault();
                setValue("");
                setSelectedCommand(null);
                setIsInputExpanded(false);
                adjustHeight();
            } else {
                textareaRef.current?.blur();
            }
        }
    };

    const simulateVibeCoder = async (aiMsgId: string, userPrompt: string, streamChatId: string) => {
        try {
            let full = "";
            const openAiMessages = [
                {
                    role: "user",
                    content: `User request — build a polished React 19 experience with Tailwind, lucide-react, and framer-motion where helpful.

Project context: Cursor/Codex-style in-browser agent. Your stream is rendered as a live timeline:
  - THINKING blocks render as an inline expandable "Thought" panel.
  - ANALYZE renders as a small "Analysing <path>" banner.
  - CODE renders as a typed mini code box, one block per file.
  - RUN renders as a single-row "Run Command <cmd>" card.
  - Short prose lines BETWEEN blocks render as small narration lines (kept short — one sentence each).
  - Once everything finishes, the UI auto-renders a "Build complete" summary listing each file you wrote and its top-level exports — so make sure exports are named and (ideally) preceded by a brief JSDoc.

You MUST follow the mandatory agent loop. Do NOT stop after the first thinking block.

Required rhythm — a "step" can contain MULTIPLE actions:
  1) Open <<<VIBE_THINKING>>> (Goal / Approach / Unknowns / Risk areas / Step plan) <<<END_VIBE_THINKING>>>.
  2) One short transition line (≤1 sentence), e.g. "Let me start with the types and the hook.".
  3) STEP actions — multiple files allowed in a single step:
       - Optional <<<VIBE_ANALYZE path="…">>><<<END_VIBE_ANALYZE>>>.
       - <<<VIBE_CODE file="…" added="N" removed="M">>>RAW source — no markdown fences, ever<<<END_VIBE_CODE>>>.
       - Optional one-line transition line.
       - Repeat the analyse + code pair for the next file in the SAME step (e.g. types → hook → component all in one step).
  4) <<<VIBE_THINKING>>> reflection — what the step shipped, what's next, any new risks <<<END_VIBE_THINKING>>>.
  5) Loop back to (2) → (3) → (4) until every file is delivered.
  6) Optional <<<VIBE_RUN>>> with a single \`$ command\` and Purpose line.
  7) Final <<<VIBE_THINKING>>> summarising the delivered build.

Hard rules:
  - NEVER use markdown triple-backtick fences. All code goes inside <<<VIBE_CODE>>> as raw source.
  - Prose OUTSIDE delimiters must be short (≤1 sentence). Long reasoning belongs inside THINKING.
  - In <<<VIBE_CODE>>>, \`added\` must equal the number of lines in that code block (split on newlines); \`removed\` = lines removed when editing.
  - SANDBOX: every \`file\` and \`path\` MUST start with \`vibe-project/\`. The host strips and rejects anything outside that namespace, so do NOT use absolute paths, \`..\`, or pretend to edit Clyra's own source. The preview is mounted automatically from the sandbox; do not ask the user to start another dev server.
  - Aim for at least 3 thinking blocks (open / mid-reflection(s) / final) and at least 1 code block.
  - Group tightly-related files into one step instead of reflecting between every file.
  - Each top-level export in your CODE blocks should have a one-line JSDoc above it for the build summary.

Request details: ${userPrompt}`,
                },
            ];

            // Use deepseek-chat (non-reasoning) for the structured agent stream so the model spends
            // its entire output budget on the delimited timeline (thinking + analyze + code + ...)
            // instead of burning tokens on internal reasoning that we discard anyway.
            await streamOpenAI(
                VIBE_CURSOR_AGENT_SYSTEM_PROMPT,
                openAiMessages,
                (chunkText, isReasoning) => {
                     if (isReasoning) {
                         return;
                     }
                     full += chunkText;
                     patchMessagesForChat(streamChatId, (prev) =>
                         prev.map((msg) =>
                             msg.id === aiMsgId
                                 ? {
                                       ...msg,
                                       content: full,
                                       isThinking: false,
                                   }
                                 : msg,
                         ),
                     );
                 },
                 0.6,
                 8000,
                 "deepseek-chat",
            );

            // Removed fetch

            patchMessagesForChat(streamChatId, (prev) =>
                prev.map((msg) =>
                    msg.id === aiMsgId
                        ? {
                              ...msg,
                              isThinking: false,
                              isStreaming: false,
                          }
                        : msg,
                ),
            );

            setTimeout(() => {
                const chatContainer = document.getElementById('chat-container');
                if (chatContainer && autoScroll) {
                    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
                }
            }, 300);

        } catch (error) {
            console.error('Vibe Coder error:', error);
            patchMessagesForChat(streamChatId, (prev) =>
                prev.map((msg) =>
                    msg.id === aiMsgId
                        ? {
                              ...msg,
                              isThinking: false,
                              isStreaming: false,
                              content: "Sorry, I encountered an error during Vibe Coding.",
                          }
                        : msg,
                ),
            );
        }
    };

    const handleAutoFix = useCallback((error: { message: string; stack?: string; label?: string }) => {
        if (!currentChatIdRef.current || !vibePreviewMessageId) return;
        
        const errorPrompt = `The live preview encountered a ${error.label || 'runtime'} error:
\`\`\`
${error.message}
${error.stack || ''}
\`\`\`
Please analyze the code you just wrote and fix this error.`;

        const userMsgId = Date.now().toString();
        const aiMsgId = (Date.now() + 1).toString();

        setMessages((prev) => [
            ...prev,
            { id: userMsgId, role: "user", content: "I'm seeing an error in the preview. Can you fix it?" },
            {
                id: aiMsgId,
                role: "assistant",
                content: "",
                isThinking: true,
                isStreaming: true,
                assistantKind: "vibe",
                vibeUserPrompt: "Fixing preview error...",
            },
        ]);

        simulateVibeCoder(aiMsgId, errorPrompt, currentChatIdRef.current);
    }, [vibePreviewMessageId, simulateVibeCoder]);

    const handleSendMessage = async () => {
        if (value.trim() || selectedCommand) {
            setVibePreviewMessageId(null);
            setVibePreviewFiles(null);
            const userCommandLabel = selectedCommand?.label;
            const userCommandId = selectedCommand?.id;
            const rawUserText = value.trim();
            const userText = rawUserText || (userCommandLabel ? `Execute ${userCommandLabel}` : "");
            setValue("");
            setSelectedCommand(null);
            adjustHeight(true);
            setRecentCommand(null);

            let chatId = currentChatId;
            const isFirstMessage = messages.length === 0 && !chatId;
            if (isFirstMessage) {
                chatId = Date.now().toString();
                setCurrentChatId(chatId);
            }

            const currentMessages = messages;
            const userMsgId = Date.now().toString();
            const aiMsgId = (Date.now() + 1).toString();

            const isVibeMode = userCommandId === "vibe";

            chatNearBottomRef.current = true;
            setMessages((prev) => [
                ...prev,
                { id: userMsgId, role: "user", content: userText },
                {
                    id: aiMsgId,
                    role: "assistant",
                    content: "",
                    isThinking: true,
                    isStreaming: true,
                    assistantKind: isVibeMode ? "vibe" : "chat",
                    ...(isVibeMode ? { vibeUserPrompt: userText } : {}),
                },
            ]);

            setTimeout(() => {
                const chatContainer = document.getElementById('chat-container');
                if (chatContainer && autoScroll) {
                    chatNearBottomRef.current = true;
                    chatContainer.scrollTo({
                        top: chatContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);

            try {
                if (isFirstMessage && !isTemporaryChat) {
                    const gemini = getGeminiClient();
                    if (gemini) {
                        gemini.models
                            .generateContent({
                                model: "gemini-3-flash-preview",
                                contents: `Generate a concise, up to 4 word title for a conversation that starts with the following prompt: "${userText}". Output only the title string without quotes.`,
                            })
                            .then((titleResponse) => {
                                const newTitle = titleResponse.text?.trim().replace(/^"|"$/g, "");
                                if (newTitle) {
                                    setChats((prev) => prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c)));
                                }
                            })
                            .catch(console.error);
                    }
                }

                if (isVibeMode && chatId) {
                    simulateVibeCoder(aiMsgId, userText, chatId);
                    return;
                }

                const contents = currentMessages.map(msg => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }]
                }));
                contents.push({ role: 'user', parts: [{ text: userText }] });

                try {
                    let accumulatedText = "";
                    let accumulatedReasoning = "";
                    const openAiMessages = contents.map(c => ({
                        role: c.role === 'model' ? 'assistant' : c.role,
                        content: c.parts[0].text
                    }));
                    
                    await streamOpenAI(
                        systemPrompt.trim() !== "" ? systemPrompt.trim() : "Your name is Clyra, an AI assistant. Give helpful and appropriately detailed responses.",
                        openAiMessages,
                        (chunkText, isReasoning) => {
                            if (isReasoning) {
                                accumulatedReasoning += chunkText;
                                setMessages(prev => prev.map(msg => 
                                    msg.id === aiMsgId
                                    ? { ...msg, reasoningContent: accumulatedReasoning } 
                                    : msg
                                ));
                            } else {
                                accumulatedText += chunkText;
                                setMessages(prev => prev.map(msg => 
                                    msg.id === aiMsgId
                                    ? { ...msg, content: accumulatedText, isThinking: false } 
                                    : msg
                                ));
                            }
                        },
                        temperature
                    );
                    
                    // End of streaming
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMsgId
                        ? { ...msg, isStreaming: false, isThinking: false } 
                        : msg
                    ));
                } catch (error) {
                    console.error("Standard chat stream error:", error);
                    setMessages(prev => prev.map(msg => 
                        msg.id === aiMsgId
                        ? { ...msg, content: "Sorry, I've hit a rate limit right now! Please try again in an hour or so. In the meantime, the UI works perfectly.", isThinking: false, isStreaming: false } 
                        : msg
                    ));
                }
            } catch (error) {
                console.error("AI Error:", error);
                setMessages(prev => prev.map(msg => 
                    msg.id === aiMsgId
                    ? { ...msg, content: "Sorry, I encountered an error while processing your request.", isThinking: false, isStreaming: false } 
                    : msg
                ));
            }
        }
    };

    const handleAttachFile = () => {
        const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
        setAttachments(prev => [...prev, mockFileName]);
    };

    const removeAttachment = (index: number) => {
        setAttachments(prev => prev.filter((_, i) => i !== index));
    };
    
    const selectCommandSuggestion = (index: number) => {
        const selectedCmd = commandSuggestions[index];
        setSelectedCommand(selectedCmd);
        setValue("");
        setShowCommandPalette(false);
        setTimeout(() => {
            if (textareaRef.current) {
                textareaRef.current.focus();
            }
        }, 50);
    };

    return (
        <FullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
        {theme === 'Dark' && (
            <style dangerouslySetInnerHTML={{__html: `
                html { filter: invert(1) hue-rotate(180deg); background: #fff; }
                img, video, iframe, [data-invert-ignore] { filter: invert(1) hue-rotate(-180deg); }
                html:not([data-invert-ignore]) pre, html:not([data-invert-ignore]) code { filter: invert(1) hue-rotate(-180deg); }
                [data-invert-ignore] pre, [data-invert-ignore] code { filter: none !important; }
                .border-slate-200\\/60 { border-color: rgba(226, 232, 240, 0.4); }
                body { background: #fff; }
                /* Make grey text more visible (white) in dark mode */
                .text-slate-400, .text-slate-500, .text-slate-600 { color: #000 !important; }
            `}} />
        )}
        <div className="h-dvh flex min-w-0 bg-white text-slate-900 font-sans selection:bg-slate-200 overflow-hidden scalable-container relative">
            <aside
                aria-hidden={!isSidebarOpen}
                {...(!isSidebarOpen ? ({ inert: true } as unknown as Record<string, unknown>) : {})}
                className={cn(
                    "relative z-[100] flex h-full shrink-0 flex-col overflow-hidden border-r bg-white transition-[width] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                    isSidebarOpen ? "border-slate-200/60" : "border-transparent pointer-events-none",
                )}
                style={{ width: isSidebarOpen ? 240 : 0, willChange: "width" }}
            >
                <div className="w-[240px] h-full flex flex-col shrink-0">
                            <div className="px-3 pb-2 pt-2 flex flex-col gap-1.5 shrink-0 border-b border-black/5">
                                    <div className="flex items-center justify-end h-9 -mt-0.5 -mb-0.5 -mr-1">
                                        {isSidebarOpen && (
                                            <button
                                                type="button"
                                                onClick={() => setIsSidebarOpen(false)}
                                                aria-label="Close sidebar"
                                                title="Close sidebar"
                                                className="group relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-[background-color,box-shadow,color,transform] duration-300 hover:scale-[1.05] hover:bg-slate-100 hover:text-slate-800 hover:shadow-[0_4px_14px_rgba(15,23,42,0.06)] active:scale-[0.94]"
                                            >
                                                <span
                                                    className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400/22 via-sky-400/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                                                    aria-hidden
                                                />
                                                <X className="pointer-events-none relative w-[15px] h-[15px] stroke-[2.2]" />
                                            </button>
                                        )}
                                    </div>
                                    <div className="px-1 flex flex-col gap-1">
                                        <button 
                                            onClick={() => {
                                                setMessages([]);
                                                setCurrentChatId(null);
                                                setVibePreviewMessageId(null);
                                                setVibePreviewFiles(null);
                                                setIsSidebarOpen(false);
                                                setSearchQuery("");
                                            }}
                                            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors font-medium text-[13.5px]"
                                        >
                                            <SquarePen className="w-4 h-4 stroke-[2]" />
                                            New chat
                                        </button>
                                        <button 
                                            className="w-full flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors font-medium text-[13.5px]"
                                        >
                                            <Folder className="w-4 h-4 stroke-[2]" />
                                            Projects
                                        </button>
                                    </div>
                                    
                                    <div className="relative mt-1.5 mb-0 px-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 stroke-[2.5] pointer-events-none" />
                                        <input 
                                            ref={searchInputRef}
                                            type="text" 
                                            placeholder="Search chats" 
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 bg-transparent hover:bg-slate-100/50 focus:bg-slate-100/50 rounded-[12px] text-sm placeholder:text-slate-500 text-slate-700 font-medium focus:outline-none transition-all border border-transparent focus:border-slate-200"
                                        />
                                        {searchQuery && (
                                            <button 
                                                onClick={() => setSearchQuery("")}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="scrollbar-none flex-1 overflow-y-auto flex flex-col p-2 space-y-4">
                                    {filteredChats.length > 0 ? (
                                        <div className="flex flex-col gap-0.5">
                                            <AnimatePresence mode="popLayout">
                                                {filteredChats.map((chat) => {
                                                    const matchedMessage = searchQuery ? chat.messages.find(m => m.content.toLowerCase().includes(searchQuery.toLowerCase())) : null;
                                                    const isTitleMatch = searchQuery ? chat.title.toLowerCase().includes(searchQuery.toLowerCase()) : false;
                                                                
                                                                return (
                                                                    <motion.div 
                                                                        layout="position"
                                                                        initial={{ opacity: 0, y: 10 }}
                                                                        animate={{ opacity: 1, y: 0 }}
                                                                        exit={{ opacity: 0, y: -20, height: 0, filter: "blur(4px)" }}
                                                                        transition={{ duration: 0.25, type: "spring", bounce: 0, mass: 0.8 }}
                                                                        key={chat.id}
                                                                        className={cn(
                                                                            "group relative w-full px-3 py-2 rounded-[12px] transition-[background-color] cursor-pointer flex flex-col justify-center",
                                                                            currentChatId === chat.id ? "bg-slate-100/80 text-[#0f0f0f]" : "text-slate-600 hover:bg-slate-100/50 hover:text-[#0f0f0f]"
                                                                        )}
                                                                        onClick={() => {
                                                                            if (editingChatId === chat.id) return;
                                                                            setCurrentChatId(chat.id);
                                                                            setMessages(chat.messages);
                                                                            let restoredPreview = false;
                                                                            const lastDoneVibe = [...chat.messages]
                                                                                .reverse()
                                                                                .find(
                                                                                    (m) =>
                                                                                        m.role === "assistant" &&
                                                                                        m.assistantKind === "vibe" &&
                                                                                        !m.isStreaming &&
                                                                                        typeof m.content === "string" &&
                                                                                        m.content.includes("<<<VIBE_"),
                                                                                );
                                                                            if (lastDoneVibe) {
                                                                                const files = extractVibeFilesFromContent(
                                                                                    lastDoneVibe.content,
                                                                                );
                                                                                if (Object.keys(files).length > 0) {
                                                                                    setVibePreviewMessageId(lastDoneVibe.id);
                                                                                    setVibePreviewFiles(files);
                                                                                    restoredPreview = true;
                                                                                }
                                                                            }
                                                                            if (!restoredPreview) {
                                                                                setVibePreviewMessageId(null);
                                                                                setVibePreviewFiles(null);
                                                                            }
                                                                            setIsSidebarOpen(false);
                                                                        }}
                                                                    >
                                                                    {editingChatId === chat.id ? (
                                                                        <div className="flex w-full items-center gap-2">
                                                                            <input
                                                                                type="text"
                                                                                value={editingTitle}
                                                                                onChange={(e) => setEditingTitle(e.target.value)}
                                                                                className="flex-1 bg-white border border-slate-200 shadow-sm outline-none rounded-md px-2 py-0.5 text-[13.5px] font-medium"
                                                                                autoFocus
                                                                                onKeyDown={(e) => {
                                                                                    if (e.key === 'Enter') {
                                                                                        setChats(prev => prev.map(c => c.id === chat.id ? { ...c, title: editingTitle || c.title } : c));
                                                                                        setEditingChatId(null);
                                                                                    } else if (e.key === 'Escape') {
                                                                                        setEditingChatId(null);
                                                                                    }
                                                                                }}
                                                                                onBlur={() => {
                                                                                    setChats(prev => prev.map(c => c.id === chat.id ? { ...c, title: editingTitle || c.title } : c));
                                                                                    setEditingChatId(null);
                                                                                }}
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <>
                                                                            <div className="flex items-center w-full">
                                                                                <span className="flex-1 text-[13.5px] truncate font-medium pr-10">
                                                                                    <HighlightText text={chat.title} highlight={searchQuery} />
                                                                                </span>
                                                                                <div className="absolute right-1 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity pl-2">
                                                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-100/80 -left-6 w-6 pointer-events-none" />
                                                                                    <button 
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setEditingChatId(chat.id);
                                                                                            setEditingTitle(chat.title);
                                                                                        }}
                                                                                        className="p-1.5 text-slate-400 hover:text-[#0f0f0f] transition-colors"
                                                                                    >
                                                                                        <Pencil className="w-3.5 h-3.5 stroke-[2]" />
                                                                                    </button>
                                                                                    <button 
                                                                                        onClick={(e) => {
                                                                                            e.stopPropagation();
                                                                                            setChats(prev => prev.filter(c => c.id !== chat.id));
                                                                                            if (currentChatId === chat.id) {
                                                                                                setCurrentChatId(null);
                                                                                                setMessages([]);
                                                                                            }
                                                                                        }}
                                                                                        className="p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                                                                                    >
                                                                                        <Trash2 className="w-3.5 h-3.5 stroke-[2]" />
                                                                                    </button>
                                                                                </div>
                                                                            </div>
                                                                            {searchQuery && !isTitleMatch && matchedMessage && (
                                                                                <div className="text-[11.5px] text-slate-400 truncate mt-0.5 pr-2 w-full">
                                                                                    {matchedMessage.role === 'user' ? 'You: ' : 'AI: '}
                                                                                    <HighlightText text={matchedMessage.content} highlight={searchQuery} />
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    )}
                                                                    </motion.div>
                                                                );
                                                            })}
                                                        </AnimatePresence>
                                                    </div>
                                    ) : (
                                        <div className="p-5 text-center text-sm text-slate-400 font-medium">
                                            {searchQuery ? "No chats found" : "No chats yet"}
                                        </div>
                                    )}
                                </div>

                                {/* User Profile Footer */}
                                <button
                                    onClick={() => setIsSettingsOpen(true)}
                                    className="p-3 border-t border-black/[0.04] flex items-center gap-2.5 shrink-0 hover:bg-slate-50 transition-all duration-300 cursor-pointer w-full text-left group"
                                >
                                    <div className="flex items-center justify-center p-1 rounded-full bg-transparent text-slate-400 group-hover:text-slate-600 transition-colors">
                                        <Settings className="w-[18px] h-[18px] transition-transform duration-500 ease-out group-hover:rotate-90" />
                                    </div>
                                    <span className="flex-1 font-medium text-slate-500 group-hover:text-slate-700 transition-colors text-sm">Settings</span>
                                </button>
                            </div>
            </aside>

            <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col bg-slate-50 border-l border-slate-200/50 sm:border-transparent">
                <div
                    className={cn(
                        "grid min-h-0 w-full flex-1 overflow-hidden transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
                        showVibeLivePreview
                            ? "grid-cols-[minmax(260px,min(420px,34vw))_minmax(0,1fr)]"
                            : "grid-cols-[minmax(0,1fr)_0fr]",
                    )}
                >
                <div
                    className={cn(
                        "relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden",
                        showVibeLivePreview && "border-r border-slate-200/70",
                    )}
                >
                {!isSidebarOpen && (
                    <button
                        type="button"
                        onClick={() => setIsSidebarOpen(true)}
                        aria-label="Open sidebar"
                        aria-expanded={false}
                        title="Open sidebar"
                        className="group fixed top-4 left-4 z-[110] flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-transparent text-slate-600 shadow-none transition-[background-color,border-color,box-shadow,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.06] hover:border-slate-200/70 hover:bg-white/85 hover:shadow-[0_10px_28px_rgba(15,23,42,0.12)] active:scale-[0.94] sm:top-6 sm:left-6"
                    >
                        <span
                            className="pointer-events-none absolute inset-0 rounded-full bg-gradient-to-br from-indigo-400/28 via-sky-400/12 to-transparent opacity-0 transition-all duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
                            aria-hidden
                        />
                        <span
                            className="pointer-events-none absolute inset-0 rounded-full opacity-0 shadow-[inset_0_0_0_1px_rgba(99,102,241,0.38)] transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-100"
                            aria-hidden
                        />
                        <span className="pointer-events-none relative block h-[12px] w-[18px] opacity-95">
                            <span className="pointer-events-none absolute left-0 top-0 h-[2px] w-full rounded-full bg-current" />
                            <span className="pointer-events-none absolute left-0 top-[5px] h-[2px] w-full rounded-full bg-current" />
                            <span className="pointer-events-none absolute left-0 top-[10px] h-[2px] w-full rounded-full bg-current" />
                        </span>
                    </button>
                )}
                
                <AnimatePresence>
                    {(messages.length === 0 || isTemporaryChat) && (
                        <motion.button 
                            initial={{ opacity: 0, y: -20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -20, scale: 0.95 }}
                            transition={{ type: "spring", stiffness: 400, damping: 25, mass: 0.8 }}
                            onClick={() => {
                                if (messages.length > 0 && isTemporaryChat) {
                                    setIsTemporaryChat(false);
                                    setToastMessage("Chat saved to history");
                                } else {
                                    setIsTemporaryChat(!isTemporaryChat);
                                }
                            }}
                            className={cn(
                                "fixed top-4 right-4 z-[95] rounded-full p-2 transition-all duration-300 group sm:top-6 sm:right-6",
                                isTemporaryChat ? "text-slate-700 bg-slate-100/50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50"
                            )} 
                            title={isTemporaryChat ? "Turn off Temporary Chat" : "Temporary Chat"}
                        >
                            <MessageCircleDashed className={cn("w-6 h-6 stroke-[1.5] transition-all duration-300", isTemporaryChat ? "opacity-100 scale-105" : "opacity-70 group-hover:opacity-100")} />
                            <AnimatePresence>
                                {isTemporaryChat && (
                                    <motion.div
                                        initial={{ scale: 0.5, opacity: 0, pathLength: 0 }}
                                        animate={{ scale: 1, opacity: 1, pathLength: 1 }}
                                        exit={{ scale: 0.5, opacity: 0 }}
                                        transition={{ 
                                            type: "spring",
                                            stiffness: 400,
                                            damping: 25,
                                            mass: 0.8
                                        }}
                                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                        <Check className="w-3.5 h-3.5 stroke-[2.5] text-slate-700" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.button>
                    )}
                </AnimatePresence>
                <div className={cn(
                    "flex flex-col h-full min-h-0 w-full",
                    showVibeLivePreview ? "min-w-0 flex-1 px-3 sm:px-4" : "max-w-3xl mx-auto",
                    messages.length === 0
                        ? "justify-center px-4 sm:px-6"
                        : cn("pt-12 sm:pt-14", showVibeLivePreview ? "px-3 sm:px-4" : "px-4 sm:px-6"),
                )}>
                {messages.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="text-center space-y-3 mb-8 flex flex-col items-center"
                    >
                        <motion.h1 
                            layout="position"
                            className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-800"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1, duration: 0.4 }}
                        >
                            Hi there, I'm Clyra
                        </motion.h1>
                        <motion.div layout="position" className="flex flex-col items-center">
                            <motion.p 
                                layout="position"
                                className="text-slate-500 text-sm sm:text-base font-medium font-sans z-10 relative bg-white"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                            >
                                What can I help you with today?
                            </motion.p>
                            <AnimatePresence>
                                {isTemporaryChat && (
                                    <motion.div
                                        initial={{ opacity: 0, y: -20, height: 0 }}
                                        animate={{ opacity: 1, y: 0, height: "auto" }}
                                        exit={{ opacity: 0, y: -20, height: 0 }}
                                        transition={{ duration: 0.3, ease: "easeInOut" }}
                                        className="overflow-hidden relative z-0"
                                    >
                                        <div className="pt-3 pb-1">
                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-200/50 text-slate-500 font-medium text-xs">
                                                <MessageCircleDashed className="w-3.5 h-3.5" />
                                                You are in temporary chat
                                            </span>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    </motion.div>
                ) : (
                    <div className="flex flex-1 w-full flex-col space-y-6 overflow-y-auto pb-4 pt-0 scrollbar-none" id="chat-container">
                        {messages.map((message) => {
                            const fontClass = fontSize === 'Small' ? 'text-[14px] leading-relaxed' : fontSize === 'Large' ? 'text-[18px] leading-loose' : 'text-[15px] sm:text-[16px] leading-relaxed';
                            const isLastAssistant =
                                message.role === "assistant" && lastAssistantId != null && message.id === lastAssistantId;
                            return (
                            <motion.div 
                                key={message.id}
                                initial={{ opacity: 0, y: 15, scale: 0.98 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                transition={{ type: "spring", bounce: 0, duration: 0.5 * animationSpeed }}
                                className={cn(
                                    "flex w-full",
                                    message.role === 'user' ? "justify-end" : "justify-start"
                                )}
                            >
                                {message.role === 'user' ? (
                                    <div 
                                        data-invert-ignore="true"
                                        className={cn("px-5 py-3.5 rounded-[24px] max-w-[85%] sm:max-w-[75%] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-200/60 whitespace-pre-wrap", fontClass)}
                                        style={{ backgroundColor: userBubbleColor, color: '#1e293b' }}
                                    >
                                        {message.content}
                                    </div>
                                ) : (
                                    <div 
                                        data-invert-ignore={theme === 'Dark' ? "true" : undefined}
                                        className="px-2 py-2 w-full flex items-start gap-3"
                                        style={{ color: theme === 'Dark' ? '#e2e8f0' : '#1e293b' }}
                                    >
                                        <AnimatedMessage
                                            messageId={message.id}
                                            content={message.content}
                                            isThinking={message.isThinking}
                                            isStreaming={message.isStreaming}
                                            reasoningContent={message.reasoningContent}
                                            vibeUserPrompt={message.vibeUserPrompt}
                                            fontSizeClass={fontClass}
                                            markdownSupport={markdownSupport}
                                            codeHighlighting={codeHighlighting}
                                            assistantKind={message.assistantKind === "vibe" ? "vibe" : "chat"}
                                            isLastAssistant={isLastAssistant}
                                            onVibePreviewReady={handleVibePreviewReady}
                                        />
                                    </div>
                                )}
                            </motion.div>
                        )})}
                    </div>
                )}

                <AnimatePresence>
                {!isFullscreen && (
                <motion.div 
                    layout
                    ref={inputContainerRef}
                    onClick={() => {
                        if (!isInputExpanded) {
                            setIsInputExpanded(true);
                        }
                    }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20, pointerEvents: 'none' }}
                    transition={{ type: "spring", bounce: 0, duration: 0.6 * animationSpeed }}
                    className={cn(
                        "w-full shrink-0 relative z-20 transition-all duration-300",
                        messages.length === 0 ? "max-w-2xl mx-auto pb-12" : "pb-1 sm:pb-2"
                    )}
                >
                    <div 
                        className={cn(
                            "input-wrapper relative bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border transition-all duration-300 cursor-text rounded-[32px] sm:rounded-[40px] z-[3]",
                            isExpanded ? "p-2 sm:p-3" : "p-1.5 sm:p-2",
                            "hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
                            "border-slate-200/60"
                        )}
                    >
                        <div className="relative z-10 w-full h-full">
                        <AnimatePresence>
                            {showCommandPalette && (
                                <motion.div 
                                    ref={commandPaletteRef}
                                    className="absolute left-4 right-4 sm:left-6 sm:right-6 bottom-[calc(100%+8px)] max-h-[170px] overflow-y-auto bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.12)] border border-slate-100 z-50 scrollbar-none transform-gpu origin-bottom pb-1"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                >
                                    <div className="py-2">
                                        <div className="px-3 pb-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                            Commands
                                        </div>
                                        {filteredSuggestions.map((suggestion, index) => {
                                            const originalIndex = commandSuggestions.findIndex(c => c.prefix === suggestion.prefix);
                                            return (
                                                <motion.div
                                                    key={suggestion.prefix}
                                                    className={cn(
                                                        "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer",
                                                        activeSuggestion === index 
                                                            ? "bg-slate-100 text-slate-900" 
                                                            : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-900"
                                                    )}
                                                    onClick={() => selectCommandSuggestion(originalIndex)}
                                                    onMouseEnter={() => setActiveSuggestion(index)}
                                                >
                                                    <div className={cn(
                                                        "w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0",
                                                        activeSuggestion === index ? "bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200" : "bg-slate-50/50 text-slate-500 border border-transparent"
                                                    )}>
                                                        {suggestion.icon(activeSuggestion === index)}
                                                    </div>
                                                    <div className="flex-1 flex flex-col items-start leading-snug truncate">
                                                        <span className="font-medium truncate w-full">
                                                            {commandQuery ? (
                                                                <>
                                                                    {suggestion.label.substring(0, suggestion.label.toLowerCase().indexOf(commandQuery))}
                                                                    <span className="text-blue-500">{suggestion.label.substring(suggestion.label.toLowerCase().indexOf(commandQuery), suggestion.label.toLowerCase().indexOf(commandQuery) + commandQuery.length)}</span>
                                                                    {suggestion.label.substring(suggestion.label.toLowerCase().indexOf(commandQuery) + commandQuery.length)}
                                                                </>
                                                            ) : (
                                                                suggestion.label
                                                            )}
                                                        </span>
                                                        <span className="text-slate-400 text-xs hidden sm:block truncate w-full">{suggestion.description}</span>
                                                    </div>
                                                </motion.div>
                                            );
                                        })}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="px-3 py-1">
                            <Textarea
                                ref={textareaRef}
                                value={value}
                                onChange={(e) => {
                                    setValue(e.target.value);
                                    adjustHeight();
                                }}
                                onKeyDown={handleKeyDown}
                                onFocus={() => {
                                    setIsInputExpanded(true);
                                    adjustHeight();
                                }}
                                placeholder="Ask Clyra anything..."
                                containerClassName="w-full"
                                className={cn(
                                    "resize-none overflow-y-auto overflow-x-hidden",
                                    "text-slate-800 text-[15px] leading-relaxed sm:text-lg",
                                    "placeholder:text-slate-400",
                                    isExpanded ? "min-h-[50px] max-h-[35vh] py-3 px-1" : "h-[40px] min-h-[40px] max-h-[40px] py-1.5 px-1",
                                    "scrollbar-none transition-all duration-300"
                                )}
                            />
                        </div>

                        <AnimatePresence>
                            {attachments.length > 0 && (
                                <motion.div 
                                    className="px-4 pb-3 flex gap-2 flex-wrap"
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    {attachments.map((file, index) => (
                                        <motion.div
                                            key={index}
                                            className="flex items-center gap-2 text-xs font-medium bg-slate-100 py-1.5 px-3 rounded-xl border border-slate-200 text-slate-600 shadow-sm"
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                        >
                                            <FileUp className="w-3.5 h-3.5 text-slate-400" />
                                            <span>{file}</span>
                                            <button 
                                                onClick={() => removeAttachment(index)}
                                                className="text-slate-400 hover:text-slate-700 transition-colors ml-1"
                                            >
                                                <XIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <AnimatePresence>
                            {isExpanded && (
                                <motion.div 
                                    layout
                                    initial={{ opacity: 0, height: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, height: "auto", scale: 1 }}
                                    exit={{ opacity: 0, height: 0, scale: 0.95 }}
                                    transition={{ duration: 0.2 }}
                                    className="flex items-center justify-between p-2 pt-0"
                                >
                                    <div className="flex items-center gap-1 sm:gap-2">
                                        <motion.button
                                            type="button"
                                            onClick={handleAttachFile}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            className="p-2 sm:p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-colors flex items-center justify-center shrink-0"
                                        >
                                            <Paperclip className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                                        </motion.button>
                                        
                                        <AnimatePresence>
                                            {selectedCommand && (
                                                <motion.div 
                                                    layout
                                                    initial={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                                                    animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                                                    exit={{ opacity: 0, scale: 0.9, filter: "blur(4px)" }}
                                                    transition={{ type: "spring", bounce: 0, duration: 0.3 }}
                                                    className="flex items-center gap-1.5 text-slate-700 px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold ml-1 hover:bg-slate-100/80 transition-colors cursor-default"
                                                >
                                                    <span className="opacity-70">{selectedCommand.icon(false)}</span>
                                                    <span className="hidden sm:inline-block">{selectedCommand.label}</span>
                                                    <button 
                                                        onClick={() => setSelectedCommand(null)} 
                                                        className="ml-1 -mr-1 text-slate-400 hover:text-slate-600 rounded-full p-0.5 hover:bg-slate-100 transition-colors"
                                                    >
                                                        <XIcon className="w-3.5 h-3.5" />
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                    
                                    <div className="flex items-center gap-2">
                                        <AnimatePresence mode="wait">
                                            {(value.trim() || selectedCommand) ? (
                                                <motion.div 
                                                    key="send-hint"
                                                    initial={{ opacity: 0, x: 5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 5 }}
                                                    className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400/80 font-medium mr-1"
                                                >
                                                    <span className="flex items-center gap-1">
                                                        <kbd className="font-sans px-1 py-[1.5px] rounded-sm bg-slate-100/50 border border-slate-200/50 shadow-[0_1px_0.5px_rgba(0,0,0,0.02)] text-slate-400">Esc</kbd> 
                                                        to clear
                                                    </span>
                                                    <span className="text-slate-300">•</span>
                                                    <span className="flex items-center gap-1">
                                                        <kbd className="font-sans px-1 py-[1.5px] rounded-sm bg-slate-100/50 border border-slate-200/50 shadow-[0_1px_0.5px_rgba(0,0,0,0.02)] text-slate-400">↵</kbd> 
                                                        to send
                                                    </span>
                                                </motion.div>
                                            ) : (
                                                <motion.div 
                                                    key="cmd-hint"
                                                    initial={{ opacity: 0, x: 5 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    exit={{ opacity: 0, x: 5 }}
                                                    className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400/80 font-medium mr-1"
                                                >
                                                    <span className="flex items-center gap-1">
                                                        <kbd className="font-sans px-1 py-[1.5px] rounded-sm bg-slate-100/50 border border-slate-200/50 shadow-[0_1px_0.5px_rgba(0,0,0,0.02)] text-slate-400">Ctrl/⌘K</kbd> 
                                                        for commands
                                                    </span>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                        <motion.button
                                            type="button"
                                            onClick={handleSendMessage}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            disabled={value.trim().length === 0 && !selectedCommand}
                                            className={cn(
                                                "p-2.5 rounded-full transition-all duration-200 shrink-0",
                                                "flex items-center justify-center shadow-sm",
                                                (value.trim() || selectedCommand)
                                                    ? "bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:shadow-lg"
                                                    : "bg-slate-100 text-slate-400 cursor-not-allowed"
                                            )}
                                        >
                                            <ArrowUpIcon className="w-5 h-5" />
                                        </motion.button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
                )}
                </AnimatePresence>
                </div>
                </div>
                <div
                    className={cn(
                        "flex min-h-0 min-w-0 flex-col overflow-hidden bg-white transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                        showVibeLivePreview
                            ? "pointer-events-auto opacity-100"
                            : "pointer-events-none opacity-0",
                    )}
                    aria-hidden={!showVibeLivePreview}
                >
                    {showVibeLivePreview ? (
                        <VibeLivePreviewPanel 
                            filesByPath={vibePreviewFiles!} 
                            onAutoFix={handleAutoFix}
                        />
                    ) : null}
                </div>
                </div>
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -40, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9, y: -20 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 400, 
                            damping: 25,
                            mass: 0.8
                        }}
                        className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-3.5 py-3 bg-white text-slate-700 text-sm font-medium rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.08)] border border-slate-200/60 flex items-center gap-3.5 max-w-[90vw]"
                    >
                        <div className="relative flex items-center justify-center w-8 h-8 rounded-full shrink-0 ml-1">
                            <MessageCircleDashed className="w-5 h-5 text-slate-600 stroke-[1.5]" />
                            <motion.div
                                initial={{ scale: 1, opacity: 1, y: 0 }}
                                animate={{ scale: 0, opacity: 0, y: -5 }}
                                transition={{ duration: 0.3, delay: 0.4, ease: "backIn" }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                            >
                                <div className="flex items-center justify-center w-full h-full bg-white rounded-full">
                                    <Check className="w-4 h-4 stroke-[3] text-slate-500" />
                                </div>
                            </motion.div>
                        </div>
                        <div className="flex flex-col pr-3">
                            <span className="font-semibold text-slate-800 tracking-tight leading-tight mb-[3px]">Temporary chat disabled</span>
                            <span className="text-slate-500 text-[13px] leading-tight font-normal">This conversation is saved to your history.</span>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
            </div>
        </div>
        <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            theme={theme} setTheme={setTheme}
            sendOnEnter={sendOnEnter} setSendOnEnter={setSendOnEnter}
            fontSize={fontSize} setFontSize={setFontSize}
            autoScroll={autoScroll} setAutoScroll={setAutoScroll}
            animationSpeed={animationSpeed} setAnimationSpeed={setAnimationSpeed}
            codeHighlighting={codeHighlighting} setCodeHighlighting={setCodeHighlighting}
            markdownSupport={markdownSupport} setMarkdownSupport={setMarkdownSupport}
            systemPrompt={systemPrompt} setSystemPrompt={setSystemPrompt}
            temperature={temperature} setTemperature={setTemperature}
            userBubbleColor={userBubbleColor} setUserBubbleColor={setUserBubbleColor}
            chats={chats}
            clearChats={() => {
                setChats([]);
                setMessages([]);
                setCurrentChatId(null);
                setIsSettingsOpen(false);
                setToastMessage("All chats cleared");
            }}
        />
        </FullscreenContext.Provider>
    );
}

export async function streamOpenAI(
    systemInstruction: string | null,
    messages: any[],
    onChunk: (text: string, isReasoning?: boolean) => void,
    temperature: number = 0.7,
    maxTokens: number = 8000,
    model: string = "deepseek-reasoner",
) {
    const formattedMessages = systemInstruction 
        ? [{ role: "system", content: systemInstruction }, ...messages] 
        : messages;

    const response = await fetch("/api/deepseek/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages: formattedMessages,
            temperature,
            stream: true,
            max_tokens: maxTokens,
        })
    });

    if (!response.ok) {
        let detail = response.statusText;
        try {
            const errBody = await response.json();
            if (errBody?.error) detail = String(errBody.error);
        } catch {
            /* ignore */
        }
        throw new Error(`Chat API error: ${response.status} ${detail}`);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder("utf-8");
    if (!reader) return;

    let buffer = "";
    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        
        for (let line of lines) {
            line = line.trim();
            if (!line) continue;
            if (line === "data: [DONE]") return;
            if (line.startsWith("data: ")) {
                try {
                    const data = JSON.parse(line.slice(6));
                    if (data.choices && data.choices[0] && data.choices[0].delta) {
                        const delta = data.choices[0].delta;
                        if (delta.reasoning_content) {
                            onChunk(delta.reasoning_content, true);
                        }
                        if (delta.content) {
                            onChunk(delta.content, false);
                        }
                    }
                } catch (e) {
                    // Ignore parse errors
                }
            }
        }
    }
}
