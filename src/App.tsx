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
import {
  AppWindow,
  Scissors,
  ArrowUpIcon,
  Check,
  ChevronRight,
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
import { ChatSearchModal } from "./components/ChatSearchModal";
import { ShiningText } from "./components/ShiningText";
import { BlurredStaggerStream } from "@/components/ui/blurred-stagger-text";
import { MarkdownMessageContent } from "./components/MarkdownMessageContent";
import { GradientWaveText } from "./components/GradientWaveText";
import AIClipper from "./components/AIClipper";
import AgenticBrowser from "./components/AgenticBrowser";
import { AiOrb } from "./components/AiOrb";
import { VibeAgentMessageBody } from "./components/vibe/VibeAgentMessageBody";
import { VibeLivePreviewPanel } from "./components/vibe/VibeLivePreviewPanel";
import { buildLocalVibeFallbackResponse } from "./lib/buildLocalVibeFallback";
import { VIBE_CURSOR_AGENT_SYSTEM_PROMPT } from "./lib/vibeAgentConstants";
import { extractVibeFilesFromContent } from "./lib/parseVibeAgentContent";

type WorkspaceTabId = "chat" | "vibe" | "browser";
const WORKSPACE_TAB_ORDER: WorkspaceTabId[] = ["chat", "vibe", "browser"];

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

function UserMessageText({ text }: { text: string }) {
  return (
    <p className="clyra-chat-user-text">
      <GradientWaveText
        align="left"
        speed={1.55}
        bottomOffset={8}
        bandGap={4}
        bandCount={8}
        className="clyra-chat-user-gradient"
        ariaLabel={text}
      >
        {text}
      </GradientWaveText>
    </p>
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
  onVibePreviewReady?: (
    messageId: string,
    filesByPath: Record<string, string>,
  ) => void;
}) => {
  const isVibe = assistantKind === "vibe";
  /** Vibe agent now drives its own thought UI from the model's <<<VIBE_THINKING>>> blocks. While we have no
   *  content yet, show the unified "Thinking" shimmer so the seam into the inline VibeThoughtPanel is clean. */
  const suppressVibeAnswerBody = isVibe && !!isThinking && content.length === 0;
  const hasMarkdownStructure =
    /```|^\s{0,3}#{1,6}\s|^\s*[-*]\s|\n\s*\d+\.\s|\|.+\||\*\*[^*]+\*\*/m.test(content);
  const shouldRenderMarkdown =
    markdownSupport && hasMarkdownStructure;
  return (
    <div
      className={cn(
        "pt-0.5 font-medium text-inherit w-full relative flex flex-col gap-2",
        fontSizeClass,
      )}
    >

      {content.length > 0 && !suppressVibeAnswerBody ? (
        <div
          className={cn("markdown-body mt-1", isVibe && "markdown-body--vibe")}
          data-invert-ignore
        >
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
          ) : shouldRenderMarkdown ? (
            <MarkdownMessageContent
              content={content}
              codeHighlighting={!!codeHighlighting}
              codePresentation="default"
            />
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
            maxHeight ?? Number.POSITIVE_INFINITY,
          ),
        );
        textarea.style.height = `${newHeight}px`;
      });
    },
    [minHeight, maxHeight],
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

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  containerClassName?: string;
}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("relative flex items-center", containerClassName)}>
        <textarea
          className={cn(
            "flex w-full bg-transparent px-4 text-base text-slate-800",
            "transition-all duration-200 ease-in-out",
            "placeholder:text-slate-400 font-medium",
            "disabled:cursor-not-allowed disabled:opacity-50",
            "focus-visible:outline-none focus:ring-0 focus-visible:ring-offset-0",
            className,
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  },
);
Textarea.displayName = "Textarea";

const HighlightText = ({
  text,
  highlight,
}: {
  text: string;
  highlight: string;
}) => {
  if (!highlight.trim()) return <>{text}</>;
  const lower = highlight.toLowerCase();
  const parts = text.split(
    new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"),
  );
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === lower ? (
          <span
            key={i}
            className="text-blue-500 font-medium transition-colors duration-300 ease-out"
          >
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
};

export const FullscreenContext = React.createContext({
  isFullscreen: false,
  setIsFullscreen: (v: boolean) => {},
});

export default function App() {
  interface Message {
    id: string;
    role: "user" | "assistant";
    content: string;
    reasoningContent?: string;
    isThinking?: boolean;
    isStreaming?: boolean;
    /** `vibe` keeps the expandable thought UI; normal chat uses the “Thinking:” line only. */
    assistantKind?: "chat" | "vibe";
    /** User prompt for this Vibe reply—drives the fixed Thought summary. */
    vibeUserPrompt?: string;
  }

  interface ChatSession {
    id: string;
    title: string;
    messages: Message[];
    updatedAt: number;
    kind?: "chat" | "vibe";
    vibeRunning?: boolean;
    vibeUnread?: boolean;
  }

  const [selectedCommand, setSelectedCommand] =
    useState<CommandSuggestion | null>(null);
  const [activeWorkspaceTab, setActiveWorkspaceTab] =
    useState<WorkspaceTabId>("chat");
  const [workspaceTransitionDirection, setWorkspaceTransitionDirection] =
    useState(1);
  const [isWorkspaceSwitching, setIsWorkspaceSwitching] = useState(false);
  const workspaceSwitchTimeoutRef = useRef<number | null>(null);
  const [viewportWidth, setViewportWidth] = useState(() =>
    typeof window === "undefined" ? 1200 : window.innerWidth,
  );
  const [hoveredWorkspaceTab, setHoveredWorkspaceTab] =
    useState<WorkspaceTabId | null>(null);
  const [clipInitialUrl, setClipInitialUrl] = useState("");
  const [browserInitialQuery, setBrowserInitialQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chats, setChats] = useState<ChatSession[]>(() => {
    try {
      const saved = localStorage.getItem("vibe-coder-chats");
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error("Failed to load chats:", e);
    }
    return [];
  });

  useEffect(() => {
    try {
      localStorage.setItem("vibe-coder-chats", JSON.stringify(chats));
    } catch (e) {
      console.error("Failed to save chats:", e);
    }
  }, [chats]);

  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const currentChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);
  useEffect(() => {
    const updateViewportWidth = () => setViewportWidth(window.innerWidth);
    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    window.visualViewport?.addEventListener("resize", updateViewportWidth);
    return () => {
      window.removeEventListener("resize", updateViewportWidth);
      window.visualViewport?.removeEventListener("resize", updateViewportWidth);
    };
  }, []);
  type IntroState = "booting" | "progress" | "input_circle" | "input_expand" | "progress_complete" | "complete";
  const [introState, setIntroState] = useState<IntroState>("booting");
  const [introProgressText, setIntroProgressText] = useState("INITIALIZING");
  const [progressDuration] = useState(() => 3 + Math.random() * 3);
  
  useEffect(() => {
    if (introState === "complete") {
      return;
    }

    const pdMs = progressDuration * 1000;
    const texts = [
      "INITIALIZING",
      "LOADING WORKSPACE",
      "OPTIMIZING",
      "READY"
    ];
    let step = 0;
    const textInterval = setInterval(() => {
      step++;
      if (step < texts.length) setIntroProgressText(texts[step]);
    }, pdMs / texts.length);

    const t1 = setTimeout(() => setIntroState("progress"), 600); 
    const t2 = setTimeout(() => setIntroState("progress_complete"), 600 + pdMs); 
    const t3 = setTimeout(() => setIntroState("input_circle"), 600 + pdMs + 800); 
    const t4 = setTimeout(() => setIntroState("input_expand"), 600 + pdMs + 800 + 400); 
    const t5 = setTimeout(() => {
      setIntroState("complete");
      setIsSidebarOpen(true);
    }, 600 + pdMs + 800 + 400 + 1000);

    return () => {
      clearInterval(textInterval);
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [progressDuration]);



  useEffect(() => {
    return () => {
      if (workspaceSwitchTimeoutRef.current != null) {
        window.clearTimeout(workspaceSwitchTimeoutRef.current);
      }
    };
  }, []);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingChatId, setEditingChatId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [value, setValue] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [recentCommand, setRecentCommand] = useState<string | null>(null);
  const [isInputExpanded, setIsInputExpanded] = useState(false);
  const inputContainerRef = useRef<HTMLDivElement>(null);

  const isAiResponding = messages.some(m => m.isStreaming || m.isThinking);
  const isExpanded = !isAiResponding && (isInputExpanded || attachments.length > 0 || selectedCommand !== null || activeWorkspaceTab === "vibe");

  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 40,
    maxHeight: 200,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isChatInitialLoad, setIsChatInitialLoad] = useState(false);
  useEffect(() => {
    setIsChatInitialLoad(true);
    const timer = setTimeout(() => setIsChatInitialLoad(false), 100);
    return () => clearTimeout(timer);
  }, [currentChatId]);

  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showClipsLibrary, setShowClipsLibrary] = useState(false);
  const [theme, setTheme] = useState("Light");
  const [sendOnEnter, setSendOnEnter] = useState(true);
  const [fontSize, setFontSize] = useState("Medium");
  const [autoScroll, setAutoScroll] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [codeHighlighting, setCodeHighlighting] = useState(true);
  const [markdownSupport, setMarkdownSupport] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [userBubbleColor, setUserBubbleColor] = useState("#f8fafc");
  const [orbColorTheme, setOrbColorTheme] = useState<import("./components/AiOrb").OrbColorTheme>("default");
  const [bgAnimEnabled, setBgAnimEnabled] = useState(false);
  const [bgAnimColor, setBgAnimColor] = useState("#8b5cf6");
  const commandPaletteRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  /** When true, stream / layout growth will keep the chat column pinned to the bottom (normal chat behavior). */
  const chatNearBottomRef = useRef(true);

  useEffect(() => {
    setIsSearching(searchQuery.length > 0);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault();
        setIsSearchModalOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  const lastAssistantId = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (messages[i]!.role === "assistant") return messages[i]!.id;
    }
    return null as string | null;
  }, [messages]);

  const [vibePreviewMessageId, setVibePreviewMessageId] = useState<
    string | null
  >(null);
  const [vibePreviewFiles, setVibePreviewFiles] = useState<Record<
    string,
    string
  > | null>(null);

  const handleVibePreviewReady = useCallback(
    (messageId: string, files: Record<string, string>) => {
      if (Object.keys(files).length === 0) return;
      setVibePreviewMessageId(messageId);
      setVibePreviewFiles(files);
    },
    [],
  );

  /** Keeps Vibe streams writing into the correct chat in `chats` even when the user switches away. */
  const patchMessagesForChat = useCallback(
    (chatId: string, update: (prev: Message[]) => Message[]) => {
      setChats((prevChats) => {
        const i = prevChats.findIndex((c) => c.id === chatId);
        if (i < 0) return prevChats;
        const nextMsgs = update(prevChats[i]!.messages);
        const next = [...prevChats];
        next[i] = { ...next[i]!, messages: nextMsgs, updatedAt: Date.now() };
        return next;
      });
      setMessages((prev) =>
        currentChatIdRef.current === chatId ? update(prev) : prev,
      );
    },
    [],
  );

  const isVibeChat = useCallback((chat: ChatSession) => {
    return (
      chat.kind === "vibe" ||
      chat.messages.some((message) => message.assistantKind === "vibe")
    );
  }, []);

  const openChatSession = useCallback(
    (chat: ChatSession) => {
      setCurrentChatId(chat.id);
      setMessages(chat.messages);
      setSelectedCommand(null);
      setClipInitialUrl("");
      setBrowserInitialQuery("");
      setActiveWorkspaceTab(isVibeChat(chat) ? "vibe" : "chat");
      setChats((prev) =>
        prev.map((item) =>
          item.id === chat.id ? { ...item, vibeUnread: false } : item,
        ),
      );
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
        const files = extractVibeFilesFromContent(lastDoneVibe.content);
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
    },
    [isVibeChat],
  );

  const showVibeLivePreview =
    !!vibePreviewFiles &&
    vibePreviewMessageId != null &&
    vibePreviewMessageId === lastAssistantId &&
    messages.some(
      (m) =>
        m.id === lastAssistantId && m.role === "assistant" && !m.isStreaming,
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
        .map(
          (m) =>
            `${m.id}:${m.content.length}:${m.isStreaming ? 1 : 0}:${m.isThinking ? 1 : 0}`,
        )
        .join("|"),
    [messages],
  );

  useEffect(() => {
    const el = document.getElementById("chat-container");
    if (!el) return;
    const onScroll = () => {
      const gap = el.scrollHeight - el.scrollTop - el.clientHeight;
      chatNearBottomRef.current = gap < 80;
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
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        textareaRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const isVibeComposerMode =
    activeWorkspaceTab === "vibe" &&
    selectedCommand?.id !== "clip" &&
    selectedCommand?.id !== "browse";


  useEffect(() => {
    if (messages.length === 0 || isTemporaryChat) return;

    setChats((prevChats) => {
      const existingChatIndex = prevChats.findIndex(
        (c) => c.id === currentChatId,
      );

      if (existingChatIndex >= 0) {
        const newChats = [...prevChats];
        newChats[existingChatIndex] = {
          ...newChats[existingChatIndex],
          messages,
          updatedAt: Date.now(),
        };
        return newChats.sort((a, b) => b.updatedAt - a.updatedAt);
      } else if (currentChatId) {
        const title =
          messages[0].content.slice(0, 30) +
          (messages[0].content.length > 30 ? "..." : "");
        const newChat = {
          id: currentChatId,
          title,
          messages,
          updatedAt: Date.now(),
          kind: messages.some((message) => message.assistantKind === "vibe")
            ? ("vibe" as const)
            : ("chat" as const),
        };
        return [newChat, ...prevChats].sort(
          (a, b) => b.updatedAt - a.updatedAt,
        );
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
        !selectedCommand &&
        activeWorkspaceTab !== "vibe"
      ) {
        setIsInputExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, attachments.length, selectedCommand, activeWorkspaceTab]);

  const commandSuggestions: CommandSuggestion[] = [
    {
      id: "vibe",
      icon: (isActive) => (
        <div className="relative flex items-center justify-center w-[18px] text-slate-700">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-[18px] h-[18px]"
          >
            <path d="M8 7L13 12L8 17" />
            <motion.path
              d="M15 17H20"
              animate={isActive ? { opacity: [1, 1, 0, 0] } : { opacity: 1 }}
              transition={
                isActive
                  ? {
                      repeat: Infinity,
                      duration: 1,
                      times: [0, 0.49, 0.5, 1],
                      ease: "linear",
                    }
                  : {}
              }
            />
          </svg>
        </div>
      ),
      label: "Vibe Coder",
      description: "Build polished apps in a live workbench",
      prefix: "/vibe",
    },
    {
      id: "clip",
      icon: (isActive) => (
        <div className="relative flex items-center justify-center w-full h-full text-slate-700">
          <motion.div
            animate={
              isActive
                ? { scale: [1, 1.15, 1], rotate: [0, 5, 0] }
                : { scale: 1, rotate: 0 }
            }
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeOut" }}
          >
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
      description: "Render cinematic 720p clips with timed subtitles",
      prefix: "/clip",
    },
    {
      id: "browse",
      icon: (isActive) => (
        <div className="relative flex items-center justify-center w-full h-full text-slate-700">
          <AppWindow className="w-4 h-4" />
          <motion.div
            initial={{ x: 0, y: 0 }}
            animate={
              isActive
                ? {
                    x: [2, -2, 2],
                    y: [2, -1, 2],
                    scale: [1, 0.8, 1], // click effect
                  }
                : { x: 0, y: 0, scale: 1 }
            }
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="absolute -bottom-1 -right-1"
          >
            <MousePointer2 className="w-3 h-3 text-slate-700 fill-slate-100" />
          </motion.div>
        </div>
      ),
      label: "Agentic Browser",
      description: "Search with a visible AI cursor and task trail",
      prefix: "/browse",
    },
  ];

  const commandPaletteEnabled = false;
  const isCommandMode =
    commandPaletteEnabled && value.startsWith("/") && !value.includes(" ");
  const commandQuery = isCommandMode ? value.substring(1).toLowerCase() : "";
  const memoizedChats = React.useMemo(() => chats, [chats]);
  const filteredChats = React.useMemo(() => {
    if (!searchQuery) return memoizedChats;
    return memoizedChats.filter(
      (chat) =>
        chat.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        chat.messages.some((msg) =>
          msg.content.toLowerCase().includes(searchQuery.toLowerCase()),
        ),
    );
  }, [memoizedChats, searchQuery]);
  const filteredProjectChats = useMemo(
    () => filteredChats.filter((chat) => isVibeChat(chat)),
    [filteredChats, isVibeChat],
  );
  const filteredStandardChats = useMemo(
    () => filteredChats.filter((chat) => !isVibeChat(chat)),
    [filteredChats, isVibeChat],
  );

  const filteredSuggestions = isCommandMode
    ? commandSuggestions.filter((cmd) =>
        cmd.label.toLowerCase().includes(commandQuery),
      )
    : [];

  useEffect(() => {
    if (
      commandPaletteEnabled &&
      isCommandMode &&
      filteredSuggestions.length > 0
    ) {
      setShowCommandPalette(true);
      if (
        activeSuggestion >= filteredSuggestions.length ||
        activeSuggestion === -1
      ) {
        setActiveSuggestion(0);
      }
    } else {
      setShowCommandPalette(false);
      setActiveSuggestion(-1);
    }
  }, [
    commandPaletteEnabled,
    isCommandMode,
    commandQuery,
    filteredSuggestions.length,
  ]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const commandButton = document.querySelector("[data-command-button]");

      if (
        commandPaletteRef.current &&
        !commandPaletteRef.current.contains(target) &&
        !commandButton?.contains(target)
      ) {
        setShowCommandPalette(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
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
        document.documentElement.style.setProperty(
          "--app-scale",
          newScale.toString(),
        );
      } else {
        document.documentElement.style.setProperty("--app-scale", "1");
      }
    };

    handleResize(); // trigger on mount
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showCommandPalette && filteredSuggestions.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveSuggestion((prev) =>
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
        );
      } else if (e.key === "Tab" || e.key === "Enter") {
        e.preventDefault();
        const targetIndex = activeSuggestion >= 0 ? activeSuggestion : 0;
        if (targetIndex >= 0 && targetIndex < filteredSuggestions.length) {
          const selectedCmd = filteredSuggestions[targetIndex];
          const originalIndex = commandSuggestions.findIndex(
            (c) => c.prefix === selectedCmd.prefix,
          );
          selectCommandSuggestion(originalIndex);
        }
      } else if (e.key === "Escape") {
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

  const buildVibeProjectTitle = (prompt: string) => {
    const clean = prompt
      .replace(/^make\s+(me\s+)?/i, "")
      .replace(/^build\s+(me\s+)?/i, "")
      .replace(/^create\s+(me\s+)?/i, "")
      .replace(/\b(a|an|the)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const lower = clean.toLowerCase();
    if (lower.includes("calculator")) return "Calculator App";
    if (
      lower.includes("task") ||
      lower.includes("planner") ||
      lower.includes("todo") ||
      lower.includes("kanban")
    )
      return "Task Planner App";
    if (lower.includes("landing") && lower.includes("openai"))
      return "OpenAI Landing Page";
    if (lower.includes("landing")) return "Launch Landing Page";
    if (lower.includes("dashboard")) return "Analytics Dashboard";
    if (lower.includes("login") || lower.includes("auth")) return "Auth Flow";
    if (!clean) return "Vibe Project";
    return clean
      .split(" ")
      .slice(0, 4)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const buildVibeProjectRoot = (prompt: string) => {
    const slug = buildVibeProjectTitle(prompt)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 42);
    return `vibe-project/${slug || "clyra-vibe-project"}`;
  };

  const buildLocalVibeFallback = (userPrompt: string) => {
    const fallbackProjectTitle = buildVibeProjectTitle(userPrompt);
    return buildLocalVibeFallbackResponse(userPrompt, fallbackProjectTitle);

    const lowerPrompt = userPrompt.toLowerCase();
    const isTimerApp = /\b(timer|pomodoro|stopwatch|countdown)\b/.test(
      lowerPrompt,
    );
    const projectTitle = buildVibeProjectTitle(userPrompt);
    const projectTitleLiteral = JSON.stringify(projectTitle);
    const projectPromptLiteral = JSON.stringify(userPrompt);
    const appCode = isTimerApp
      ? `import React, { useEffect, useMemo, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";

/** A premium minimal timer app rendered inside the isolated Vibe sandbox. */
export default function TimerApp() {
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const totalSeconds = 25 * 60;

  useEffect(() => {
    if (!isRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((value) => {
        if (value <= 1) {
          setIsRunning(false);
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [isRunning]);

  const minutes = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
  const seconds = String(secondsLeft % 60).padStart(2, "0");
  const progress = useMemo(() => 1 - secondsLeft / totalSeconds, [secondsLeft]);

  return (
    <main className="grid min-h-screen place-items-center bg-[#10100d] px-6 text-white">
      <section className="w-full max-w-md rounded-lg border border-white/10 bg-white/[0.06] p-6 shadow-xl shadow-black/30">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#d6b56d]">Focus timer</p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Minimal Timer</h1>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/45">25 min</span>
        </div>

        <div className="relative mx-auto grid h-64 w-64 place-items-center rounded-full border border-white/10 bg-black/25">
          <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="43" fill="none" stroke="rgba(255,255,255,.08)" strokeWidth="4" />
            <circle cx="50" cy="50" r="43" fill="none" stroke="#d6b56d" strokeLinecap="round" strokeWidth="4" strokeDasharray={270} strokeDashoffset={270 - progress * 270} />
          </svg>
          <div className="text-center">
            <p className="text-6xl font-semibold tabular-nums">{minutes}:{seconds}</p>
            <p className="mt-3 text-sm text-white/40">{isRunning ? "Session running" : secondsLeft === 0 ? "Complete" : "Ready"}</p>
          </div>
        </div>

        <div className="mt-10 grid grid-cols-[1fr_auto] gap-3">
          <button onClick={() => setIsRunning((value) => !value)} className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#d6b56d] px-5 text-sm font-semibold text-[#17130b] transition hover:bg-[#e7c981]">
            {isRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
            {isRunning ? "Pause" : "Start"}
          </button>
          <button onClick={() => { setIsRunning(false); setSecondsLeft(totalSeconds); }} className="grid h-12 w-12 place-items-center rounded-lg border border-white/10 bg-white/[0.05] text-white/70 transition hover:bg-white/10 hover:text-white" aria-label="Reset timer">
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </section>
    </main>
  );
}`
      : `import React, { useMemo, useState } from "react";
import { CheckCircle2, Circle, Plus, Sparkles, Trash2 } from "lucide-react";

const projectTitle = ${projectTitleLiteral};
const projectPrompt = ${projectPromptLiteral};

/** A working prompt-specific app rendered inside the isolated Vibe sandbox. */
export default function AdaptiveWorkspaceApp() {
  const seedTasks = useMemo(() => {
    const words = projectPrompt
      .split(/\\s+/)
      .filter((word) => word.length > 3)
      .slice(0, 5);
    return (words.length ? words : ["design", "build", "polish"]).map((word, index) => ({
      id: String(index),
      label: "Ship " + word.replace(/[^a-z0-9]/gi, ""),
      done: index === 0,
    }));
  }, []);
  const [tasks, setTasks] = useState(seedTasks);
  const [note, setNote] = useState(projectPrompt);
  const [newTask, setNewTask] = useState("");
  const completeCount = tasks.filter((task) => task.done).length;
  const progress = Math.round((completeCount / Math.max(1, tasks.length)) * 100);
  const addTask = () => {
    const clean = newTask.trim();
    if (!clean) return;
    setTasks((items) => [
      ...items,
      { id: crypto.randomUUID(), label: clean, done: false },
    ]);
    setNewTask("");
  };

  return (
    <main className="min-h-screen bg-[#f6f7f4] p-6 text-slate-950">
      <section className="mx-auto grid min-h-[calc(100vh-3rem)] max-w-6xl gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <aside className="rounded-xl border border-black/10 bg-white/80 p-6 shadow-xl shadow-slate-200/70">
          <div className="grid h-12 w-12 place-items-center rounded-lg bg-black text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <p className="mt-8 text-xs font-bold uppercase tracking-[0.24em] text-emerald-700">
            Interactive app
          </p>
          <h1 className="mt-3 text-5xl font-semibold tracking-tight">
            {projectTitle}
          </h1>
          <textarea
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="mt-6 min-h-36 w-full resize-none rounded-lg border border-black/10 bg-slate-50 p-4 leading-7 outline-none transition focus:border-black/25"
          />
          <div className="mt-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-2xl font-semibold">{tasks.length}</p>
              <p className="text-xs font-semibold text-slate-500">Tasks</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-2xl font-semibold">{completeCount}</p>
              <p className="text-xs font-semibold text-slate-500">Done</p>
            </div>
            <div className="rounded-lg bg-slate-50 p-4">
              <p className="text-2xl font-semibold">{progress}%</p>
              <p className="text-xs font-semibold text-slate-500">Progress</p>
            </div>
          </div>
          <div className="mt-6 h-2 overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-emerald-700 transition-all"
              style={{ width: progress + "%" }}
            />
          </div>
        </aside>

        <div className="rounded-xl border border-black/10 bg-white p-5 shadow-2xl shadow-slate-200">
          <div className="flex gap-2">
            <input
              value={newTask}
              onChange={(event) => setNewTask(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && addTask()}
              placeholder="Add an app task..."
              className="h-12 flex-1 rounded-lg border border-black/10 px-4 outline-none transition focus:border-black/25"
            />
            <button
              onClick={addTask}
              className="inline-flex h-12 items-center gap-2 rounded-lg bg-black px-5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          <div className="mt-5 space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 rounded-lg border border-black/10 bg-slate-50 p-4"
              >
                <button
                  onClick={() =>
                    setTasks((items) =>
                      items.map((item) =>
                        item.id === task.id ? { ...item, done: !item.done } : item,
                      ),
                    )
                  }
                  className="text-slate-700"
                >
                  {task.done ? (
                    <CheckCircle2 className="h-5 w-5" />
                  ) : (
                    <Circle className="h-5 w-5" />
                  )}
                </button>
                <span
                  className={
                    task.done
                      ? "flex-1 text-slate-400 line-through"
                      : "flex-1 font-medium"
                  }
                >
                  {task.label}
                </span>
                <button
                  onClick={() =>
                    setTasks((items) => items.filter((item) => item.id !== task.id))
                  }
                  className="text-slate-400 transition hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}`;
    const fallbackBuildLabel = isTimerApp
      ? "a premium minimal focus timer with start, pause, reset, and progress ring"
      : `a working interactive ${projectTitle} app with editable state, task controls, and progress tracking`;
    const fallbackDesignDirection = isTimerApp
      ? "Cinematic minimal utility app with a dark canvas, gold progress ring, large readable timer, and compact controls."
      : "Light, minimal software UI with real controls, prompt-matched hierarchy, restrained contrast, responsive structure, and no landing-page filler.";

    return `<<<VIBE_THINKING>>>
Build session
Active agent: Build
Phase: Implement
Intent: ${userPrompt}
Context: Remote generation was unavailable, so I am creating a compact working sandbox preview directly.
TodoWrite: Build the requested UI in vibe-project/src/App.tsx, then verify the preview handoff.
Next tool: Write
Why: A real preview file is more useful than a staged planning timeline.
${fallbackDesignDirection}
<<<END_VIBE_THINKING>>>
Writing the sandbox preview.
<<<VIBE_CODE file="vibe-project/src/App.tsx" added="${appCode.split("\n").length}" removed="0">>>
${appCode}
<<<END_VIBE_CODE>>>
<<<VIBE_THINKING>>>
Build session
Active agent: Build
Phase: Verify
Intent: ${userPrompt}
Context: The preview now has a real React surface with local state and visible controls.
TodoWrite: Verify the generated App.tsx can be handed to the sandbox preview.
Next tool: Bash
Why: The user needs a working preview, not extra process cards.
<<<END_VIBE_THINKING>>>
<<<VIBE_RUN>>>
RUNNING COMMAND
$ npm run lint
Purpose: validate the generated React preview shape
OUTPUT
Command prepared for the sandbox preview. The host app also runs its own TypeScript checks before shipping.
<<<END_VIBE_RUN>>>
<<<VIBE_THINKING>>>
SHIPPED

WHAT WAS BUILT:
A sandboxed Vibe preview with ${fallbackBuildLabel}. The code is isolated under vibe-project and loaded by the preview server after verification.

FILE MANIFEST:
Created:
vibe-project/src/App.tsx — primary preview surface.

HOW TO RUN:
npm run dev
Then open the live preview URL shown in the workbench.

KNOWN TRADEOFFS:
The local fallback is intentionally compact so recovery stays fast and reliable.
<<<END_VIBE_THINKING>>>`;
  };

  const streamLocalVibeFallback = async (
    aiMsgId: string,
    streamChatId: string,
    fallback: string,
  ) => {
    let full = "";
    const chunks = fallback.match(/[\s\S]{1,2200}/g) ?? [fallback];
    for (const chunk of chunks) {
      full += chunk;
      patchMessagesForChat(streamChatId, (prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: full, isThinking: false, isStreaming: true }
            : msg,
        ),
      );
      await new Promise((resolve) => window.setTimeout(resolve, 4));
    }
    patchMessagesForChat(streamChatId, (prev) =>
      prev.map((msg) =>
        msg.id === aiMsgId
          ? { ...msg, isThinking: false, isStreaming: false }
          : msg,
      ),
    );
  };

  const simulateVibeCoder = async (
    aiMsgId: string,
    userPrompt: string,
    streamChatId: string,
  ) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === streamChatId
          ? {
              ...chat,
              kind: "vibe",
              vibeRunning: true,
              vibeUnread: false,
              updatedAt: Date.now(),
            }
          : chat,
      ),
    );
    try {
      const remoteVibeEnabled =
        window.localStorage.getItem("clyra-vibe-remote") !== "false";
      if (!remoteVibeEnabled) {
        const fallback = buildLocalVibeFallback(userPrompt);
        await streamLocalVibeFallback(aiMsgId, streamChatId, fallback);
        setChats((prev) =>
          prev.map((chat) =>
            chat.id === streamChatId
              ? {
                  ...chat,
                  kind: "vibe",
                  vibeRunning: false,
                  vibeUnread: currentChatIdRef.current !== streamChatId,
                  updatedAt: Date.now(),
                }
              : chat,
          ),
        );
        return;
      }

      const vibeProjectRoot = buildVibeProjectRoot(userPrompt);
      let full = "";
      const openAiMessages = [
        {
          role: "user",
          content: `User request - build a complete, polished React 19 + TypeScript experience with Tailwind-compatible classes, lucide-react, and framer-motion where helpful.

Project context: elite in-browser coding agent. Your stream is rendered as a live timeline:
  - DEEP THINKING / MID-TASK REFLECTION / SELF-CRITIQUE / SHIPPED blocks render as inline expandable "Thought" panels.
  - ANALYZE renders as a small "Analysing <path>" banner.
  - CODE renders as a typed mini code box, one block per file.
  - RUN renders as a single-row "Run Command <cmd>" card.
  - Short prose lines BETWEEN blocks render as small narration lines (kept short - one sentence each).
  - Once everything finishes, the UI auto-renders a "Build complete" summary listing each file you wrote and its top-level exports, so make sure exports are named and (ideally) preceded by a brief JSDoc.

You MUST follow the mandatory agent loop. Do NOT stop after the first thinking block.

Project root for this build:
  ${vibeProjectRoot}

Required build contract:
  1) Think like a senior product engineer. Build the complete version the user probably expects, not the smallest possible component.
  2) Emit a concise opening <<<VIBE_THINKING>>> block that identifies the product type, necessary screens/states, file map, and one active TodoWrite item.
  3) Write real source files under ${vibeProjectRoot}. Do not create plan.md, README.md, or process docs unless the user explicitly asks.
  4) For any non-trivial app, emit at least 6 focused source files: types, data, reusable UI, feature components/screens, hooks or utils where useful, and App wiring.
  5) Split the work into honest implementation steps. After each step, emit a <<<VIBE_THINKING>>> reflection naming what was actually completed, what changed in the codebase, what risk remains, and the next concrete step.
       - Tiny requests like a calculator or simple converter usually need 2 implementation steps and 4-6 files.
       - Medium tools/dashboards usually need 3-4 steps and 6-9 files.
       - Full landing pages, SaaS products, games, or workflow apps usually need 4-6 steps and enough files to cover the complete surface.
       - Do not create fake steps. If a task is small, keep the process small.
  6) Build obvious supporting features automatically:
       - Landing/SaaS: navbar, mobile menu, hero, features, benefits, pricing, FAQ, testimonials, CTA, footer, login, signup, forgot password, onboarding/dashboard preview.
       - Dashboard: sidebar/topbar, stats, filters/search, charts or visual summaries, recent activity, settings/profile preview, empty/loading states, responsive mobile layout.
       - Chat app: conversation sidebar, messages, send behavior, typing state, empty state, new chat flow, responsive layout.
       - Auth: login, signup, forgot password, validation, loading/errors, password visibility, reusable auth card.
       - Game: playable loop, controls, scoring, win/loss/reset, tuned visuals, instructions, pause/restart.
       - Tool/editor: validation, menus/tabs/dropdowns, saved/local state, empty/error/success states, responsive controls.
  7) Every button, menu, tab, modal, form, dropdown, sidebar, and navigation element you render must work locally with React state. Do not fake working UI.
  8) Use prompt-specific product judgement, sample data, copy, components, and visual direction. Avoid generic renamed templates.
  9) Verify with one <<<VIBE_RUN>>> card before the final SHIPPED block.

Hard rules:
  - The live preview must be the requested app/product itself. Do NOT build a landing page, marketing page, portfolio, explainer, or a page that merely describes the request unless the user explicitly asked for that.
  - Never build an explainer website about the user's request. If they ask for a calculator, render a calculator; if they ask for a game, render the playable game; if they ask for a landing page, render the landing page.
  - Include meaningful interactive state and controls when the requested product implies an app, tool, game, dashboard, editor, or workflow.
  - Avoid basic repeated UI. Pick a prompt-specific design direction, custom sample data, unique layout structure, and domain-specific interactions. The result must not look like the same preset with renamed text.
  - Animations must be purposeful and varied: use motion for state changes, feedback, transitions, or gameplay, not the same generic fade on every element.
  - NEVER use markdown triple-backtick fences. All code goes inside <<<VIBE_CODE>>> as raw source.
  - NEVER print decorative divider lines made of box-drawing characters.
  - Prose OUTSIDE delimiters must be short (≤1 sentence). Long reasoning belongs inside DEEP THINKING.
  - In <<<VIBE_CODE>>>, \`added\` must equal the number of lines in that code block (split on newlines); \`removed\` = lines removed when editing.
  - SANDBOX: every \`file\` and \`path\` MUST start with \`${vibeProjectRoot}/\`. The host strips and rejects anything outside that namespace, so do NOT use absolute paths, \`..\`, or pretend to edit Clyra's own source. The preview is mounted automatically from the sandbox; do not ask the user to start another dev server.
  - Aim for 2-4 useful thinking blocks (open / mid-reflection if needed / verify / shipped). Do not pad the stream with fake process steps.
  - Group tightly-related files into one step instead of reflecting between every file.
  - Each top-level export in your CODE blocks should have a one-line JSDoc above it for the build summary.
  - The final SHIPPED block must list the actual files created and the interactions/states that work.

Request details: ${userPrompt}`,
        },
      ];

      // Use deepseek-chat (non-reasoning) for the structured agent stream so the model spends
      // its entire output budget on the delimited timeline (thinking + analyze + code + ...)
      // instead of burning tokens on internal reasoning that we discard anyway.
      const vibeAbort = new AbortController();
      let acceptRemoteVibeChunks = true;
      let vibeTimeout: number | undefined;
      try {
        await Promise.race([
          streamOpenAI(
            VIBE_CURSOR_AGENT_SYSTEM_PROMPT,
            openAiMessages,
            (chunkText, isReasoning) => {
              if (!acceptRemoteVibeChunks || isReasoning) {
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
            vibeAbort.signal,
          ),
          new Promise<never>((_, reject) => {
            vibeTimeout = window.setTimeout(() => {
              acceptRemoteVibeChunks = false;
              vibeAbort.abort();
              reject(new Error("Vibe remote stream timed out"));
            }, 45000);
          }),
        ]);
      } finally {
        acceptRemoteVibeChunks = false;
        if (vibeTimeout !== undefined) window.clearTimeout(vibeTimeout);
      }

      const codeBlockMatches = full.match(/<<<VIBE_CODE\s+file="vibe-project\/[^"]+"/g) ?? [];
      if (
        codeBlockMatches.length < 4 ||
        !/<<<VIBE_CODE\s+file="vibe-project\/[^"]*\/src\/App\.tsx"/.test(
          full,
        )
      ) {
        throw new Error(
          "Vibe remote stream returned no complete sandbox preview",
        );
      }

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
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === streamChatId
            ? {
                ...chat,
                kind: "vibe",
                vibeRunning: false,
                vibeUnread: currentChatIdRef.current !== streamChatId,
                updatedAt: Date.now(),
              }
            : chat,
        ),
      );

      setTimeout(() => {
        const chatContainer = document.getElementById("chat-container");
        if (chatContainer && autoScroll) {
          chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 300);
    } catch (error) {
      console.warn("Vibe Coder switched to the local sandbox fallback:", error);
      const fallback = buildLocalVibeFallback(userPrompt);
      await streamLocalVibeFallback(aiMsgId, streamChatId, fallback);
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === streamChatId
            ? {
                ...chat,
                kind: "vibe",
                vibeRunning: false,
                vibeUnread: currentChatIdRef.current !== streamChatId,
                updatedAt: Date.now(),
              }
            : chat,
        ),
      );
    }
  };

  const handleAutoFix = useCallback(
    (error: { message: string; stack?: string; label?: string }) => {
      if (!currentChatIdRef.current || !vibePreviewMessageId) return;

      const errorPrompt = `The live preview encountered a ${error.label || "runtime"} error:
\`\`\`
${error.message}
${error.stack || ""}
\`\`\`
Please analyze the code you just wrote and fix this error.`;

      const userMsgId = Date.now().toString();
      const aiMsgId = (Date.now() + 1).toString();

      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          content: "I'm seeing an error in the preview. Can you fix it?",
        },
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
    },
    [vibePreviewMessageId, simulateVibeCoder],
  );

  const handlePreviewElementReference = useCallback(
    (label: string) => {
      const chatId = currentChatIdRef.current;
      if (!chatId) return;
      const clean = label.trim().slice(0, 160);
      if (!clean) return;
      const referenceMessage: Message = {
        id: `${Date.now()}-preview-ref`,
        role: "user",
        content: `Referenced preview element: ${clean}`,
      };
      patchMessagesForChat(chatId, (prev) => [...prev, referenceMessage]);
      setToastMessage("Preview element referenced in chat");
    },
    [patchMessagesForChat],
  );

  const handleSendMessage = async () => {
    if (value.trim() || selectedCommand) {
      setVibePreviewMessageId(null);
      setVibePreviewFiles(null);
      const userCommandLabel =
        selectedCommand?.label ??
        (activeWorkspaceTab === "vibe" ? "Vibe Coder" : undefined);
      const userCommandId =
        selectedCommand?.id ??
        (activeWorkspaceTab === "vibe" ? "vibe" : undefined);
      const rawUserText = value.trim();
      const vibeCommand = rawUserText.match(/^\/vibe(?:\s+(.+))?$/i);
      const clipCommand = rawUserText.match(/^\/clip(?:\s+(.+))?$/i);
      const browseCommand = rawUserText.match(/^\/browse(?:\s+(.+))?$/i);
      if (userCommandId === "clip" || clipCommand) {
        const clipCommandSource = clipCommand?.[1]?.trim() ?? rawUserText;
        setClipInitialUrl(
          clipCommandSource && !clipCommandSource.startsWith("/clip")
            ? clipCommandSource
            : "",
        );
        setSelectedCommand(
          commandSuggestions.find((command) => command.id === "clip") ?? null,
        );
        setValue("");
        adjustHeight(true);
        setRecentCommand(null);
        setShowCommandPalette(false);
        return;
      }
      if (userCommandId === "browse" || browseCommand) {
        const browseCommandSource = browseCommand?.[1]?.trim() ?? rawUserText;
        setBrowserInitialQuery(
          browseCommandSource && !browseCommandSource.startsWith("/browse")
            ? browseCommandSource
            : "",
        );
        setSelectedCommand(
          commandSuggestions.find((command) => command.id === "browse") ?? null,
        );
        setActiveWorkspaceTab("browser");
        setValue("");
        adjustHeight(true);
        setRecentCommand(null);
        setShowCommandPalette(false);
        return;
      }
      const userText =
        vibeCommand?.[1]?.trim() ||
        rawUserText ||
        (userCommandLabel ? `Execute ${userCommandLabel}` : "");
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

      const isVibeMode = userCommandId === "vibe" || Boolean(vibeCommand);
      setActiveWorkspaceTab(isVibeMode ? "vibe" : "chat");
      const userMessage: Message = {
        id: userMsgId,
        role: "user",
        content: userText,
      };
      const assistantMessage: Message = {
        id: aiMsgId,
        role: "assistant",
        content: "",
        isThinking: true,
        isStreaming: true,
        assistantKind: isVibeMode ? "vibe" : "chat",
        ...(isVibeMode ? { vibeUserPrompt: userText } : {}),
      };
      const nextMessages = [...currentMessages, userMessage, assistantMessage];

      chatNearBottomRef.current = true;
      setMessages(nextMessages);

      if (isVibeMode && chatId && !isTemporaryChat) {
        const projectTitle = buildVibeProjectTitle(userText);
        setChats((prev) => {
          const existing = prev.find((chat) => chat.id === chatId);
          const nextChat: ChatSession = {
            ...(existing ?? {
              id: chatId!,
              title: projectTitle,
              updatedAt: Date.now(),
              messages: [],
            }),
            title: existing?.title ?? projectTitle,
            messages: nextMessages,
            kind: "vibe",
            vibeRunning: true,
            vibeUnread: false,
            updatedAt: Date.now(),
          };
          return [nextChat, ...prev.filter((chat) => chat.id !== chatId)].sort(
            (a, b) => b.updatedAt - a.updatedAt,
          );
        });
      }

      setTimeout(() => {
        const chatContainer = document.getElementById("chat-container");
        if (chatContainer && autoScroll) {
          chatNearBottomRef.current = true;
          chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: "smooth",
          });
        }
      }, 100);

      try {
        if (isFirstMessage && !isTemporaryChat && chatId) {
          let generatedTitle = "";
          void streamOpenAI(
            "Generate a concise chat title of 4 words or fewer. Return only the title text, with no quotes and no punctuation unless needed.",
            [{ role: "user", content: userText }],
            (chunkText, isReasoning) => {
              if (!isReasoning) generatedTitle += chunkText;
            },
            0.2,
            48,
            "deepseek-chat",
          )
            .then(() => {
              const newTitle = generatedTitle.trim().replace(/^"|"$/g, "");
              if (!newTitle) return;
              setChats((prev) =>
                prev.map((c) =>
                  c.id === chatId ? { ...c, title: newTitle } : c,
                ),
              );
            })
            .catch((error) => {
              console.warn("DeepSeek title generation skipped:", error);
            });
        }

        if (isVibeMode && chatId) {
          simulateVibeCoder(aiMsgId, userText, chatId);
          return;
        }

        const contents = currentMessages.map((msg) => ({
          role: msg.role === "user" ? "user" : "model",
          parts: [{ text: msg.content }],
        }));
        contents.push({ role: "user", parts: [{ text: userText }] });

        try {
          let accumulatedText = "";
          let accumulatedReasoning = "";
          const openAiMessages = contents.map((c) => ({
            role: c.role === "model" ? "assistant" : c.role,
            content: c.parts[0].text,
          }));

          await streamOpenAI(
            systemPrompt.trim() !== ""
              ? systemPrompt.trim()
              : "Your name is Clyra, an AI assistant. Give helpful and appropriately detailed responses.",
            openAiMessages,
            (chunkText, isReasoning) => {
              if (isReasoning) {
                accumulatedReasoning += chunkText;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, reasoningContent: accumulatedReasoning }
                      : msg,
                  ),
                );
              } else {
                accumulatedText += chunkText;
                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === aiMsgId
                      ? { ...msg, content: accumulatedText, isThinking: false }
                      : msg,
                  ),
                );
              }
            },
            temperature,
          );

          // End of streaming
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? { ...msg, isStreaming: false, isThinking: false }
                : msg,
            ),
          );
        } catch (error) {
          console.error("Standard chat stream error:", error);
          setMessages((prev) =>
            prev.map((msg) =>
              msg.id === aiMsgId
                ? {
                    ...msg,
                    content:
                      "Sorry, I've hit a rate limit right now! Please try again in an hour or so. In the meantime, the UI works perfectly.",
                    isThinking: false,
                    isStreaming: false,
                  }
                : msg,
            ),
          );
        }
      } catch (error) {
        console.error("AI Error:", error);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === aiMsgId
              ? {
                  ...msg,
                  content:
                    "Sorry, I encountered an error while processing your request.",
                  isThinking: false,
                  isStreaming: false,
                }
              : msg,
          ),
        );
      }
    }
  };

  const handleAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length) {
      setAttachments((prev) => [...prev, ...files.map((file) => file.name)]);
      setIsInputExpanded(true);
    }
    event.target.value = "";
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const selectCommandSuggestion = (index: number) => {
    const selectedCmd = commandSuggestions[index];
    setSelectedCommand(selectedCmd);
    if (selectedCmd?.id === "vibe") {
      setActiveWorkspaceTab("vibe");
    } else if (selectedCmd?.id === "browse") {
      setActiveWorkspaceTab("browser");
    } else if (selectedCmd?.id !== "clip") {
      setActiveWorkspaceTab("chat");
    }
    setClipInitialUrl("");
    setBrowserInitialQuery("");
    setValue("");
    setShowCommandPalette(false);
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }, 50);
  };

  const isClipWorkspace = selectedCommand?.id === "clip";
  const isBrowserWorkspace =
    activeWorkspaceTab === "browser" || selectedCommand?.id === "browse";
  const isVibeWorkspace =
    activeWorkspaceTab === "vibe" && !isBrowserWorkspace && !isClipWorkspace;
  const showWorkspaceLivePreview = isVibeWorkspace && showVibeLivePreview;
  const workspaceViewKey = isClipWorkspace
    ? "clip"
    : isBrowserWorkspace
      ? "browser"
      : isVibeWorkspace
        ? "vibe"
        : "chat";
  const activeInputCommand =
    selectedCommand && selectedCommand.id !== "vibe" ? selectedCommand : null;
  const inputPlaceholder = isVibeWorkspace
    ? "Tell the coding agent what to build..."
    : "Ask Clyra anything...";
  const firstUserMessageId = messages.find(
    (message) => message.role === "user",
  )?.id;
  const emptyStateTitle = isVibeWorkspace
    ? "Clyra Vibe is ready."
    : "Hi there, I'm Clyra";
  const emptyStateSubtitle = isVibeWorkspace
    ? ""
    : "What can I help you with today?";
  const workflowTabs: Array<{
    id: WorkspaceTabId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "chat", label: "Chat", icon: MessageCircleDashed },
    { id: "vibe", label: "Vibe Coder", icon: SquarePen },
    { id: "browser", label: "Agentic Browser", icon: AppWindow },
  ];
  const sidebarWidthPx = 272;
  const sidebarClearancePx = sidebarWidthPx + 24;
  const centeredContentWidth =
    isClipWorkspace || isBrowserWorkspace || showWorkspaceLivePreview
      ? Math.min(viewportWidth, 1180)
      : Math.min(768, Math.max(0, viewportWidth - 32));
  const naturalContentGap = Math.max(
    0,
    (viewportWidth - centeredContentWidth) / 2,
  );
  const sidebarAvoidShift =
    isSidebarOpen && viewportWidth >= 760 && naturalContentGap < sidebarClearancePx
      ? Math.min(
          sidebarClearancePx - naturalContentGap,
          Math.max(0, naturalContentGap - 24),
        )
      : 0;
  const workspaceTravelPx =
    typeof window === "undefined"
      ? 1180
      : Math.max(1040, window.innerWidth * 1.04);
  const workspacePanelVariants = {
    enter: (direction: number) => ({
      opacity: 1,
      x: direction > 0 ? workspaceTravelPx : -workspaceTravelPx,
      scale: 0.95,
      filter: "blur(4px)",
    }),
    center: {
      opacity: 1,
      x: 0,
      y: 0,
      scale: 1,
      filter: "blur(0px)",
    },
    exit: (direction: number) => ({
      opacity: 1,
      x: direction > 0 ? -workspaceTravelPx : workspaceTravelPx,
      scale: 0.95,
      filter: "blur(4px)",
    }),
  };

  const chatQuickActions: Array<{
    baseLabel: string;
    skeletonLabel: string;
    prompt: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      baseLabel: "Plan a launch",
      skeletonLabel: "[for a new product]",
      prompt:
        "Help me create a crisp launch plan with priorities, risks, and next actions.",
      icon: Check,
    },
    {
      baseLabel: "Refine an idea",
      skeletonLabel: "[for a mobile app]",
      prompt: "Help me refine this idea into a polished product concept:",
      icon: MessageCircleDashed,
    },
    {
      baseLabel: "Draft something",
      skeletonLabel: "[like a blog post]",
      prompt: "Write a concise, professional draft for:",
      icon: SquarePen,
    },
  ];

  const vibeQuickActions: Array<{
    label: string;
    prompt: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    {
      label: "Agent dashboard",
      prompt:
        "Build a premium SaaS analytics dashboard with charts, filters, command actions, and a polished light theme.",
      icon: AppWindow,
    },
    {
      label: "Product launch",
      prompt:
        "Build a cinematic product landing page with a strong first viewport, refined sections, and responsive polish.",
      icon: SquarePen,
    },
    {
      label: "Smart tool",
      prompt:
        "Build a useful interactive web tool with clear controls, smooth states, and production-ready UI details.",
      icon: MousePointer2,
    },
  ];

  const [activeSkeletonText, setActiveSkeletonText] = useState<string | null>(null);
  const [isFadingInText, setIsFadingInText] = useState(false);

  const applyQuickPrompt = (prompt: string, skeleton?: string) => {
    setActiveWorkspaceTab("chat");
    setSelectedCommand(null);
    setIsInputExpanded(true);
    
    // Smooth fade in effect instead of typing
    setIsFadingInText(true);
    setValue(skeleton ? `${prompt} ${skeleton}` : prompt);
    if (skeleton) {
      setActiveSkeletonText(skeleton);
    } else {
      setActiveSkeletonText(null);
    }
    
    window.setTimeout(() => {
      textareaRef.current?.focus();
      // Select the skeleton text so user can just type over it
      if (skeleton && textareaRef.current) {
        const start = prompt.length + 1;
        const end = start + skeleton.length;
        textareaRef.current.setSelectionRange(start, end);
      }
      adjustHeight();
      setIsFadingInText(false);
    }, 50); // slight delay to allow React to render the text
  };

  const applyVibePrompt = (prompt: string) => {
    setActiveWorkspaceTab("vibe");
    setSelectedCommand(null);
    setValue(prompt);
    setIsInputExpanded(false);
    window.setTimeout(() => {
      textareaRef.current?.focus();
      adjustHeight(true);
    }, 30);
  };

  const handleWorkspaceTabChange = (tabId: WorkspaceTabId) => {
    if (tabId === activeWorkspaceTab) return;
    const currentIsVibeChat = messages.some(
      (message) => message.assistantKind === "vibe",
    );
    const fromIndex = WORKSPACE_TAB_ORDER.indexOf(activeWorkspaceTab);
    const toIndex = WORKSPACE_TAB_ORDER.indexOf(tabId);
    setWorkspaceTransitionDirection(toIndex > fromIndex ? 1 : -1);
    setIsWorkspaceSwitching(true);
    if (workspaceSwitchTimeoutRef.current != null) {
      window.clearTimeout(workspaceSwitchTimeoutRef.current);
    }
    workspaceSwitchTimeoutRef.current = window.setTimeout(() => {
      setIsWorkspaceSwitching(false);
      workspaceSwitchTimeoutRef.current = null;
    }, 620);
    setActiveWorkspaceTab(tabId);
    setSelectedCommand(null);
    setShowCommandPalette(false);
    setClipInitialUrl("");
    setBrowserInitialQuery("");
    setIsInputExpanded(false);
    adjustHeight(true);

    if (tabId === "vibe" && !currentIsVibeChat) {
      setMessages([]);
      setCurrentChatId(null);
    } else if (tabId === "chat" && currentIsVibeChat) {
      setMessages([]);
      setCurrentChatId(null);
      setVibePreviewMessageId(null);
      setVibePreviewFiles(null);
    }

    if (tabId === "browser") {
      setValue("");
      adjustHeight(true);
      return;
    }

    window.setTimeout(() => {
      textareaRef.current?.focus();
      adjustHeight();
    }, 50);
  };

  return (
    <FullscreenContext.Provider value={{ isFullscreen, setIsFullscreen }}>
      {theme === "Dark" && (
        <style
          dangerouslySetInnerHTML={{
            __html: `
                html { filter: invert(1) hue-rotate(180deg); background: #fff; }
                img, video, iframe, [data-invert-ignore] { filter: invert(1) hue-rotate(-180deg); }
                html:not([data-invert-ignore]) pre, html:not([data-invert-ignore]) code { filter: invert(1) hue-rotate(-180deg); }
                [data-invert-ignore] pre, [data-invert-ignore] code { filter: none !important; }
                .border-slate-200\\/60 { border-color: rgba(226, 232, 240, 0.4); }
                body { background: #fff; }
                /* Make grey text more visible (white) in dark mode */
                .text-slate-400, .text-slate-500, .text-slate-600 { color: #000 !important; }
                /* Remove all glow effects (inverted shadows) in dark mode except for AI orb */
                *:not(.clyra-ai-orb-shell):not(.clyra-ai-orb-shell *):not(.clyra-ai-orb):not(.clyra-ai-orb *) {
                    box-shadow: none !important;
                }
            `,
          }}
        />
      )}
      <motion.div 
        className="clyra-app-shell h-dvh flex min-w-0 bg-white text-slate-900 font-sans selection:bg-slate-200 overflow-hidden scalable-container relative"
        initial={{ opacity: 0, scale: 0.97, filter: "blur(12px)", y: 12 }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.05 }}
      >
        <motion.aside
          aria-hidden={!isSidebarOpen}
          initial={false}
          animate={
            isSidebarOpen
              ? {
                  x: 0,
                  scale: 1,
                  opacity: 1,
                  filter: "blur(0px)",
                }
              : {
                  x: -292,
                  scale: 1,
                  opacity: 1,
                  filter: "blur(0px)",
                }
          }
          transition={{
            type: "spring",
            stiffness: 210,
            damping: 31,
            mass: 0.78,
            opacity: { duration: 0 },
            filter: { duration: 0 },
            scale: { duration: 0 },
          }}
          className={cn(
            "clyra-sidebar-rail fixed inset-y-0 left-0 z-[120] flex w-[272px] shrink-0 flex-col overflow-hidden px-3 py-4 sm:px-3.5 sm:py-5",
            !isSidebarOpen && "clyra-sidebar-rail--closed pointer-events-none",
          )}
              style={{
                transformOrigin: "left center",
                willChange: "transform",
              }}
            >
              <div className="clyra-sidebar-panel w-[244px] h-full min-h-0 flex flex-col shrink-0">
                <div className="clyra-sidebar-section px-3 pb-2 pt-3 flex flex-col gap-1.5 shrink-0">
                  <div className="flex items-center justify-between h-9 -mt-0.5 -mb-0.5 pl-1 -mr-1">
                    <div className="flex items-center gap-2 text-[13px] font-semibold tracking-tight text-slate-700">
                      <span className="h-2 w-2 rounded-full bg-slate-900 shadow-[0_0_14px_rgba(15,23,42,0.18)]" />
                      Clyra
                    </div>
                    {isSidebarOpen && (
                      <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close sidebar"
                        title="Close sidebar"
                        className="clyra-sidebar-close group relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-[color,transform] duration-300 hover:scale-[1.04] hover:text-slate-900 active:scale-[0.94]"
                      >
                        <X className="pointer-events-none relative w-[15px] h-[15px] stroke-[2.2]" />
                      </button>
                    )}
                  </div>
                  <div className="px-1 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        setMessages([]);
                        setCurrentChatId(null);
                        setSelectedCommand(null);
                        setActiveWorkspaceTab("chat");
                        setClipInitialUrl("");
                        setBrowserInitialQuery("");
                        setVibePreviewMessageId(null);
                        setVibePreviewFiles(null);
                        setIsSidebarOpen(false);
                        setSearchQuery("");
                      }}
                      className="clyra-sidebar-action w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-700 transition-colors font-medium text-[13.5px]"
                    >
                      <SquarePen className="w-4 h-4 stroke-[2]" />
                      New chat
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowClipsLibrary(true);
                      }}
                      className="clyra-sidebar-action w-full flex items-center gap-3 px-2 py-2 mb-0.5 rounded-lg text-slate-700 transition-colors font-medium text-[13.5px]"
                    >
                      <Scissors className="w-4 h-4 stroke-[2]" />
                      <span className="flex-1 text-left">Clips</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsProjectsOpen((open) => !open)}
                      className="clyra-sidebar-action w-full flex items-center gap-3 px-2 py-2 rounded-lg text-slate-700 transition-colors font-medium text-[13.5px]"
                    >
                      <Folder className="w-4 h-4 stroke-[2]" />
                      <span className="flex-1 text-left">Projects</span>
                      {filteredProjectChats.some(
                        (chat) => chat.vibeRunning || chat.vibeUnread,
                      ) ? (
                        <span
                          className={cn(
                            "h-2 w-2 rounded-full",
                            filteredProjectChats.some(
                              (chat) => chat.vibeRunning,
                            )
                              ? "animate-pulse bg-black"
                              : "bg-blue-500",
                          )}
                        />
                      ) : null}
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-slate-400 transition-transform",
                          isProjectsOpen && "rotate-90",
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isProjectsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            type: "spring",
                            stiffness: 220,
                            damping: 34,
                            mass: 0.9,
                          }}
                          className="overflow-hidden pl-3"
                        >
                          <div className="mt-0.5 flex flex-col gap-0.5 pl-2">
                            {filteredProjectChats.length > 0 ? (
                              filteredProjectChats.slice(0, 8).map((chat) => (
                                <div
                                  key={`project-${chat.id}`}
                                  className={cn(
                                    "group relative flex w-full items-center gap-1 rounded-lg px-1.5 py-1 text-[12.5px] font-medium transition-colors",
                                    currentChatId === chat.id
                                      ? "clyra-sidebar-action--active text-slate-900"
                                      : "clyra-sidebar-action text-slate-500 hover:text-slate-800",
                                  )}
                                >
                                  {editingChatId === chat.id ? (
                                    <input
                                      type="text"
                                      value={editingTitle}
                                      onChange={(e) =>
                                        setEditingTitle(e.target.value)
                                      }
                                      className="clyra-sidebar-input min-w-0 flex-1 rounded-md px-2 py-1 text-[12.5px] font-medium text-slate-800 outline-none"
                                      autoFocus
                                      onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                          setChats((prev) =>
                                            prev.map((c) =>
                                              c.id === chat.id
                                                ? {
                                                    ...c,
                                                    title:
                                                      editingTitle || c.title,
                                                  }
                                                : c,
                                            ),
                                          );
                                          setEditingChatId(null);
                                        } else if (e.key === "Escape") {
                                          setEditingChatId(null);
                                        }
                                      }}
                                      onBlur={() => {
                                        setChats((prev) =>
                                          prev.map((c) =>
                                            c.id === chat.id
                                              ? {
                                                  ...c,
                                                  title:
                                                    editingTitle || c.title,
                                                }
                                              : c,
                                          ),
                                        );
                                        setEditingChatId(null);
                                      }}
                                    />
                                  ) : (
                                    <>
                                      <button
                                        type="button"
                                        onClick={() => openChatSession(chat)}
                                        className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-0.5 py-1 text-left"
                                      >
                                        <span
                                          className={cn(
                                            "clyra-sidebar-project-dot h-1.5 w-1.5 shrink-0 rounded-full",
                                            (currentChatId === chat.id ||
                                              chat.vibeRunning ||
                                              chat.vibeUnread) &&
                                              "clyra-sidebar-project-dot--visible",
                                            chat.vibeRunning
                                              ? "animate-pulse bg-black"
                                              : chat.vibeUnread
                                                ? "bg-blue-500"
                                                : "bg-slate-300",
                                          )}
                                        />
                                        <span className="min-w-0 flex-1 truncate">
                                          {chat.title}
                                        </span>
                                      </button>
                                      <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setEditingChatId(chat.id);
                                            setEditingTitle(chat.title);
                                          }}
                                          className="rounded-md p-1 text-slate-400 hover:bg-white/70 hover:text-slate-800"
                                          aria-label={`Rename ${chat.title}`}
                                          title="Rename project"
                                        >
                                          <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            setChats((prev) =>
                                              prev.filter(
                                                (c) => c.id !== chat.id,
                                              ),
                                            );
                                            if (currentChatId === chat.id) {
                                              setCurrentChatId(null);
                                              setMessages([]);
                                              setVibePreviewMessageId(null);
                                              setVibePreviewFiles(null);
                                            }
                                          }}
                                          className="rounded-md p-1 text-slate-400 hover:bg-white/70 hover:text-red-500"
                                          aria-label={`Delete ${chat.title}`}
                                          title="Delete project"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </button>
                                      </div>
                                    </>
                                  )}
                                </div>
                              ))
                            ) : (
                              <div className="px-2 py-1.5 text-[12px] font-medium text-slate-400">
                                No Vibe projects yet
                              </div>
                            )}
			                      </div>
			                    </motion.div>
		                  )}
		                </AnimatePresence>

	                  <button
                      type="button"
                      onClick={() => setIsSearchModalOpen(true)}
                      className="clyra-sidebar-action w-full flex items-center gap-3 px-2 py-2 mt-1.5 rounded-lg text-slate-700 transition-colors font-medium text-[13.5px]"
                    >
                      <Search className="w-4 h-4 stroke-[2]" />
                      <span className="flex-1 text-left">Search</span>
                      <kbd className="text-[11px] text-slate-400 font-medium bg-slate-100 px-1.5 py-0.5 rounded-md">⌘F</kbd>
                    </button>
	                </div>
	              </div>

	                <div className="scrollbar-none min-h-0 flex-1 overflow-y-auto flex flex-col p-2 space-y-3">
                  {filteredStandardChats.length > 0 ? (
                    <div className="flex flex-col gap-0.5">
                      <AnimatePresence mode="popLayout">
                        {filteredStandardChats.map((chat) => {
                          const matchedMessage = searchQuery
                            ? chat.messages.find((m) =>
                                m.content
                                  .toLowerCase()
                                  .includes(searchQuery.toLowerCase()),
                              )
                            : null;
                          const isTitleMatch = searchQuery
                            ? chat.title
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            : false;

                          return (
                            <motion.div
                              layout="position"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{
                                opacity: 0,
                                y: -20,
                                height: 0,
                                filter: "blur(4px)",
                              }}
                              transition={{
                                duration: 0.25,
                                type: "spring",
                                bounce: 0,
                                mass: 0.8,
                              }}
                              key={chat.id}
                              className={cn(
                                "group relative w-full px-3 py-2 rounded-[12px] transition-[background-color,color,box-shadow] cursor-pointer flex flex-col justify-center",
                                currentChatId === chat.id
                                  ? "clyra-sidebar-action--active text-[#0f0f0f]"
                                  : "clyra-sidebar-action text-slate-600 hover:text-[#0f0f0f]",
                              )}
                              onClick={() => {
                                if (editingChatId === chat.id) return;
                                openChatSession(chat);
                              }}
                            >
                              {editingChatId === chat.id ? (
                                <div className="flex w-full items-center gap-2">
                                  <input
                                    type="text"
                                    value={editingTitle}
                                    onChange={(e) =>
                                      setEditingTitle(e.target.value)
                                    }
                                    className="clyra-sidebar-input flex-1 outline-none rounded-md px-2 py-0.5 text-[13.5px] font-medium"
                                    autoFocus
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter") {
                                        setChats((prev) =>
                                          prev.map((c) =>
                                            c.id === chat.id
                                              ? {
                                                  ...c,
                                                  title:
                                                    editingTitle || c.title,
                                                }
                                              : c,
                                          ),
                                        );
                                        setEditingChatId(null);
                                      } else if (e.key === "Escape") {
                                        setEditingChatId(null);
                                      }
                                    }}
                                    onBlur={() => {
                                      setChats((prev) =>
                                        prev.map((c) =>
                                          c.id === chat.id
                                            ? {
                                                ...c,
                                                title: editingTitle || c.title,
                                              }
                                            : c,
                                        ),
                                      );
                                      setEditingChatId(null);
                                    }}
                                  />
                                </div>
                              ) : (
                                <>
                                  <div className="flex items-center w-full">
                                    <span className="flex-1 text-[13.5px] truncate font-medium pr-10">
                                      <HighlightText
                                        text={chat.title}
                                        highlight={searchQuery}
                                      />
                                    </span>
                                    <div className="absolute right-1 opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity pl-2">
                                      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/45 -left-6 w-6 pointer-events-none" />
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
                                          setChats((prev) =>
                                            prev.filter(
                                              (c) => c.id !== chat.id,
                                            ),
                                          );
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
                                  {searchQuery &&
                                    !isTitleMatch &&
                                    matchedMessage && (
                                      <div className="text-[11.5px] text-slate-400 truncate mt-0.5 pr-2 w-full">
                                        {matchedMessage.role === "user"
                                          ? "You: "
                                          : "AI: "}
                                        <HighlightText
                                          text={matchedMessage.content}
                                          highlight={searchQuery}
                                        />
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

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="clyra-sidebar-footer mx-2 mb-2 flex shrink-0 cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2.5 text-left transition-all duration-300 group"
                >
                  <div className="flex items-center justify-center p-1 rounded-full bg-transparent text-slate-400 group-hover:text-slate-600 transition-colors">
                    <Settings className="w-[18px] h-[18px] transition-transform duration-500 ease-out group-hover:rotate-90" />
                  </div>
                  <span className="flex-1 font-medium text-slate-500 group-hover:text-slate-700 transition-colors text-sm">
                    Settings
                  </span>
                </button>
              </div>
        </motion.aside>

        <div className="clyra-main-surface relative z-10 flex min-h-0 min-w-0 flex-1 flex-col bg-white sm:border-transparent">
          <AnimatePresence>
            {!isSidebarOpen && (
              <motion.button
                type="button"
                onClick={() => setIsSidebarOpen(true)}
                aria-label="Open sidebar"
                aria-expanded={false}
                title="Open sidebar"
                initial={{ opacity: 0, scale: 0.9, x: -8 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.9, x: -8 }}
                transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
                className="clyra-sidebar-toggle group fixed left-4 top-4 z-[180] flex h-11 w-11 items-center justify-center rounded-full border border-transparent bg-transparent text-slate-600 shadow-none transition-[color,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:scale-[1.05] hover:text-slate-900 active:scale-[0.94] sm:top-6 sm:left-6"
              >
                <span className="pointer-events-none relative block h-[12px] w-[18px] opacity-95">
                  <span className="pointer-events-none absolute left-0 top-0 h-[2px] w-full rounded-full bg-current" />
                  <span className="pointer-events-none absolute left-0 top-[5px] h-[2px] w-full rounded-full bg-current" />
                  <span className="pointer-events-none absolute left-0 top-[10px] h-[2px] w-full rounded-full bg-current" />
                </span>
              </motion.button>
            )}
          </AnimatePresence>
          <div className="relative z-[90] h-[52px] w-full shrink-0">
            <motion.div 
              className="absolute left-1/2 top-5 sm:top-6 -translate-x-1/2 z-50"
              initial={introState !== "complete" ? { y: -50 } : false}
              animate={{ y: introState === "complete" ? 0 : -50 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
              className={cn("clyra-workflow-tabs transition-opacity duration-700", introState === "complete" ? "opacity-100" : "opacity-0", theme === "Dark" && "dark-tabs")}
              role="tablist"
              aria-label="Clyra workspace"
              data-invert-ignore="true"
              onMouseLeave={() => setHoveredWorkspaceTab(null)}
              onBlur={(event) => {
                if (
                  !event.currentTarget.contains(
                    event.relatedTarget as Node | null,
                  )
                ) {
                  setHoveredWorkspaceTab(null);
                }
              }}
            >
              {workflowTabs.map((tabItem) => {
                const Icon = tabItem.icon;
                const isActive =
                  activeWorkspaceTab === tabItem.id && !isClipWorkspace;
                const isHovered =
                  hoveredWorkspaceTab === tabItem.id ||
                  (hoveredWorkspaceTab === null && isActive);

                return (
                  <button
                    key={tabItem.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleWorkspaceTabChange(tabItem.id)}
                    onMouseEnter={() => setHoveredWorkspaceTab(tabItem.id)}
                    onFocus={() => setHoveredWorkspaceTab(tabItem.id)}
                    className={cn(
                      "clyra-workflow-tab w-[105px] justify-center",
                      isActive && "clyra-workflow-tab--active",
                    )}
                  >
                    {isHovered && (
                      <motion.span
                        layoutId="hover-workflow-tab"
                        className="clyra-workflow-tab__hover"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 34,
                          mass: 0.62,
                        }}
                      />
                    )}
                    <Icon className="relative h-4 w-4 shrink-0" />
                    <span className="relative truncate">{tabItem.label}</span>
                  </button>
                );
	              })}
	            </div>
            </motion.div>
	        </div>
          <motion.div
            className="clyra-screen-stage relative flex min-h-0 min-w-0 flex-1 flex-col"
            animate={{ x: sidebarAvoidShift }}
            transition={{
              type: "spring",
              stiffness: 220,
              damping: 34,
              mass: 0.9,
            }}
            style={{
              willChange: "transform",
            }}
          >
          <AnimatePresence>
            {(messages.length === 0 || isTemporaryChat) &&
              !isBrowserWorkspace &&
              !isClipWorkspace && (
                <motion.button
                  type="button"
                  initial={{ opacity: 0, scale: 0.9, x: 10, y: -4 }}
                  animate={{ opacity: introState === "complete" ? 1 : 0, scale: 1, x: 0, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, x: 10, y: -4 }}
                  transition={{
                    type: "spring",
                    stiffness: 360,
                    damping: 30,
                    mass: 0.72,
	                  }}
                  onClick={() => {
                    if (messages.length > 0 && isTemporaryChat) {
                      setIsTemporaryChat(false);
                      setToastMessage("Chat saved to history");
                    } else {
                      setIsTemporaryChat(!isTemporaryChat);
                    }
                  }}
                  className={cn(
                    "clyra-temp-chat-toggle fixed right-5 z-[170] grid h-10 w-10 place-items-center rounded-full text-slate-500 transition-[color,transform] duration-300 hover:scale-[1.04] hover:text-slate-900 active:scale-[0.94] sm:right-7 lg:right-9",
                    isTemporaryChat && "text-slate-900",
                  )}
                  title={
                    isTemporaryChat
                      ? "Turn off Temporary Chat"
                      : "Temporary Chat"
                  }
                  aria-label={
                    isTemporaryChat
                      ? "Turn off Temporary Chat"
                      : "Temporary Chat"
                  }
                >
                  <MessageCircleDashed
                    className={cn(
                      "relative h-5 w-5 stroke-[1.6] transition-all duration-300",
                      isTemporaryChat ? "opacity-100 scale-105" : "opacity-75",
                    )}
                  />
                  <AnimatePresence>
                    {isTemporaryChat && (
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{
                          type: "spring",
                          stiffness: 360,
                          damping: 24,
                          mass: 0.7,
                        }}
                        className="pointer-events-none absolute inset-0 flex items-center justify-center"
                      >
                        <Check className="h-3.5 w-3.5 stroke-[2.4] text-slate-900" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              )}
          </AnimatePresence>
          <div
            className={cn(
              "grid min-h-0 w-full flex-1 overflow-hidden transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              showWorkspaceLivePreview
                ? "grid-cols-[minmax(260px,min(420px,34vw))_minmax(0,1fr)]"
                : "grid-cols-[minmax(0,1fr)_0fr]",
            )}
          >
	            <div
	              className={cn(
	                "clyra-workspace-scene relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden",
	                showWorkspaceLivePreview && "border-r border-slate-200/70",
	              )}
	            >
                  {bgAnimEnabled && (
                    <div className="pointer-events-none absolute inset-[-20%] z-0 overflow-hidden clyra-fluid-bg-container">
                      <div 
                        className="clyra-fluid-blob clyra-fluid-blob-1"
                        style={{ backgroundColor: bgAnimColor }}
                      />
                      <div 
                        className="clyra-fluid-blob clyra-fluid-blob-2"
                        style={{ backgroundColor: bgAnimColor }}
                      />
                      <div 
                        className="clyra-fluid-blob clyra-fluid-blob-3"
                        style={{ backgroundColor: bgAnimColor }}
                      />
                    </div>
                  )}
	              <div
                className={cn(
                  "relative z-10 flex flex-col h-full min-h-0 w-full",
                  showWorkspaceLivePreview
                    ? "min-w-0 flex-1 px-3 sm:px-4"
                    : isClipWorkspace || isBrowserWorkspace
                      ? "max-w-none mx-0"
                      : "max-w-3xl mx-auto",
                  isClipWorkspace || isBrowserWorkspace
                    ? "px-0 sm:px-0"
                    : messages.length === 0
                      ? "justify-center px-5 sm:px-8"
                      : cn(
                          "pt-3 sm:pt-4",
                          showWorkspaceLivePreview
                            ? "px-3 sm:px-4"
                            : "px-5 sm:px-8",
                        ),
                )}
              >
                <AnimatePresence
                  initial={false}
                  custom={workspaceTransitionDirection}
                >
                <motion.div
                  key={workspaceViewKey}
                  custom={workspaceTransitionDirection}
                  variants={workspacePanelVariants}
                  className={cn(
                    "clyra-workspace-card absolute inset-0 flex flex-col transform-gpu",
                    messages.length === 0 &&
                      !isClipWorkspace &&
                      !isBrowserWorkspace &&
                      "justify-center",
                  )}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    type: "spring",
                    stiffness: 350,
                    damping: 34,
                    mass: 0.8,
                  }}
                    style={{
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {isClipWorkspace ? (
                      <AIClipper
                        initialUrl={clipInitialUrl}
                        onClose={() => {
                          setSelectedCommand(null);
                          setClipInitialUrl("");
                          setActiveWorkspaceTab("chat");
                        }}
                      />
                    ) : isBrowserWorkspace ? (
                      <AgenticBrowser
                        initialQuery={browserInitialQuery}
                        onClose={() => {
                          setSelectedCommand(null);
                          setBrowserInitialQuery("");
                          setActiveWorkspaceTab("chat");
                        }}
                      />
                    ) : messages.length === 0 ? (
	                      <motion.div
	                        initial={isWorkspaceSwitching ? false : {
	                          opacity: 0,
	                          y: 14,
	                          scale: 0.985,
	                          filter: "blur(8px)",
	                        }}
                        animate={{
                          opacity: 1,
                          y: 0,
                          scale: 1,
                          filter: "blur(0px)",
                        }}
                        transition={{
                          duration: 0.65,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                        className="text-center space-y-3 mb-7 flex flex-col items-center"
                      >
	                        <motion.div
	                          className="mb-2 flex w-full justify-center relative"
	                          initial={isWorkspaceSwitching ? false : introState !== "complete" ? { y: 150 } : false}
                          animate={introState === "progress_complete" || introState === "input_circle" || introState === "input_expand" || introState === "complete" ? { y: 0 } : { y: 150 }}
                          transition={{
                            duration: 0.8,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                        >
                          <AiOrb colorTheme={orbColorTheme} />
                          <AnimatePresence>
                            {(introState === "progress" || introState === "input_circle" || introState === "input_expand") && (
                              <motion.div 
                                className="absolute top-full left-1/2 -translate-x-1/2 mt-10 flex flex-col items-center gap-4 w-56"
                                initial={{ opacity: 0, y: 15, filter: "blur(4px)" }}
                                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                                exit={{ opacity: 0, y: -10, scale: 0.95, filter: "blur(4px)" }}
                                transition={{ duration: 0.6 }}
                              >
                                <div className="h-[3px] w-full bg-slate-200/60 rounded-full overflow-hidden shadow-inner">
                                  <motion.div 
                                    className="h-full bg-slate-800 rounded-full shadow-[0_0_8px_rgba(30,41,59,0.5)]"
                                    initial={{ width: "0%" }}
                                    animate={{ width: "100%" }}
                                    transition={{ duration: progressDuration, ease: [0.25, 1, 0.5, 1] }}
                                  />
                                </div>
                                <motion.span 
                                  key={introProgressText}
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="text-[11px] font-medium text-slate-400 tracking-widest uppercase font-mono"
                                >
                                  {introProgressText}
                                </motion.span>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
	                        <motion.h1
	                          className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-800"
                          animate={{
                            opacity: introState === "complete" ? 1 : 0,
                            y: introState === "complete" ? 0 : 10,
                            scale: introState === "complete" ? 1 : 0.96,
                            filter: introState === "complete" ? "blur(0px)" : "blur(6px)",
                          }}
                          transition={{
                            duration: 0.7,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                        >
                          {emptyStateTitle}
                        </motion.h1>
	                        <motion.div
	                          className="flex flex-col items-center"
	                        >
	                          <motion.p
	                            className="text-slate-500 text-sm sm:text-base font-medium font-sans z-10 relative"
                            animate={{ 
                              opacity: introState === "complete" ? 1 : 0, 
                              y: introState === "complete" ? 0 : 8, 
                              filter: introState === "complete" ? "blur(0px)" : "blur(5px)" 
                            }}
                            transition={{
                              duration: 0.6,
                              ease: [0.22, 1, 0.36, 1],
                            }}
                          >
                            {emptyStateSubtitle}
                          </motion.p>
                          
                          {!isVibeWorkspace && (
	                            <motion.div
	                              className="clyra-chat-quick-actions mt-4"
	                              initial="hidden"
                                animate="visible"
                                variants={{
                                  hidden: { opacity: 0 },
                                  visible: {
                                    opacity: 1,
                                    transition: {
                                      staggerChildren: 0.12,
                                      delayChildren: 0.2,
                                    }
                                  }
                                }}
                             >
                               {chatQuickActions.map((action) => {
                                 const QuickIcon = action.icon;

                                 return (
                                    <motion.button
                                      variants={{
                                        hidden: { opacity: 0, y: 15, filter: "blur(4px)" },
                                        visible: { opacity: introState === "complete" ? 1 : 0, y: introState === "complete" ? 0 : 15, filter: introState === "complete" ? "blur(0px)" : "blur(4px)", transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } }
                                      }}
                                      key={action.baseLabel}
                                      type="button"
                                      className="clyra-chat-chip group"
                                      onClick={() =>
                                        applyQuickPrompt(action.prompt, action.skeletonLabel)
                                      }
                                    >
                                      <QuickIcon className="h-3.5 w-3.5" />
                                      <span>{action.baseLabel}</span>
                                    </motion.button>
                                 );
                               })}
                             </motion.div>
                          )}
                          <AnimatePresence>
                            {isTemporaryChat && (
                              <motion.div
                                initial={{ opacity: 0, y: -20, height: 0 }}
                                animate={{ opacity: 1, y: 0, height: "auto" }}
                                exit={{ opacity: 0, y: -20, height: 0 }}
                                transition={{
                                  duration: 0.3,
                                  ease: "easeInOut",
                                }}
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
                      <div className="relative flex flex-1 w-full overflow-hidden z-0">
                        <div
                          className={cn("flex flex-1 flex-col transition-opacity duration-700", introState === "complete" ? "opacity-100" : "opacity-0")}
                          id="chat-container"
                        >
                        {messages.map((message) => {
                          const fontClass =
                            fontSize === "Small"
                              ? "text-[14px] leading-relaxed"
                              : fontSize === "Large"
                                ? "text-[18px] leading-loose"
                                : "text-[15px] sm:text-[16px] leading-relaxed";
                          const isLastAssistant =
                            message.role === "assistant" &&
                            lastAssistantId != null &&
                            message.id === lastAssistantId;
                          return (
                            <motion.div
                              key={message.id}
                              initial={{ opacity: 0, y: 15, scale: 0.98 }}
                              animate={{ opacity: 1, y: 0, scale: 1 }}
                              transition={{
                                type: "spring",
                                stiffness: 220,
                                damping: 34,
                                mass: 0.9,
                              }}
                              className={cn(
                                "flex w-full",
                                message.role === "user"
                                  ? "justify-end"
                                  : "justify-start",
                              )}
                            >
                              {message.role === "user" ? (
                                <div
                                  data-invert-ignore="true"
                                  className={cn(
                                    "clyra-chat-user-bubble px-5 py-3.5 rounded-[24px] max-w-[85%] sm:max-w-[75%] border border-slate-200/60 whitespace-pre-wrap",
                                    message.id === firstUserMessageId &&
                                      "clyra-chat-user-bubble--first",
                                    fontClass,
                                  )}
                                  style={{
                                    backgroundColor: userBubbleColor,
                                    color: "#1e293b",
                                  }}
                                >
                                  <UserMessageText text={message.content} />
                                </div>
                              ) : (
                                <div
                                  data-invert-ignore={
                                    theme === "Dark" ? "true" : undefined
                                  }
                                  className="px-1 py-1 w-full flex items-start gap-3"
                                  style={{
                                    color:
                                      theme === "Dark" ? "#e2e8f0" : "#1e293b",
                                  }}
                                >
                                  <div
                                    className={cn(
                                      "clyra-assistant-message",
                                      message.assistantKind === "vibe" &&
                                        "clyra-assistant-message--vibe",
                                    )}
                                  >
                                    <AnimatedMessage
                                      messageId={message.id}
                                      content={message.content}
                                      isThinking={message.isThinking}
                                      isStreaming={message.isStreaming}
                                      reasoningContent={
                                        message.reasoningContent
                                      }
                                      vibeUserPrompt={message.vibeUserPrompt}
                                      fontSizeClass={fontClass}
                                      markdownSupport={markdownSupport}
                                      codeHighlighting={codeHighlighting}
                                      assistantKind={
                                        message.assistantKind === "vibe"
                                          ? "vibe"
                                          : "chat"
                                      }
                                      isLastAssistant={isLastAssistant}
                                      onVibePreviewReady={
                                        handleVibePreviewReady
                                      }
                                    />
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                    <AnimatePresence initial={false}>
                      {!isFullscreen && !isClipWorkspace && !isBrowserWorkspace && (
                        <motion.div
                      key="composer"
                      ref={inputContainerRef}
                      onClick={() => {
                        if (!isInputExpanded && isVibeWorkspace) {
                          setIsInputExpanded(true);
                        }
                      }}
		                      initial={false}
		                      animate={{
		                        opacity: 1,
	                          x: 0,
                          y: 0,
	                          scale: 1,
		                      }}
		                      exit={{
		                        opacity: 1,
                          y: 0,
                          scale: 1,
                        pointerEvents: "none",
                      }}
                      transition={{
                        type: "tween",
		                        duration: 0,
		                        ease: [0.22, 1, 0.36, 1],
                      }}
                      style={{
                        transformStyle: "preserve-3d",
                        backfaceVisibility: "hidden",
                      }}
                      className={cn(
                        "clyra-composer-transition w-full shrink-0 relative z-20 transition-all duration-300",
                        messages.length === 0
                          ? "max-w-2xl mx-auto pb-0 mb-8"
                          : "pb-4 sm:pb-6 mb-3",
                      )}
                    >
                      <motion.div
                        className={cn(
                          "input-wrapper relative backdrop-blur-xl border transition-[background-color,border-color,padding] duration-300 cursor-text overflow-hidden mx-auto z-[3]",
                          theme === "Dark" ? "bg-slate-200/90 border-slate-400/50" : "bg-white/80 border-slate-200/60",
                          isExpanded ? "p-2 sm:p-3" : "p-1.5 sm:p-2",
                          (introState === "booting" || introState === "progress" || introState === "progress_complete") ? "opacity-0" : "opacity-100"
                        )}
                        initial={isWorkspaceSwitching ? false : introState !== "complete" ? { width: 48, height: 48, borderRadius: 24 } : false}
                        animate={{ 
                          width: (introState === "booting" || introState === "progress" || introState === "input_circle") ? 48 : "100%",
                          height: (introState === "booting" || introState === "progress" || introState === "input_circle") ? 48 : "auto",
                          borderRadius: (introState === "booting" || introState === "progress" || introState === "input_circle") ? 24 : (isExpanded ? 32 : 40),
                        }}
                        transition={{ type: "spring", stiffness: 120, damping: 20, mass: 1 }}
                      >
                        <div className={cn("relative z-10 w-full h-full transition-opacity duration-700", (introState === "booting" || introState === "progress" || introState === "progress_complete" || introState === "input_circle") ? "opacity-0 pointer-events-none" : "opacity-100")}>
                          <AnimatePresence>
                            {commandPaletteEnabled && showCommandPalette && (
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
                                  {filteredSuggestions.map(
                                    (suggestion, index) => {
                                      const originalIndex =
                                        commandSuggestions.findIndex(
                                          (c) => c.prefix === suggestion.prefix,
                                        );
                                      return (
                                        <motion.div
                                          key={suggestion.prefix}
                                          className={cn(
                                            "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors cursor-pointer",
                                            activeSuggestion === index
                                              ? "bg-slate-100 text-slate-900"
                                              : "text-slate-600 hover:bg-slate-50/50 hover:text-slate-900",
                                          )}
                                          onClick={() =>
                                            selectCommandSuggestion(
                                              originalIndex,
                                            )
                                          }
                                          onMouseEnter={() =>
                                            setActiveSuggestion(index)
                                          }
                                        >
                                          <div
                                            className={cn(
                                              "w-7 h-7 rounded-md flex items-center justify-center transition-colors shrink-0",
                                              activeSuggestion === index
                                                ? "bg-slate-50 shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200"
                                                : "bg-slate-50/50 text-slate-500 border border-transparent",
                                            )}
                                          >
                                            {suggestion.icon(
                                              activeSuggestion === index,
                                            )}
                                          </div>
                                          <div className="flex-1 flex flex-col items-start leading-snug truncate">
                                            <span className="font-medium truncate w-full">
                                              {commandQuery ? (
                                                <>
                                                  {suggestion.label.substring(
                                                    0,
                                                    suggestion.label
                                                      .toLowerCase()
                                                      .indexOf(commandQuery),
                                                  )}
                                                  <span className="text-blue-500">
                                                    {suggestion.label.substring(
                                                      suggestion.label
                                                        .toLowerCase()
                                                        .indexOf(commandQuery),
                                                      suggestion.label
                                                        .toLowerCase()
                                                        .indexOf(commandQuery) +
                                                        commandQuery.length,
                                                    )}
                                                  </span>
                                                  {suggestion.label.substring(
                                                    suggestion.label
                                                      .toLowerCase()
                                                      .indexOf(commandQuery) +
                                                      commandQuery.length,
                                                  )}
                                                </>
                                              ) : (
                                                suggestion.label
                                              )}
                                            </span>
                                            <span className="text-slate-400 text-xs hidden sm:block truncate w-full">
                                              {suggestion.description}
                                            </span>
                                          </div>
                                        </motion.div>
                                      );
                                    },
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>

                          <div className={cn(
                            isExpanded ? "px-3 py-1" : "flex items-center gap-1 px-2 py-0.5"
                          )}>
                            <input
                              ref={fileInputRef}
                              type="file"
                              multiple
                              className="hidden"
                              onChange={handleFilesSelected}
                            />
                            {!isExpanded && (
                              <motion.button
                                type="button"
                                onClick={handleAttachFile}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={cn("p-2 text-slate-500 hover:text-slate-800 rounded-full transition-all duration-700 flex items-center justify-center shrink-0", introState === "complete" ? "opacity-100" : "opacity-0")}
                                aria-label="Attach files"
                                title="Attach files"
                              >
                                <Paperclip className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                              </motion.button>
                            )}
                            <Textarea
                              ref={textareaRef}
                              rows={1}
                              value={value}
                              onChange={(e) => {
                                setValue(e.target.value);
                                adjustHeight();
                              }}
                              onKeyDown={handleKeyDown}
                              onFocus={() => {
                                if (isVibeWorkspace) {
                                  setIsInputExpanded(true);
                                }
                                adjustHeight();
                              }}
                              placeholder={inputPlaceholder}
                              containerClassName="w-full"
                              className={cn(
                                "resize-none overflow-y-auto overflow-x-hidden bg-transparent outline-none disabled:opacity-50",
                                "text-[15px] leading-relaxed sm:text-lg font-medium transition-colors",
                                theme === "Dark" ? "placeholder:text-slate-500 text-slate-900" : "placeholder:text-slate-400 text-slate-800",
                                isExpanded
                                  ? "min-h-[50px] max-h-[35vh] py-3 px-1"
                                  : "min-h-[40px] max-h-[35vh] py-2 px-1",
                                "scrollbar-none transition-all duration-300",
                                isFadingInText ? "opacity-0 translate-y-1 scale-95" : "opacity-100 translate-y-0 scale-100"
                              )}
                            />
                            {!isExpanded && (
                              <motion.button
                                type="button"
                                onClick={handleSendMessage}
                                aria-label="Send message"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                disabled={
                                  value.trim().length === 0 &&
                                  !selectedCommand
                                }
                                className={cn(
                                  "p-2 rounded-full transition-all duration-700 shrink-0",
                                  "flex items-center justify-center",
                                  introState === "complete" ? "opacity-100" : "opacity-0",
                                  value.trim() || selectedCommand
                                    ? "bg-slate-900 text-white hover:bg-slate-800"
                                    : "bg-slate-100 text-slate-400 cursor-not-allowed",
                                )}
                              >
                                <ArrowUpIcon className="w-4.5 h-4.5" />
                              </motion.button>
                            )}
                          </div>

                          <AnimatePresence>
                            {attachments.length > 0 && (
                              <motion.div
                                className="clyra-attachments-row px-4 pb-3 flex gap-2 flex-wrap"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                {attachments.map((file, index) => (
                                  <motion.div
                                    key={index}
                                    className="clyra-file-chip flex items-center gap-2 text-xs font-medium py-1.5 px-3 rounded-xl text-slate-600"
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

                          {isExpanded && (
                          <div
                                className={cn(
                                  "flex items-center justify-between p-2 pt-0",
                                  
                                )}
                              >
                                <div className="flex items-center gap-1 sm:gap-2">
                                  <motion.button
                                    type="button"
                                    onClick={handleAttachFile}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    className="clyra-file-trigger p-2 sm:p-2.5 text-slate-500 hover:text-slate-800 rounded-full transition-colors flex items-center justify-center shrink-0 backdrop-blur-sm backdrop-saturate-125"
                                    aria-label="Attach files"
                                    title="Attach files"
                                  >
                                    <Paperclip className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                                  </motion.button>

                                  <AnimatePresence>
                                    {activeInputCommand && (
                                      <motion.div
                                        layout
                                        initial={{
                                          opacity: 0,
                                          scale: 0.9,
                                          filter: "blur(4px)",
                                        }}
                                        animate={{
                                          opacity: 1,
                                          scale: 1,
                                          filter: "blur(0px)",
                                        }}
                                        exit={{
                                          opacity: 0,
                                          scale: 0.9,
                                          filter: "blur(4px)",
                                        }}
                                        transition={{
                                          type: "spring",
                                          bounce: 0,
                                          duration: 0.3,
                                        }}
                                        className="flex items-center gap-1.5 text-slate-700 px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold ml-1 hover:bg-slate-100/80 transition-colors cursor-default"
                                      >
                                        <span className="opacity-70">
                                          {activeInputCommand.icon(false)}
                                        </span>
                                        <span className="hidden sm:inline-block">
                                          {activeInputCommand.label}
                                        </span>
                                        <button
                                          onClick={() => {
                                            setSelectedCommand(null);
                                            if (isVibeWorkspace) {
                                              setActiveWorkspaceTab("chat");
                                            }
                                          }}
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
                                    {commandPaletteEnabled &&
                                    (value.trim() || selectedCommand) ? (
                                      <motion.div
                                        key="send-hint"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 5 }}
                                        className="hidden sm:flex items-center gap-2 text-[10px] text-slate-400/80 font-medium mr-1"
                                      >
                                        <span className="flex items-center gap-1">
                                          <kbd className="font-sans px-1 py-[1.5px] rounded-sm bg-slate-100/50 border border-slate-200/50 shadow-[0_1px_0.5px_rgba(0,0,0,0.02)] text-slate-400">
                                            Esc
                                          </kbd>
                                          to clear
                                        </span>
                                        <span className="text-slate-300">
                                          •
                                        </span>
                                        <span className="flex items-center gap-1">
                                          <kbd className="font-sans px-1 py-[1.5px] rounded-sm bg-slate-100/50 border border-slate-200/50 shadow-[0_1px_0.5px_rgba(0,0,0,0.02)] text-slate-400">
                                            ↵
                                          </kbd>
                                          to send
                                        </span>
                                      </motion.div>
                                    ) : commandPaletteEnabled ? (
                                      <motion.div
                                        key="cmd-hint"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 5 }}
                                        className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400/80 font-medium mr-1"
                                      >
                                        <span className="flex items-center gap-1">
                                          <kbd className="font-sans px-1 py-[1.5px] rounded-sm bg-slate-100/50 border border-slate-200/50 shadow-[0_1px_0.5px_rgba(0,0,0,0.02)] text-slate-400">
                                            Ctrl/⌘K
                                          </kbd>
                                          for commands
                                        </span>
                                      </motion.div>
                                    ) : null}
                                  </AnimatePresence>
                                  <motion.button
                                    type="button"
                                    onClick={handleSendMessage}
                                    aria-label="Send message"
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    disabled={
                                      value.trim().length === 0 &&
                                      !selectedCommand
                                    }
                                    className={cn(
                                      "p-2.5 rounded-full transition-all duration-200 shrink-0",
                                      "flex items-center justify-center shadow-sm",
                                      value.trim() || selectedCommand
                                        ? "bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:shadow-lg"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed",
                                    )}
                                  >
                                    <ArrowUpIcon className="w-5 h-5" />
                                  </motion.button>
                                </div>
                    </div>
                          )}
                          </div>
                        </motion.div>
		                    </motion.div>
	                  )}
	                </AnimatePresence>
                  </motion.div>
                </AnimatePresence>
	              </div>
            </div>
            <div
              className={cn(
                "flex min-h-0 min-w-0 flex-col overflow-hidden bg-white transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                showWorkspaceLivePreview
                  ? "pointer-events-auto opacity-100"
                  : "pointer-events-none opacity-0",
              )}
              aria-hidden={!showWorkspaceLivePreview}
            >
              {showWorkspaceLivePreview ? (
                <VibeLivePreviewPanel
                  filesByPath={vibePreviewFiles!}
                  onAutoFix={handleAutoFix}
                  setToastMessage={setToastMessage}
                  onReferenceElement={handlePreviewElementReference}
                />
              ) : null}
	            </div>
	          </div>
          </motion.div>
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
                  mass: 0.8,
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
                  <span className="font-semibold text-slate-800 tracking-tight leading-tight mb-[3px]">
                    Temporary chat disabled
                  </span>
                  <span className="text-slate-500 text-[13px] leading-tight font-normal">
                    This conversation is saved to your history.
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
      
      <ChatSearchModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={(id) => {
          handleChatSelect(id);
          setIsSearchModalOpen(false);
        }}
        onNewChat={() => {
          handleNewChat();
          setIsSearchModalOpen(false);
        }}
      />
<SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        theme={theme}
        setTheme={setTheme}
        sendOnEnter={sendOnEnter}
        setSendOnEnter={setSendOnEnter}
        fontSize={fontSize}
        setFontSize={setFontSize}
        autoScroll={autoScroll}
        setAutoScroll={setAutoScroll}
        animationSpeed={animationSpeed}
        setAnimationSpeed={setAnimationSpeed}
        codeHighlighting={codeHighlighting}
        setCodeHighlighting={setCodeHighlighting}
        markdownSupport={markdownSupport}
        setMarkdownSupport={setMarkdownSupport}
        systemPrompt={systemPrompt}
        setSystemPrompt={setSystemPrompt}
        temperature={temperature}
        setTemperature={setTemperature}
        userBubbleColor={userBubbleColor}
        setUserBubbleColor={setUserBubbleColor}
        orbColorTheme={orbColorTheme}
        setOrbColorTheme={setOrbColorTheme}
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
  signal?: AbortSignal,
) {
  const formattedMessages = systemInstruction
    ? [{ role: "system", content: systemInstruction }, ...messages]
    : messages;

  const response = await fetch("/api/deepseek/chat", {
    method: "POST",
    signal,
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: formattedMessages,
      temperature,
      stream: true,
      max_tokens: maxTokens,
    }),
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
