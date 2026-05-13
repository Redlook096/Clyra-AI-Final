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
  ChevronRight,
  Eye,
  EyeOff,
  FileUp,
  Folder,
  MessageCircleDashed,
  MousePointer2,
  Paperclip,
  Pencil,
  Play,
  Scissors,
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
import {
  extractVibeFilesFromContent,
  sanitizeVibeAgentContent,
} from "./lib/parseVibeAgentContent";
import AIClipper from "@/components/AIClipper";

let geminiSingleton: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return null;
  geminiSingleton ??= new GoogleGenAI({ apiKey: key });
  return geminiSingleton;
}

function getVibeProjectRootFromFileMap(files: Record<string, string>) {
  const firstPath = Object.keys(files).find((path) =>
    path.startsWith("vibe-project/"),
  );
  if (!firstPath) return null;
  const parts = firstPath.split("/").filter(Boolean);
  if (parts.length >= 3 && parts[0] === "vibe-project") {
    return `${parts[0]}/${parts[1]}`;
  }
  return "vibe-project/project";
}

function hasGenericFallbackVibeSurface(files: Record<string, string>) {
  const joined = Object.entries(files)
    .map(([path, body]) => `${path}\n${body.slice(0, 4000)}`)
    .join("\n")
    .toLowerCase();
  return (
    joined.includes("customprojectsurface") || joined.includes("product-brief")
  );
}

function hasCompleteVibeSourceSet(files: Record<string, string>) {
  const sourcePaths = Object.keys(files).filter((path) =>
    /\/src\/.*\.(tsx|ts|jsx|js)$/i.test(path),
  );
  return (
    sourcePaths.some((path) => /\/src\/App\.tsx$/i.test(path)) &&
    sourcePaths.length >= 3
  );
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
  onVibePreviewReady?: (
    messageId: string,
    filesByPath: Record<string, string>,
  ) => void;
}) => {
  const isVibe = assistantKind === "vibe";
  /** Vibe agent now drives its own thought UI from the model's <<<VIBE_THINKING>>> blocks. While we have no
   *  content yet, show the unified "Thinking" shimmer so the seam into the inline VibeThoughtPanel is clean. */
  const suppressVibeAnswerBody = isVibe && !!isThinking && content.length === 0;
  return (
    <div
      className={cn(
        "pt-0.5 font-medium text-inherit w-full relative flex flex-col gap-2",
        fontSizeClass,
      )}
    >
      <ChatThinkingLabel
        isThinking={!!isThinking}
        isStreaming={!!isStreaming}
        content={content}
      />
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
            "flex w-full bg-transparent px-4 py-3 text-base text-slate-800",
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

const sameFileMap = (
  a: Record<string, string> | null,
  b: Record<string, string>,
) => {
  if (!a) return false;
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  if (aKeys.length !== bKeys.length) return false;
  return aKeys.every((key) => a[key] === b[key]);
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
  const [clips, setClips] = useState<any[]>([]);

  const initialAppState = useMemo(() => {
    try {
      const saved = localStorage.getItem("vibe-coder-chats");
      const savedChats = saved ? (JSON.parse(saved) as ChatSession[]) : [];
      const activeChatId = localStorage.getItem("vibe-coder-active-chat-id");
      const activeChat = activeChatId
        ? savedChats.find((chat) => chat.id === activeChatId)
        : null;
      return {
        chats: savedChats,
        currentChatId: activeChat?.id ?? null,
        messages: activeChat?.messages ?? [],
      };
    } catch (e) {
      console.error("Failed to load chats:", e);
    }
    return { chats: [], currentChatId: null, messages: [] };
  }, []);

  const [messages, setMessages] = useState<Message[]>(initialAppState.messages);
  const messagesRef = useRef<Message[]>(initialAppState.messages);
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);
  const [chats, setChats] = useState<ChatSession[]>(initialAppState.chats);

  useEffect(() => {
    try {
      localStorage.setItem("vibe-coder-chats", JSON.stringify(chats));
    } catch (e) {
      console.error("Failed to save chats:", e);
    }
  }, [chats]);

  const [currentChatId, setCurrentChatId] = useState<string | null>(
    initialAppState.currentChatId,
  );
  const currentChatIdRef = useRef<string | null>(null);
  useEffect(() => {
    currentChatIdRef.current = currentChatId;
  }, [currentChatId]);

  useEffect(() => {
    try {
      if (currentChatId) {
        localStorage.setItem("vibe-coder-active-chat-id", currentChatId);
      } else {
        localStorage.removeItem("vibe-coder-active-chat-id");
      }
    } catch {
      /* ignore storage write failures */
    }
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
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [composerHeight, setComposerHeight] = useState(96);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 52,
    maxHeight: 200,
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isClipsOpen, setIsClipsOpen] = useState(true);
  const [isProjectsOpen, setIsProjectsOpen] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isTemporaryChat, setIsTemporaryChat] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [theme, setTheme] = useState("Light");
  const [sendOnEnter, setSendOnEnter] = useState(true);
  const [fontSize, setFontSize] = useState("Medium");
  const [autoScroll, setAutoScroll] = useState(true);
  const [animationSpeed, setAnimationSpeed] = useState(1);
  const [codeHighlighting, setCodeHighlighting] = useState(true);
  const [markdownSupport, setMarkdownSupport] = useState(true);
  const [systemPrompt, setSystemPrompt] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [userBubbleColor, setUserBubbleColor] = useState("#e2e8f0");
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

  const [vibePreviewMessageId, setVibePreviewMessageId] = useState<
    string | null
  >(null);
  const [vibePreviewFiles, setVibePreviewFiles] = useState<Record<
    string,
    string
  > | null>(null);
  const [isVibePreviewVisible, setIsVibePreviewVisible] = useState(true);
  const [vibePlaybackMessageId, setVibePlaybackMessageId] = useState<
    string | null
  >(null);

  const handleVibePreviewReady = useCallback(
    (messageId: string, files: Record<string, string>) => {
      if (Object.keys(files).length === 0) return;
      setVibePlaybackMessageId((prev) => (prev === messageId ? null : prev));
      setVibePreviewMessageId((prev) =>
        prev === messageId ? prev : messageId,
      );
      setVibePreviewFiles((prev) => {
        const accumulated = extractLatestVibeFiles(messagesRef.current);
        const baseline =
          Object.keys(accumulated).length > 0 ? accumulated : prev;
        if (!baseline) return files;
        const prevRoot = getVibeProjectRootFromFileMap(baseline);
        const nextRoot = getVibeProjectRootFromFileMap(files);
        if (
          prevRoot &&
          nextRoot &&
          prevRoot === nextRoot &&
          hasGenericFallbackVibeSurface(baseline) &&
          !hasGenericFallbackVibeSurface(files) &&
          hasCompleteVibeSourceSet(files)
        ) {
          return files;
        }
        const merged =
          prevRoot && nextRoot && prevRoot === nextRoot
            ? { ...baseline, ...files }
            : files;
        return prev && sameFileMap(prev, merged) ? prev : merged;
      });
      setIsVibePreviewVisible(true);
      chatNearBottomRef.current = true;
      for (const delay of [80, 420]) {
        window.setTimeout(() => {
          const el = document.getElementById("chat-container");
          if (!el) return;
          el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
          chatBottomRef.current?.scrollIntoView({
            block: "end",
            behavior: "smooth",
          });
        }, delay);
      }
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
      if (currentChatIdRef.current === chatId) {
        setMessages((prev) => update(prev));
      }
    },
    [],
  );

  const isVibeChat = useCallback((chat: ChatSession) => {
    return (
      chat.kind === "vibe" ||
      chat.messages.some((message) => message.assistantKind === "vibe")
    );
  }, []);

  const openChatSession = useCallback((chat: ChatSession) => {
    currentChatIdRef.current = chat.id;
    setCurrentChatId(chat.id);
    setMessages(chat.messages);
    setChats((prev) =>
      prev.map((item) =>
        item.id === chat.id ? { ...item, vibeUnread: false } : item,
      ),
    );
    setVibePreviewMessageId(null);
    setVibePreviewFiles(null);
    setIsVibePreviewVisible(true);
    setIsSidebarOpen(false);
  }, []);

  const isCurrentVibeGenerating = useMemo(
    () =>
      messages.some(
        (m) => m.assistantKind === "vibe" && (m.isStreaming || m.isThinking),
      ),
    [messages],
  );
  const isCurrentVibePlaybackRunning = useMemo(
    () =>
      !!vibePlaybackMessageId &&
      messages.some((m) => m.id === vibePlaybackMessageId),
    [messages, vibePlaybackMessageId],
  );

  const hasVibeLivePreview =
    !isCurrentVibeGenerating &&
    !isCurrentVibePlaybackRunning &&
    !!vibePreviewFiles &&
    vibePreviewMessageId != null &&
    messages.some(
      (m) =>
        m.id === vibePreviewMessageId &&
        m.role === "assistant" &&
        m.assistantKind === "vibe" &&
        !m.isStreaming,
    );
  const showVibeLivePreview = hasVibeLivePreview && isVibePreviewVisible;
  const isVibeWorkbenchSurface =
    hasVibeLivePreview ||
    messages.some((message) => message.assistantKind === "vibe") ||
    selectedCommand?.id === "vibe";

  // Only auto-close sidebar once when preview first appears, not on every render
  const previewJustAppearedRef = useRef(false);
  useEffect(() => {
    if (showVibeLivePreview && !previewJustAppearedRef.current) {
      previewJustAppearedRef.current = true;
      setIsSidebarOpen(false);
    }
    if (!showVibeLivePreview) {
      previewJustAppearedRef.current = false;
    }
  }, [showVibeLivePreview]);

  useEffect(() => {
    if (!vibePreviewMessageId) return;
    if (!messages.some((m) => m.id === vibePreviewMessageId)) {
      setVibePreviewMessageId(null);
      setVibePreviewFiles(null);
    }
  }, [messages, vibePreviewMessageId]);

  // Clear preview when switching to a chat that has no completed vibe messages
  useEffect(() => {
    const hasVibeMessages = messages.some(
      (m) =>
        m.role === "assistant" &&
        m.assistantKind === "vibe" &&
        !m.isStreaming &&
        typeof m.content === "string" &&
        m.content.includes("<<<VIBE_"),
    );
    if (!hasVibeMessages && vibePreviewMessageId) {
      setVibePreviewMessageId(null);
      setVibePreviewFiles(null);
    }
  }, [messages, vibePreviewMessageId]);

  useEffect(() => {
    if (isCurrentVibeGenerating || isCurrentVibePlaybackRunning) return;
    if (vibePreviewMessageId || vibePreviewFiles) return;
    const latestDoneVibe = [...messages]
      .reverse()
      .find(
        (m) =>
          m.role === "assistant" &&
          m.assistantKind === "vibe" &&
          !m.isStreaming &&
          typeof m.content === "string" &&
          m.content.includes("<<<VIBE_CODE"),
      );
    if (!latestDoneVibe) return;
    const files = extractLatestVibeFiles(messages);
    if (Object.keys(files).length === 0) return;
    setVibePreviewMessageId(latestDoneVibe.id);
    setVibePreviewFiles(files);
    setIsVibePreviewVisible(true);
  }, [
    isCurrentVibeGenerating,
    isCurrentVibePlaybackRunning,
    messages,
    vibePreviewFiles,
    vibePreviewMessageId,
  ]);
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
  const hasActiveMessageStream = useMemo(
    () => messages.some((m) => m.isStreaming || m.isThinking),
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
    const node = inputContainerRef.current;
    if (!node) return;

    const updateComposerHeight = () => {
      const measured = Math.ceil(node.getBoundingClientRect().height);
      setComposerHeight((prev) =>
        Math.abs(prev - measured) > 1 ? measured : prev,
      );
    };

    updateComposerHeight();
    const observer = new ResizeObserver(updateComposerHeight);
    observer.observe(node);
    return () => observer.disconnect();
  }, [
    messages.length,
    isInputExpanded,
    attachments.length,
    showCommandPalette,
  ]);

  const scrollChatToBottom = useCallback(
    (behavior: ScrollBehavior = "smooth") => {
      if (!autoScroll) return;
      const el = document.getElementById("chat-container");
      if (!el) return;
      chatNearBottomRef.current = true;

      window.requestAnimationFrame(() => {
        chatBottomRef.current?.scrollIntoView({
          block: "end",
          behavior,
        });
        el.scrollTo({
          top: el.scrollHeight,
          behavior,
        });
      });
    },
    [autoScroll],
  );

  useLayoutEffect(() => {
    if (!autoScroll) return;
    const el = document.getElementById("chat-container");
    if (!el || messages.length === 0) return;
    if (!chatNearBottomRef.current && !hasActiveMessageStream) return;
    scrollChatToBottom("smooth");
  }, [
    chatScrollSignature,
    autoScroll,
    hasActiveMessageStream,
    messages.length,
    showVibeLivePreview,
    composerHeight,
    scrollChatToBottom,
  ]);

  useEffect(() => {
    if (!autoScroll || messages.length === 0) return;
    const el = document.getElementById("chat-container");
    if (!el) return;

    let frame = 0;
    const shouldPin = () => chatNearBottomRef.current || hasActiveMessageStream;
    const scheduleScroll = () => {
      if (!shouldPin() || frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
        scrollChatToBottom("smooth");
      });
    };

    const mutationObserver = new MutationObserver(scheduleScroll);
    mutationObserver.observe(el, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    const resizeObserver = new ResizeObserver(scheduleScroll);
    resizeObserver.observe(el);

    const interval = hasActiveMessageStream
      ? window.setInterval(scheduleScroll, 220)
      : undefined;

    scheduleScroll();

    return () => {
      if (frame) window.cancelAnimationFrame(frame);
      if (interval) window.clearInterval(interval);
      mutationObserver.disconnect();
      resizeObserver.disconnect();
    };
  }, [autoScroll, hasActiveMessageStream, messages.length, scrollChatToBottom]);

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
        setValue("/");
        setTimeout(() => {
          textareaRef.current?.focus();
        }, 10);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  const isExpanded =
    isInputExpanded ||
    value.trim().length > 0 ||
    attachments.length > 0 ||
    selectedCommand !== null ||
    messages.length > 0;

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
        !selectedCommand
      ) {
        setIsInputExpanded(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [value, attachments.length, selectedCommand]);

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
      description: "Generate website and desktop apps",
      prefix: "/vibe",
    },
    {
      id: "clip",
      icon: (isActive: boolean) => (
        <div className="relative flex items-center justify-center w-[18px]">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={isActive ? "text-indigo-500" : "text-slate-500"}
          >
            <path d="M17.5 22h.5a2 2 0 0 0 2-2V7l-5-5H6a2 2 0 0 0-2 2v3" />
            <path d="M14 2v6h6" />
            <path d="M3 17.5a2.5 2.5 0 1 0 5 0 2.5 2.5 0 1 0-5 0Z" />
            <path d="M5.5 17.5 8 20" />
            <path d="M2 12h6" />
            <path d="M2 15h4" />
          </svg>
        </div>
      ),
      label: "AI Clip",
      description: "Clip viral moments from YouTube",
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
      description: "Let the AI control your browser",
      prefix: "/browse",
    },
  ];

  const isCommandMode = value.startsWith("/") && !value.includes(" ");
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
    : commandSuggestions;

  useEffect(() => {
    if (selectedCommand) {
      setShowCommandPalette(false);
      setActiveSuggestion(-1);
      return;
    }
    if (isCommandMode && filteredSuggestions.length > 0) {
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
  }, [isCommandMode, commandQuery, filteredSuggestions.length]);

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

  const toVibeTitleCase = (value: string) =>
    value
      .split(" ")
      .filter(Boolean)
      .slice(0, 4)
      .map((word) => {
        const normalized = word.replace(/^[^a-z0-9]+|[^a-z0-9]+$/gi, "");
        const lower = normalized.toLowerCase();
        if (lower === "ai") return "AI";
        if (lower === "ios") return "iOS";
        if (lower === "macos") return "macOS";
        if (lower === "openai") return "OpenAI";
        return normalized.charAt(0).toUpperCase() + normalized.slice(1);
      })
      .join(" ");

  const extractVibePromptSubject = (prompt: string) => {
    const explicit = prompt.match(
      /\b(?:for|about|around|for a|for an)\s+([a-z0-9][a-z0-9\s&'.-]{1,52})/i,
    );
    const source = explicit?.[1] ?? prompt;
    const clean = source
      .replace(/^make\s+(me\s+)?/i, "")
      .replace(/^build\s+(me\s+)?/i, "")
      .replace(/^create\s+(me\s+)?/i, "")
      .replace(
        /\b(landing|page|website|site|homepage|home page|app|application|for|about|a|an|the)\b/gi,
        " ",
      )
      .replace(/[^a-z0-9&'. -]/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    return clean ? toVibeTitleCase(clean) : "";
  };

  const looksLikeCalculatorPrompt = (value: string) =>
    /(calculator|calc\b|calcu?lator|caulc|claucl|calucl|clacul|calculater)/.test(
      value.toLowerCase(),
    );

  const buildVibeProjectTitle = (prompt: string) => {
    const clean = prompt
      .replace(/^make\s+(me\s+)?/i, "")
      .replace(/^build\s+(me\s+)?/i, "")
      .replace(/^create\s+(me\s+)?/i, "")
      .replace(/\b(a|an|the)\b/gi, " ")
      .replace(/\s+/g, " ")
      .trim();
    const lower = clean.toLowerCase();
    if (looksLikeCalculatorPrompt(lower)) return "Calculator App";
    if (
      /(platformer|2d|game|side.scroller|side scroller|arcade|jump|coin|sprite)/.test(
        lower,
      )
    )
      return "2D Platformer Game";
    if (lower.includes("landing") && lower.includes("openai"))
      return "OpenAI Landing Page";
    if (lower.includes("landing")) {
      const subject = extractVibePromptSubject(prompt);
      return subject ? `${subject} Landing Page` : "Launch Landing Page";
    }
    if (lower.includes("dashboard")) return "Analytics Dashboard";
    if (lower.includes("login") || lower.includes("auth")) return "Auth Flow";
    if (!clean) return "Vibe Project";
    return toVibeTitleCase(clean);
  };

  const slugifyVibeProjectName = (value: string) => {
    const slug = value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 48);
    return slug || "project";
  };

  const buildVibeProjectRoot = (prompt: string, uniqueSeed?: string) => {
    const base = slugifyVibeProjectName(buildVibeProjectTitle(prompt));
    const suffix = uniqueSeed
      ? `-${slugifyVibeProjectName(uniqueSeed).slice(-7)}`
      : "";
    return `vibe-project/${base}${suffix}`;
  };

  const getVibeProjectRootFromFiles = (files: Record<string, string>) => {
    const firstPath = Object.keys(files).find((path) =>
      path.startsWith("vibe-project/"),
    );
    if (!firstPath) return null;
    const parts = firstPath.split("/").filter(Boolean);
    if (parts.length >= 3 && parts[0] === "vibe-project") {
      return `${parts[0]}/${parts[1]}`;
    }
    return "vibe-project/project";
  };

  const extractLatestVibeFiles = (sourceMessages: Message[]) => {
    let activeRoot: string | null = null;
    let files: Record<string, string> = {};

    for (const message of sourceMessages) {
      if (
        message.role !== "assistant" ||
        message.assistantKind !== "vibe" ||
        message.isStreaming ||
        typeof message.content !== "string" ||
        !message.content.includes("<<<VIBE_")
      ) {
        continue;
      }

      const nextFiles = extractVibeFilesFromContent(message.content);
      if (Object.keys(nextFiles).length === 0) continue;
      const nextRoot = getVibeProjectRootFromFiles(nextFiles);
      if (!nextRoot) continue;

      if (activeRoot !== nextRoot) {
        activeRoot = nextRoot;
        files = {};
      }
      files = { ...files, ...nextFiles };
    }

    return files;
  };

  const detectProjectKind = (prompt: string): string => {
    const p = prompt.toLowerCase();
    if (
      /(game|platformer|2d|mario|jump|side.scroller|side scroller|platform|arcade|coin|enemy|sprite)/.test(
        p,
      )
    )
      return "platformer";
    if (looksLikeCalculatorPrompt(p)) return "calculator";
    if (
      /(todo|to.do|task.list|task list|task planner|task board|task manager|tasks?\b|planner|kanban|checklist|agenda)/.test(
        p,
      )
    )
      return "todo";
    if (/(landing|page|website|site|homepage|home page)/.test(p))
      return "landing";
    if (/dashboard/.test(p)) return "dashboard";
    if (/(habit|routine|streak|daily tracker|wellness tracker)/.test(p))
      return "habit";
    if (/(form|input|sign.up|sign in|login|survey)/.test(p)) return "form";
    if (/(weather|forecast|temperature)/.test(p)) return "weather";
    if (/(stopwatch|timer|countdown|clock)/.test(p)) return "timer";
    if (/(pomodoro|focus|productivity)/.test(p)) return "pomodoro";
    if (/(quiz|trivia|question|test)/.test(p)) return "quiz";
    if (/(chat|message|conversation|messaging)/.test(p)) return "chat";
    if (/(paint|draw|canvas|sketch|doodle)/.test(p)) return "drawing";
    if (/(color|palette|gradient|picker)/.test(p)) return "colorpicker";
    return "generic";
  };

  const isVibeFileMapCompatibleWithKind = (
    kind: string,
    files: Record<string, string>,
    projectRoot: string,
  ) => {
    if (kind === "generic") return true;
    const projectEntries = Object.entries(files).filter(([path]) =>
      path.startsWith(`${projectRoot}/`),
    );
    const pathText = projectEntries
      .map(([path]) => path.toLowerCase())
      .join(" ");
    const bodyText = projectEntries
      .slice(0, 12)
      .map(([, body]) => body.toLowerCase())
      .join("\n");
    const hasGenericFallbackSurface =
      pathText.includes("customprojectsurface") ||
      pathText.includes("product-brief") ||
      bodyText.includes("customprojectsurface");

    if (kind === "platformer") {
      if (hasGenericFallbackSurface) return false;
      return (
        pathText.includes("usegameloop") ||
        pathText.includes("gamecanvas") ||
        (bodyText.includes("player") &&
          bodyText.includes("gravity") &&
          bodyText.includes("platform"))
      );
    }

    if (kind === "calculator") {
      if (hasGenericFallbackSurface) return false;
      return (
        pathText.includes("usecalculator") ||
        pathText.includes("calculatorbuttons") ||
        bodyText.includes("calculator")
      );
    }

    return true;
  };

  const hashVibeSeed = (value: string) => {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  };

  const pickVibeVariant = <T,>(items: readonly T[], seed: number, offset = 0) =>
    items[(seed + offset) % items.length]!;

  const buildVibeCreativeProfile = (
    kind: string,
    prompt: string,
    projectRoot: string,
    runId: string,
  ) => {
    const seed = hashVibeSeed(`${projectRoot}|${prompt}|${runId}`);
    const visualDirections = [
      "quiet editorial minimalism with crisp whitespace and precise contrast",
      "premium dark interface with restrained glow, glass layers, and sharp controls",
      "warm product-studio look with tactile cards, confident typography, and soft depth",
      "electric utility UI with compact panels, clear hierarchy, and high-signal accents",
      "cinematic launch surface with large media-like zones and refined motion",
    ] as const;
    const interactionSignatures = [
      "segmented modes, inline validation, and optimistic micro-feedback",
      "keyboard-friendly controls, hover intent, and visible state transitions",
      "progressive disclosure, collapsible details, and polished empty states",
      "live counters, reset/retry actions, and useful status badges",
      "guided onboarding moments plus a strong success/completion state",
    ] as const;
    const architectureShapes = [
      "types first, then data/constants, state hook, focused components, App wiring",
      "domain data, reusable UI section components, interaction hook, App composition",
      "state machine hook, presentation components, controls module, App shell",
      "content model, layout components, auth/settings surface, App integration",
      "game/tool logic hook, renderer component, HUD/controls component, App entry",
    ] as const;
    const landingExpansions = [
      "include nav, hero, proof metrics, feature sections, pricing or offer grid, and sign-in/sign-up access",
      "include brand mark, hero, product lineup, trust/privacy copy, account panel, and CTA footer",
      "include nav, hero, use cases, social proof, plan cards, auth modal/panel, and mobile-ready layout",
    ] as const;
    const gameExpansions = [
      "include playable loop, physics or rules, score, reset, win/loss feedback, HUD, and keyboard controls",
      "include varied level geometry, collectibles or hazards, start/restart states, HUD, and tuned visual theme",
      "include renderer, state hook, collision/rules, controls, progress feedback, and replay loop",
    ] as const;
    const toolExpansions = [
      "include validation, error states, empty states, reset/undo affordance, and responsive controls",
      "include domain-specific data, stateful workflows, keyboard-friendly actions, and polished status feedback",
      "include settings, useful defaults, meaningful sample data, edge cases, and a completion/success state",
    ] as const;

    const expansion =
      kind === "landing"
        ? pickVibeVariant(landingExpansions, seed, 3)
        : kind === "platformer"
          ? pickVibeVariant(gameExpansions, seed, 5)
          : pickVibeVariant(toolExpansions, seed, 7);

    return [
      `Visual direction: ${pickVibeVariant(visualDirections, seed)}.`,
      `Interaction signature: ${pickVibeVariant(interactionSignatures, seed, 11)}.`,
      `Architecture shape: ${pickVibeVariant(architectureShapes, seed, 17)}.`,
      `Scope expansion: ${expansion}.`,
      `Uniqueness rule: do not reuse layout, copy, mechanics, component names, or sample data from another run with the same prompt; this run id is ${runId}.`,
    ].join("\n");
  };

  /** Returns a map of relative file paths → file content for the generated project. */
  const generateAppCode = (
    kind: string,
    userPrompt: string,
    projectRoot: string = "",
  ): Record<string, string> => {
    const buildSeed = hashVibeSeed(`${projectRoot}|${userPrompt}`);
    switch (kind) {
      case "platformer":
        return generatePlatformerCode(buildSeed);
      case "calculator":
        return generateCalculatorCode();
      case "todo":
        return generateTodoCode(userPrompt);
      case "landing":
        return generateLandingFiles(userPrompt, buildSeed);
      case "dashboard":
        return generateDashboardCode();
      case "habit":
        return generateHabitTrackerCode();
      case "form":
        return { "src/App.tsx": generateFormCode(userPrompt) };
      case "weather":
        return { "src/App.tsx": generateWeatherCode() };
      case "timer":
        return { "src/App.tsx": generateTimerCode() };
      case "pomodoro":
        return { "src/App.tsx": generatePomodoroCode() };
      case "quiz":
        return { "src/App.tsx": generateQuizCode() };
      case "chat":
        return { "src/App.tsx": generateChatCode() };
      case "drawing":
        return { "src/App.tsx": generateDrawingCode() };
      case "colorpicker":
        return { "src/App.tsx": generateColorPickerCode() };
      default:
        return generateGenericCode(userPrompt);
    }
  };

  const projectKindLabel = (kind: string): string => {
    const labels: Record<string, string> = {
      platformer: "2D Platformer Game",
      calculator: "Calculator App",
      todo: "Todo List App",
      landing: "Landing Page",
      dashboard: "Analytics Dashboard",
      habit: "Habit Tracker",
      form: "Form App",
      weather: "Weather App",
      timer: "Timer App",
      pomodoro: "Pomodoro Timer",
      quiz: "Quiz App",
      chat: "Chat App",
      drawing: "Drawing App",
      colorpicker: "Color Picker",
      generic: "React App",
    };
    return labels[kind] ?? "React App";
  };

  // ─── App code generators ───

  const generatePlatformerCode = (
    buildSeed: number,
  ): Record<string, string> => {
    const platformerThemes = [
      {
        title: "Neon Rooftop Run",
        tagline: "Collect skyline cores before the city lights fade.",
        bgClass: "bg-[#070b18]",
        sky: ["#07111f", "#172554", "#312e81"],
        platform: "#06b6d4",
        platformTop: "#67e8f9",
        ground: "#0f766e",
        groundTop: "#2dd4bf",
        player: "#fb7185",
        playerLight: "#fecdd3",
        coin: "#facc15",
        accent: "text-cyan-300",
      },
      {
        title: "Ember Cavern Dash",
        tagline: "Leap through warm caverns and bank every fire shard.",
        bgClass: "bg-[#180a08]",
        sky: ["#2a0f0a", "#7c2d12", "#451a03"],
        platform: "#f97316",
        platformTop: "#fdba74",
        ground: "#7c2d12",
        groundTop: "#fb923c",
        player: "#38bdf8",
        playerLight: "#bae6fd",
        coin: "#fde68a",
        accent: "text-orange-300",
      },
      {
        title: "Lunar Orchard Quest",
        tagline: "Float between moonlit branches and gather silver fruit.",
        bgClass: "bg-[#0b1020]",
        sky: ["#101827", "#1e293b", "#334155"],
        platform: "#84cc16",
        platformTop: "#bef264",
        ground: "#365314",
        groundTop: "#a3e635",
        player: "#a78bfa",
        playerLight: "#ddd6fe",
        coin: "#e5e7eb",
        accent: "text-lime-300",
      },
      {
        title: "Coral Tide Runner",
        tagline:
          "Ride reef platforms and recover pearls before the tide turns.",
        bgClass: "bg-[#06151d]",
        sky: ["#083344", "#155e75", "#164e63"],
        platform: "#f472b6",
        platformTop: "#fbcfe8",
        ground: "#0e7490",
        groundTop: "#22d3ee",
        player: "#f59e0b",
        playerLight: "#fde68a",
        coin: "#f0fdfa",
        accent: "text-pink-300",
      },
    ] as const;
    const platformLayouts = [
      [
        { x: 0, y: 420, w: 210, h: 20 },
        { x: 250, y: 362, w: 145, h: 20 },
        { x: 455, y: 304, w: 170, h: 20 },
        { x: 160, y: 246, w: 132, h: 20 },
        { x: 386, y: 188, w: 132, h: 20 },
        { x: 28, y: 136, w: 122, h: 20 },
        { x: 552, y: 126, w: 124, h: 20 },
        { x: 294, y: 78, w: 118, h: 20 },
      ],
      [
        { x: 0, y: 428, w: 190, h: 20 },
        { x: 214, y: 370, w: 128, h: 20 },
        { x: 388, y: 318, w: 146, h: 20 },
        { x: 574, y: 264, w: 128, h: 20 },
        { x: 330, y: 222, w: 128, h: 20 },
        { x: 110, y: 178, w: 150, h: 20 },
        { x: 468, y: 126, w: 140, h: 20 },
        { x: 238, y: 82, w: 112, h: 20 },
      ],
      [
        { x: 0, y: 418, w: 220, h: 20 },
        { x: 282, y: 354, w: 120, h: 20 },
        { x: 80, y: 306, w: 132, h: 20 },
        { x: 452, y: 286, w: 160, h: 20 },
        { x: 248, y: 232, w: 118, h: 20 },
        { x: 30, y: 168, w: 138, h: 20 },
        { x: 520, y: 154, w: 130, h: 20 },
        { x: 316, y: 94, w: 128, h: 20 },
      ],
    ] as const;
    const coinLayouts = [
      [
        { x: 286, y: 322, r: 8, collected: false },
        { x: 504, y: 264, r: 8, collected: false },
        { x: 200, y: 206, r: 8, collected: false },
        { x: 424, y: 146, r: 8, collected: false },
        { x: 70, y: 96, r: 8, collected: false },
        { x: 594, y: 86, r: 8, collected: false },
        { x: 332, y: 42, r: 8, collected: false },
      ],
      [
        { x: 248, y: 330, r: 8, collected: false },
        { x: 434, y: 278, r: 8, collected: false },
        { x: 612, y: 224, r: 8, collected: false },
        { x: 374, y: 184, r: 8, collected: false },
        { x: 158, y: 138, r: 8, collected: false },
        { x: 526, y: 88, r: 8, collected: false },
        { x: 284, y: 44, r: 8, collected: false },
      ],
      [
        { x: 320, y: 314, r: 8, collected: false },
        { x: 126, y: 266, r: 8, collected: false },
        { x: 510, y: 246, r: 8, collected: false },
        { x: 296, y: 192, r: 8, collected: false },
        { x: 92, y: 128, r: 8, collected: false },
        { x: 572, y: 114, r: 8, collected: false },
        { x: 360, y: 54, r: 8, collected: false },
      ],
    ] as const;
    const theme = pickVibeVariant(platformerThemes, buildSeed);
    const layoutIndex = buildSeed % platformLayouts.length;
    const platforms = platformLayouts[layoutIndex];
    const coins = coinLayouts[layoutIndex];
    const starSeed = 31 + (buildSeed % 83);
    const typesCode = `/** Core types for the 2D platformer game. */

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vy: number;
  vx: number;
}

export interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Coin {
  x: number;
  y: number;
  r: number;
  collected: boolean;
}

export interface GameState {
  player: Player;
  platforms: Platform[];
  coins: Coin[];
  keys: Record<string, boolean>;
  gravity: number;
  groundY: number;
  scrollX: number;
}
`;

    const hookCode = `import { useRef, useState, useCallback, useEffect } from "react";
import type { Player, Platform, Coin, GameState } from "../types";

const INITIAL_PLAYER: Player = { x: 80, y: 300, w: 28, h: 36, vy: 0, vx: 0 };

const PLATFORMS: Platform[] = ${JSON.stringify(platforms, null, 2)};

const COINS: Coin[] = ${JSON.stringify(coins, null, 2)};

const THEME = {
  skyTop: ${JSON.stringify(theme.sky[0])},
  skyMid: ${JSON.stringify(theme.sky[1])},
  skyBottom: ${JSON.stringify(theme.sky[2])},
  platform: ${JSON.stringify(theme.platform)},
  platformTop: ${JSON.stringify(theme.platformTop)},
  ground: ${JSON.stringify(theme.ground)},
  groundTop: ${JSON.stringify(theme.groundTop)},
  player: ${JSON.stringify(theme.player)},
  playerLight: ${JSON.stringify(theme.playerLight)},
  coin: ${JSON.stringify(theme.coin)},
  starSeed: ${starSeed},
} as const;

function createInitialState(): GameState {
  return {
    player: { ...INITIAL_PLAYER },
    platforms: PLATFORMS,
    coins: COINS.map((c) => ({ ...c })),
    keys: {},
    gravity: 0.55,
    groundY: 460,
    scrollX: 0,
  };
}

/**
 * Encapsulates the full 2D platformer game loop: physics, collision detection,
 * coin collection, canvas drawing, and input handling.
 * Exposes a clean API so the App component only handles rendering.
 */
export function useGameLoop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [started, setStarted] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const g = useRef<GameState>(createInitialState());
  const game = g.current;

  const reset = useCallback(() => {
    game.player = { ...INITIAL_PLAYER };
    game.coins = COINS.map((c) => ({ ...c }));
    game.scrollX = 0;
    setScore(0);
    setGameOver(false);
    setStarted(true);
  }, []);

  const start = useCallback(() => {
    setStarted(true);
    reset();
  }, [reset]);

  // Keyboard input
  useEffect(() => {
    const handleKey = (e: KeyboardEvent, down: boolean) => {
      if (
        ["ArrowLeft", "ArrowRight", "ArrowUp", "KeyA", "KeyD", "KeyW", "Space", "KeyR"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
      game.keys[e.code] = down;
      if (e.code === "KeyR" && gameOver) reset();
    };
    const onDown = (e: KeyboardEvent) => handleKey(e, true);
    const onUp = (e: KeyboardEvent) => handleKey(e, false);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [gameOver, reset, game]);

  // Game loop
  useEffect(() => {
    if (!started || gameOver) return;
    let animId: number;
    const loop = () => {
      const p = game.player;
      const keys = game.keys;

      p.vx = 0;
      if (keys["ArrowLeft"] || keys["KeyA"]) p.vx = -4.5;
      if (keys["ArrowRight"] || keys["KeyD"]) p.vx = 4.5;
      if ((keys["ArrowUp"] || keys["KeyW"] || keys["Space"]) && p.vy === 0) {
        const grounded =
          game.platforms.some(
            (pf) =>
              p.y + p.h >= pf.y &&
              p.y + p.h <= pf.y + pf.h + 6 &&
              p.x + p.w > pf.x &&
              p.x < pf.x + pf.w,
          ) || p.y + p.h >= game.groundY;
        if (grounded) p.vy = -10;
      }

      p.vy += game.gravity;
      p.x += p.vx;
      p.y += p.vy;

      // Platform collision
      for (const pf of game.platforms) {
        if (
          p.vy >= 0 &&
          p.x + p.w > pf.x &&
          p.x < pf.x + pf.w &&
          p.y + p.h >= pf.y &&
          p.y + p.h <= pf.y + pf.h + 8
        ) {
          p.y = pf.y - p.h;
          p.vy = 0;
        }
      }
      if (p.y + p.h >= game.groundY) {
        p.y = game.groundY - p.h;
        p.vy = 0;
      }

      // Coin collection
      for (const c of game.coins) {
        if (!c.collected) {
          const cx = p.x + p.w / 2;
          const cy = p.y + p.h / 2;
          const dx = cx - c.x;
          const dy = cy - c.y;
          if (Math.sqrt(dx * dx + dy * dy) < c.r + 16) {
            c.collected = true;
            setScore((s) => s + 10);
          }
        }
      }

      game.scrollX = Math.max(0, p.x - 180);

      if (p.y > 520) {
        setGameOver(true);
        setHighScore((prev) => Math.max(prev, score));
      }

      // Draw
      const canvas = canvasRef.current;
      if (!canvas) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        animId = requestAnimationFrame(loop);
        return;
      }
      const W = canvas.width;
      const H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, THEME.skyTop);
      grad.addColorStop(0.6, THEME.skyMid);
      grad.addColorStop(1, THEME.skyBottom);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      for (let i = 0; i < 50; i++) {
        const sx = (i * 137 + THEME.starSeed) % W;
        const sy = (i * 251 + THEME.starSeed * 3) % H;
        ctx.fillRect(sx, sy, 2, 2);
      }

      ctx.save();
      ctx.translate(-game.scrollX, 0);

      ctx.fillStyle = THEME.platform;
      ctx.shadowColor = THEME.platform;
      ctx.shadowBlur = 8;
      for (const pf of game.platforms) {
        ctx.fillRect(pf.x, pf.y, pf.w, pf.h);
        ctx.fillStyle = THEME.platformTop;
        ctx.fillRect(pf.x, pf.y, pf.w, 4);
        ctx.fillStyle = THEME.platform;
      }
      ctx.shadowBlur = 0;

      ctx.fillStyle = THEME.ground;
      ctx.fillRect(0, game.groundY, 800, 40);
      ctx.fillStyle = THEME.groundTop;
      ctx.fillRect(0, game.groundY, 800, 5);

      for (const c of game.coins) {
        if (!c.collected) {
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
          ctx.fillStyle = THEME.coin;
          ctx.shadowColor = THEME.coin;
          ctx.shadowBlur = 10;
          ctx.fill();
          ctx.shadowBlur = 0;
        }
      }

      ctx.fillStyle = THEME.player;
      ctx.shadowColor = THEME.player;
      ctx.shadowBlur = 12;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = THEME.playerLight;
      ctx.fillRect(p.x + 4, p.y + 4, 8, 6);
      ctx.fillRect(p.x + 16, p.y + 4, 8, 6);
      ctx.fillStyle = "#111";
      ctx.fillRect(p.x + 6, p.y + 8, 5, 5);
      ctx.fillRect(p.x + 17, p.y + 8, 5, 5);
      ctx.fillStyle = "#fff";
      ctx.fillRect(p.x + 7, p.y + 9, 2, 2);
      ctx.fillRect(p.x + 18, p.y + 9, 2, 2);

      ctx.restore();
      animId = requestAnimationFrame(loop);
    };
    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [started, gameOver, score, game]);

  const allCollected = game.coins.every((c) => c.collected);

  return {
    canvasRef,
    player: game.player,
    platforms: game.platforms,
    coins: game.coins,
    score,
    gameOver,
    started,
    highScore,
    scrollX: game.scrollX,
    allCollected,
    reset,
    start,
  };
}
`;

    const appCode = `import React from "react";
import { Play, RotateCcw, Trophy, Keyboard } from "lucide-react";
import { useGameLoop } from "./hooks/useGameLoop";

/**
 * ${theme.title} — entry point.
 * Wires the useGameLoop hook to the canvas and UI chrome.
 */
export default function PlatformerGame() {
  const {
    canvasRef,
    score,
    gameOver,
    started,
    highScore,
    allCollected,
    reset,
    start,
  } = useGameLoop();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen ${theme.bgClass} gap-4 p-4 font-sans text-white">
      <div className="flex items-center gap-6 flex-wrap justify-center">
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
          <Trophy className="w-4 h-4 text-yellow-400" />
          <span className="font-semibold text-yellow-400">Score: {score}</span>
        </div>
        <div className="flex items-center gap-2 bg-white/10 rounded-full px-4 py-2">
          <Trophy className="w-4 h-4 text-pink-300" />
          <span className="font-semibold text-pink-300">Best: {highScore}</span>
        </div>
      </div>

      <div className="relative rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shadow-purple-500/20">
        <canvas ref={canvasRef} width={700} height={480} className="block" />

        {!started && !gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm gap-4">
            <Play className="w-12 h-12 text-white" />
            <p className="text-xl font-bold">${theme.title}</p>
            <p className="max-w-xs text-center text-sm text-white/60">${theme.tagline}</p>
            <button
              onClick={start}
              className="px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-full transition"
            >
              Start Game
            </button>
          </div>
        )}

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 backdrop-blur-sm gap-3">
            <p className="text-3xl font-bold text-red-400">Game Over</p>
            <p className="text-lg text-white/70">Score: {score}</p>
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-6 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-full transition"
            >
              <RotateCcw className="w-4 h-4" /> Restart
            </button>
          </div>
        )}

        {allCollected && started && !gameOver && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-yellow-400 text-black px-4 py-2 rounded-full font-bold animate-bounce">
            All coins collected!
          </div>
        )}
      </div>

      <div className="flex flex-col items-center gap-1 text-white/50 text-sm sm:flex-row sm:gap-2">
        <Keyboard className="w-4 h-4" />
        <span>Arrow Keys / WASD to move and jump</span>
        <span className="${theme.accent}">Theme seed: ${String(buildSeed).slice(-4)}</span>
      </div>
    </div>
  );
}
`;

    return {
      "src/types.ts": typesCode,
      "src/hooks/useGameLoop.ts": hookCode,
      "src/App.tsx": appCode,
    };
  };

  const generateCalculatorCode = (): Record<string, string> => {
    const hookCode = `import { useState, useCallback } from "react";

/**
 * Core calculator logic: digit input, operator chaining, computation,
 * and display formatting. Keeps UI concerns out of the business rules.
 */
export function useCalculator() {
  const [display, setDisplay] = useState("0");
  const [prevValue, setPrevValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<string | null>(null);
  const [fresh, setFresh] = useState(true);

  const compute = useCallback((a: number, b: number, op: string): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "*":
        return a * b;
      case "/":
        return b !== 0 ? a / b : NaN;
      default:
        return b;
    }
  }, []);

  const inputDigit = useCallback((d: string) => {
    setDisplay((prev) => (fresh || prev === "0" ? d : prev + d));
    setFresh(false);
  }, [fresh]);

  const inputOperator = useCallback(
    (op: string) => {
      const current = parseFloat(display);
      if (prevValue !== null && operator && !fresh) {
        const result = compute(prevValue, current, operator);
        setPrevValue(result);
        setDisplay(String(result));
      } else {
        setPrevValue(current);
      }
      setOperator(op);
      setFresh(true);
    },
    [display, prevValue, operator, fresh, compute],
  );

  const inputEquals = useCallback(() => {
    if (prevValue === null || operator === null) return;
    const current = parseFloat(display);
    const result = compute(prevValue, current, operator);
    setDisplay(
      isNaN(result) ? "Error" : String(Math.round(result * 1e8) / 1e8),
    );
    setPrevValue(null);
    setOperator(null);
    setFresh(true);
  }, [display, prevValue, operator, compute]);

  const inputClear = useCallback(() => {
    setDisplay("0");
    setPrevValue(null);
    setOperator(null);
    setFresh(true);
  }, []);

  const inputBackspace = useCallback(() => {
    setDisplay((p) => (p.length > 1 ? p.slice(0, -1) : "0"));
  }, []);

  const inputPercent = useCallback(() => {
    const val = parseFloat(display) / 100;
    setDisplay(String(val));
    setFresh(true);
  }, [display]);

  const inputDecimal = useCallback(() => {
    if (!display.includes(".")) {
      setDisplay((p) => p + ".");
      setFresh(false);
    }
  }, [display]);

  return {
    display,
    prevValue,
    operator,
    inputDigit,
    inputOperator,
    inputEquals,
    inputClear,
    inputBackspace,
    inputPercent,
    inputDecimal,
  };
}
`;

    const uiCode = `import React from "react";
import { Delete } from "lucide-react";
import type { useCalculator } from "../hooks/useCalculator";

type CalculatorAPI = ReturnType<typeof useCalculator>;

const BUTTONS = [
  ["C", "⌫", "%", "/"],
  ["7", "8", "9", "*"],
  ["4", "5", "6", "-"],
  ["1", "2", "3", "+"],
  ["0", ".", "=", ""],
] as const;

/** Renders the calculator display and button grid. All state lives in the hook. */
export function CalculatorUI({
  display,
  prevValue,
  operator,
  inputDigit,
  inputOperator,
  inputEquals,
  inputClear,
  inputBackspace,
  inputPercent,
  inputDecimal,
}: CalculatorAPI) {
  const handleClick = (label: string) => {
    if (label === "C") inputClear();
    else if (label === "⌫") inputBackspace();
    else if (label === "%") inputPercent();
    else if (["+", "-", "*", "/"].includes(label)) inputOperator(label);
    else if (label === "=") inputEquals();
    else if (label === ".") inputDecimal();
    else inputDigit(label);
  };

  return (
    <div className="w-80 rounded-3xl overflow-hidden shadow-2xl shadow-black/40 bg-slate-800 border border-white/10">
      <div className="p-6 pb-2">
        <div className="text-right text-white/40 text-sm h-5 mb-1">
          {prevValue !== null ? prevValue + " " + operator : ""}
        </div>
        <div className="text-right text-white text-4xl font-light tracking-tight overflow-hidden text-ellipsis whitespace-nowrap h-12">
          {display}
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2 p-4">
        {BUTTONS.flat().map((label, i) => {
          if (!label) return <div key={i} />;
          const isOp = ["+", "-", "*", "/", "="].includes(label);
          const isClear = label === "C";
          const isDel = label === "⌫";
          let btnClass = "bg-slate-700 hover:bg-slate-600 text-white";
          if (isOp) btnClass = "bg-amber-500 hover:bg-amber-400 text-white font-bold";
          if (isClear) btnClass = "bg-red-500 hover:bg-red-400 text-white";
          if (isDel) btnClass = "bg-slate-600 hover:bg-slate-500 text-white";
          return (
            <button
              key={i}
              onClick={() => handleClick(label)}
              className={
                "rounded-xl h-14 text-lg font-medium transition active:scale-95 " +
                btnClass
              }
            >
              {isDel ? <Delete className="w-5 h-5 mx-auto" /> : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
`;

    const appCode = `import React from "react";
import { useCalculator } from "./hooks/useCalculator";
import { CalculatorUI } from "./components/CalculatorUI";

/** Calculator — entry point. Wires the logic hook to the visual UI. */
export default function Calculator() {
  const calc = useCalculator();

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <CalculatorUI {...calc} />
    </div>
  );
}
`;

    return {
      "src/hooks/useCalculator.ts": hookCode,
      "src/components/CalculatorUI.tsx": uiCode,
      "src/App.tsx": appCode,
    };
  };

  const generateTodoCode = (prompt: string): Record<string, string> => {
    const title = buildVibeProjectTitle(prompt);
    const isPlanner = /(planner|task|kanban|agenda|board)/i.test(prompt);
    const displayTitle = isPlanner ? title : "Command list";
    const eyebrow = isPlanner ? "Planner" : "Today";
    const componentName = isPlanner ? "TaskPlannerApp" : "TodoApp";
    const hookCode = `import { useState, useCallback } from "react";

export interface Todo {
  id: number;
  text: string;
  done: boolean;
  lane: "Now" | "Next" | "Later";
}

/**
 * Core todo-list logic: add, toggle, delete, and derived counts.
 * Pure state management — no rendering concerns.
 */
export function useTodos() {
  const [todos, setTodos] = useState<Todo[]>([
    { id: 1, text: "Refine launch copy", done: true, lane: "Now" },
    { id: 2, text: "Review onboarding screens", done: false, lane: "Now" },
    { id: 3, text: "Send product update", done: false, lane: "Next" },
  ]);
  const [input, setInput] = useState("");
  const [lane, setLane] = useState<Todo["lane"]>("Now");

  const add = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed) return;
    setTodos((p) => [...p, { id: Date.now(), text: trimmed, done: false, lane }]);
    setInput("");
  }, [input, lane]);

  const toggle = useCallback((id: number) => {
    setTodos((p) =>
      p.map((t) => (t.id === id ? { ...t, done: !t.done } : t)),
    );
  }, []);

  const remove = useCallback((id: number) => {
    setTodos((p) => p.filter((t) => t.id !== id));
  }, []);

  const remaining = todos.filter((t) => !t.done).length;
  const completed = todos.length - remaining;
  const progress = todos.length === 0 ? 0 : Math.round((completed / todos.length) * 100);

  return { todos, input, setInput, lane, setLane, add, toggle, remove, remaining, completed, progress };
}
`;

    const listCode = `import React from "react";
import { Plus, Trash2, CheckCircle2, Circle, ListTodo, Sparkles } from "lucide-react";
import type { useTodos } from "../hooks/useTodos";
import type { Todo } from "../hooks/useTodos";

type TodosAPI = ReturnType<typeof useTodos>;

/** Renders the task list UI: input field, todo items, and summary footer. */
export function TodoList({
  todos,
  input,
  setInput,
  lane,
  setLane,
  add,
  toggle,
  remove,
  remaining,
  completed,
  progress,
}: TodosAPI) {
  return (
    <div className="w-full max-w-xl rounded-[28px] border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-black/30 backdrop-blur">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white text-slate-950 shadow-lg shadow-white/10">
            <ListTodo className="h-5 w-5" />
          </div>
          <div>
            <p className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.2em] text-indigo-200/70">
              <Sparkles className="h-3.5 w-3.5" /> {${JSON.stringify(eyebrow)}}
            </p>
            <h1 className="text-2xl font-black tracking-tight text-white">{${JSON.stringify(displayTitle)}}</h1>
          </div>
        </div>
        <div className="rounded-2xl bg-black/20 px-4 py-3 text-right">
          <p className="text-2xl font-black text-white">{progress}%</p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/35">complete</p>
        </div>
      </div>

      <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-indigo-300 to-cyan-300 transition-all duration-500" style={{ width: progress + "%" }} />
      </div>

      <div className="mb-4 flex rounded-full bg-black/20 p-1">
        {(["Now", "Next", "Later"] as Todo["lane"][]).map((item) => (
          <button
            key={item}
            onClick={() => setLane(item)}
            className={"flex-1 rounded-full px-3 py-2 text-xs font-bold transition " + (lane === item ? "bg-white text-slate-950 shadow-sm" : "text-white/45 hover:text-white")}
          >
            {item}
          </button>
        ))}
      </div>

      <div className="mb-6 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && add()}
          placeholder="Add a task..."
          className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 outline-none focus:border-indigo-400 transition"
        />
        <button
          onClick={add}
          className="px-4 py-3 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition active:scale-95"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-2">
        {todos.length === 0 && (
          <div className="rounded-2xl border border-dashed border-white/15 bg-black/10 px-4 py-8 text-center">
            <p className="font-semibold text-white/70">Clear board.</p>
            <p className="mt-1 text-sm text-white/35">Add one task to start a focused sprint.</p>
          </div>
        )}
        {todos.map((todo) => (
          <div
            key={todo.id}
            className={
              "group flex items-center gap-3 rounded-2xl border px-4 py-3 transition hover:-translate-y-0.5 " +
              (todo.done
                ? "border-white/5 bg-white/[0.04]"
                : "border-white/10 bg-white/[0.09] hover:border-white/20")
            }
          >
            <button onClick={() => toggle(todo.id)} className="flex-shrink-0">
              {todo.done ? (
                <CheckCircle2 className="w-6 h-6 text-emerald-400" />
              ) : (
                <Circle className="w-6 h-6 text-white/30" />
              )}
            </button>
            <span
              className={
                "flex-1 text-sm " +
                (todo.done ? "text-white/30 line-through" : "text-white")
              }
            >
              {todo.text}
            </span>
            <span className="rounded-full bg-black/20 px-2 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
              {todo.lane}
            </span>
            <button
              onClick={() => remove(todo.id)}
              className="text-white/20 opacity-70 transition hover:text-red-400 group-hover:opacity-100"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {todos.length > 0 && (
        <p className="mt-4 text-center text-xs font-semibold text-white/35">
          {completed} complete · {remaining} remaining
        </p>
      )}
    </div>
  );
}
`;

    const appCode = `import React from "react";
import { useTodos } from "./hooks/useTodos";
import { TodoList } from "./components/TodoList";

/** ${title} — entry point. Wires the task state hook to the premium planner UI. */
export default function ${componentName}() {
  const todos = useTodos();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_20%_15%,rgba(129,140,248,0.28),transparent_32%),linear-gradient(135deg,#111827,#312e81_48%,#111827)] p-4">
      <TodoList {...todos} />
    </div>
  );
}
`;

    return {
      "src/hooks/useTodos.ts": hookCode,
      "src/components/TodoList.tsx": listCode,
      "src/App.tsx": appCode,
    };
  };

  const generateLandingFiles = (
    prompt: string,
    buildSeed = 0,
  ): Record<string, string> => {
    const subject = extractVibePromptSubject(prompt) || "Launchpad";
    const isApple = subject.toLowerCase() === "apple";
    const variant = pickVibeVariant(
      [
        "cinematic product system",
        "editorial conversion suite",
        "minimal launch experience",
        "membership-first brand story",
      ] as const,
      buildSeed,
    );
    const contentCode = `export const LANDING_CONTENT = {
  brand: ${JSON.stringify(subject)},
  eyebrow: ${JSON.stringify(isApple ? "Introducing the ecosystem" : variant)},
  headline: ${JSON.stringify(isApple ? "Apple experiences, composed for today." : `The modern way to ship ${subject.toLowerCase()} experiences.`)},
  body: ${JSON.stringify(isApple ? "A premium product page concept for Apple's connected hardware, services, and spatial computing story, built as a responsive React landing experience." : "A polished, responsive landing experience with a strong visual system, sharp messaging, and production-ready sections.")},
  primaryCta: ${JSON.stringify(isApple ? "Explore the lineup" : "Get started")},
  secondaryCta: ${JSON.stringify(isApple ? "Watch the film" : "Learn more")},
  metrics: [
    { label: "Product families", value: ${JSON.stringify(isApple ? "6" : "4")} },
    { label: "Launch sections", value: "5" },
    { label: "Responsive states", value: "100%" },
  ],
  features: [
    {
      title: ${JSON.stringify(isApple ? "Hardware that disappears into the experience" : "Lightning fast")},
      body: ${JSON.stringify(isApple ? "A focused showcase for Mac, iPhone, Watch, AirPods, and Vision with generous whitespace and cinematic pacing." : "Optimized performance with instant load times and smooth interactions.")},
    },
    {
      title: ${JSON.stringify(isApple ? "Privacy as a product feature" : "Secure by default")},
      body: ${JSON.stringify(isApple ? "Messaging, layout, and calls to action are arranged around trust, control, and user-first design." : "Enterprise-grade security language and resilient UI states are baked into the surface.")},
    },
    {
      title: ${JSON.stringify(isApple ? "A services layer that feels native" : "Modular design")},
      body: ${JSON.stringify(isApple ? "Music, TV+, Fitness+, iCloud, and Apple Intelligence are framed as one calm ecosystem instead of scattered offers." : "Composable sections scale from quick prototype to production landing page.")},
    },
  ],
} as const;
`;

    const logoCode = `import React from "react";

/** Custom geometric wordmark for the generated landing page. */
export function Logo({ name }: { name: string }) {
  const initials = name
    .split(/\\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "L";

  return (
    <a href="#" className="group inline-flex items-center gap-3">
      <span className="relative grid h-10 w-10 place-items-center overflow-hidden rounded-2xl bg-[#1d1d1f] text-white shadow-lg shadow-black/10">
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,rgba(255,255,255,0.35),transparent_36%)]" />
        <span className="relative text-[13px] font-black tracking-tight">{initials}</span>
      </span>
      <span className="text-sm font-black tracking-tight text-[#1d1d1f] transition group-hover:text-black">
        {name}
      </span>
    </a>
  );
}
`;

    const metaCode = `export const PROJECT_META = {
  title: ${JSON.stringify(`${subject} Landing Page`)},
  audience: ${JSON.stringify(isApple ? "premium consumer technology customers" : "early product adopters")},
  authModes: ["Sign in", "Create account"] as const,
} as const;
`;

    const authPanelCode = `import React, { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import { PROJECT_META } from "../lib/project-meta";

type AuthMode = "signin" | "signup";

/** Interactive sign-in/sign-up panel with validation and success feedback. */
export function AuthPanel() {
  const [mode, setMode] = useState<AuthMode>("signup");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const errors = useMemo(() => {
    const next: Record<string, string> = {};
    if (mode === "signup" && name.trim().length > 0 && name.trim().length < 2) {
      next.name = "Use at least two characters.";
    }
    if (email && !/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) {
      next.email = "Enter a valid email.";
    }
    if (password && password.length < 8) {
      next.password = "Use 8+ characters.";
    }
    return next;
  }, [email, mode, name, password]);

  const canSubmit =
    Object.keys(errors).length === 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    (mode === "signin" || name.trim().length >= 2);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!canSubmit) return;
    setSubmitted(true);
    window.setTimeout(() => setSubmitted(false), 1800);
  };

  return (
    <section id="auth" className="px-6 pb-20 sm:px-10">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-[2rem] border border-black/5 bg-white shadow-2xl shadow-black/10 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="bg-[#1d1d1f] p-8 text-white sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/40">Member access</p>
          <h2 className="mt-4 text-4xl font-black tracking-tight">A polished account flow is part of the product.</h2>
          <p className="mt-4 text-sm leading-7 text-white/60">
            This landing page includes a real auth surface so visitors can move from curiosity to account creation without leaving the experience.
          </p>
          <ul className="mt-8 space-y-3 text-sm font-semibold text-white/70">
            {["Inline validation", "Password visibility toggle", "Success confirmation"].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-300" /> {item}
              </li>
            ))}
          </ul>
        </div>

        <form onSubmit={submit} className="p-6 sm:p-8">
          <div className="mb-6 inline-flex rounded-full bg-[#f5f5f7] p-1">
            {PROJECT_META.authModes.map((label) => {
              const nextMode: AuthMode = label === "Sign in" ? "signin" : "signup";
              const active = mode === nextMode;
              return (
                <button
                  key={label}
                  type="button"
                  onClick={() => setMode(nextMode)}
                  className={"rounded-full px-4 py-2 text-sm font-bold transition " + (active ? "bg-white text-[#1d1d1f] shadow-sm" : "text-[#6e6e73] hover:text-[#1d1d1f]")}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="space-y-4">
            {mode === "signup" ? (
              <label className="block">
                <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6e6e73]">Name</span>
                <span className="mt-1.5 flex items-center gap-2 rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 py-3 focus-within:border-[#0071e3]">
                  <User className="h-4 w-4 text-[#6e6e73]" />
                  <input value={name} onChange={(e) => setName(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="Avery Stone" />
                </span>
                {errors.name ? <span className="mt-1 block text-xs font-semibold text-red-500">{errors.name}</span> : null}
              </label>
            ) : null}

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6e6e73]">Email</span>
              <span className="mt-1.5 flex items-center gap-2 rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 py-3 focus-within:border-[#0071e3]">
                <Mail className="h-4 w-4 text-[#6e6e73]" />
                <input value={email} onChange={(e) => setEmail(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="you@example.com" />
              </span>
              {errors.email ? <span className="mt-1 block text-xs font-semibold text-red-500">{errors.email}</span> : null}
            </label>

            <label className="block">
              <span className="text-xs font-bold uppercase tracking-[0.16em] text-[#6e6e73]">Password</span>
              <span className="mt-1.5 flex items-center gap-2 rounded-2xl border border-black/10 bg-[#f5f5f7] px-4 py-3 focus-within:border-[#0071e3]">
                <Lock className="h-4 w-4 text-[#6e6e73]" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm font-semibold outline-none" placeholder="Minimum 8 characters" />
                <button type="button" onClick={() => setShowPassword((value) => !value)} className="text-[#6e6e73] transition hover:text-[#1d1d1f]">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </span>
              {errors.password ? <span className="mt-1 block text-xs font-semibold text-red-500">{errors.password}</span> : null}
            </label>
          </div>

          <button
            type="submit"
            disabled={!canSubmit}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#0071e3] px-5 py-3 text-sm font-black text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:bg-[#b9c7d8] disabled:shadow-none"
          >
            {submitted ? "Success" : mode === "signup" ? "Create account" : "Sign in"} <ArrowRight className="h-4 w-4" />
          </button>
        </form>
      </div>
    </section>
  );
}
`;

    const appCode = `import React from "react";
import { ArrowRight, Play, Shield, Sparkles, Zap } from "lucide-react";
import { AuthPanel } from "./components/AuthPanel";
import { Logo } from "./components/Logo";
import { PROJECT_META } from "./lib/project-meta";
import { LANDING_CONTENT } from "./data/landing-content";

/** A responsive, brand-aware landing page with hero, proof, features, and CTA sections. */
export default function LandingPage() {
  const productName = PROJECT_META.title.replace(/ Landing Page$/, "");

  return (
    <main className="min-h-screen overflow-hidden bg-[#f5f5f7] text-[#1d1d1f]">
      <nav className="sticky top-0 z-30 flex items-center justify-between border-b border-black/5 bg-[#f5f5f7]/90 px-6 py-4 sm:px-10">
        <Logo name={productName} />
        <div className="hidden items-center gap-7 text-sm font-semibold text-black/55 sm:flex">
          <a className="transition hover:text-black" href="#lineup">Lineup</a>
          <a className="transition hover:text-black" href="#ecosystem">Ecosystem</a>
          <a className="transition hover:text-black" href="#auth">Account</a>
        </div>
        <button className="rounded-full bg-[#1d1d1f] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-black/10 transition hover:-translate-y-0.5 hover:bg-black">
          {LANDING_CONTENT.primaryCta}
        </button>
      </nav>

      <section className="relative px-6 pb-20 pt-16 text-center sm:px-10 sm:pb-28 sm:pt-24">
        <div className="pointer-events-none absolute left-1/2 top-10 h-64 w-64 -translate-x-1/2 rounded-full bg-white/80 shadow-[0_0_120px_rgba(255,255,255,0.95)]" />
        <div className="relative mx-auto max-w-5xl">
          <p className="mb-5 text-sm font-bold uppercase tracking-[0.24em] text-[#6e6e73]">
            {LANDING_CONTENT.eyebrow}
          </p>
          <h1 className="mx-auto max-w-4xl text-5xl font-black leading-[0.95] tracking-tight sm:text-7xl">
            {LANDING_CONTENT.headline}
          </h1>
          <p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-[#6e6e73]">
            {LANDING_CONTENT.body}
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <button className="inline-flex items-center gap-2 rounded-full bg-[#0071e3] px-6 py-3 text-sm font-bold text-white shadow-xl shadow-blue-500/20 transition hover:-translate-y-0.5 hover:bg-[#0077ed]">
              {LANDING_CONTENT.primaryCta} <ArrowRight className="h-4 w-4" />
            </button>
            <button className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-white px-6 py-3 text-sm font-bold text-[#1d1d1f] transition hover:-translate-y-0.5 hover:border-black/20">
              <Play className="h-4 w-4" /> {LANDING_CONTENT.secondaryCta}
            </button>
          </div>
        </div>

        <div className="relative mx-auto mt-14 grid max-w-5xl gap-4 rounded-[2rem] border border-white bg-white/70 p-4 shadow-2xl shadow-black/10 sm:grid-cols-3">
          {LANDING_CONTENT.metrics.map((metric) => (
            <div key={metric.label} className="rounded-[1.5rem] bg-[#f5f5f7] p-6">
              <div className="text-3xl font-black">{metric.value}</div>
              <div className="mt-1 text-sm font-semibold text-[#6e6e73]">{metric.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section id="lineup" className="grid gap-5 px-6 pb-20 sm:px-10 lg:grid-cols-3">
        {LANDING_CONTENT.features.map((feature, index) => {
          const Icon = index === 0 ? Zap : index === 1 ? Shield : Sparkles;
          return (
            <article key={feature.title} className="group rounded-[2rem] border border-black/5 bg-white p-7 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/10">
              <div className="mb-10 grid h-12 w-12 place-items-center rounded-2xl bg-[#1d1d1f] text-white transition group-hover:scale-105">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">{feature.title}</h2>
              <p className="mt-4 text-sm leading-7 text-[#6e6e73]">{feature.body}</p>
            </article>
          );
        })}
      </section>

      <section id="ecosystem" className="mx-6 mb-8 rounded-[2rem] bg-[#1d1d1f] px-6 py-14 text-center text-white sm:mx-10">
        <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/45">{LANDING_CONTENT.brand}</p>
        <h2 className="mx-auto mt-4 max-w-3xl text-4xl font-black tracking-tight sm:text-5xl">
          One calm surface for a complete product story.
        </h2>
      </section>

      <AuthPanel />

      <footer className="px-6 py-8 text-center text-sm font-semibold text-[#6e6e73]">
        Concept landing page generated for {productName}. Built with React 19 + Tailwind CSS.
      </footer>
    </main>
  );
}
`;

    return {
      "src/data/landing-content.ts": contentCode,
      "src/lib/project-meta.ts": metaCode,
      "src/components/Logo.tsx": logoCode,
      "src/components/AuthPanel.tsx": authPanelCode,
      "src/App.tsx": appCode,
    };
  };

  const generateDashboardCode = (): Record<string, string> => {
    const typesCode = `import type { LucideIcon } from "lucide-react";

/** A single KPI stat displayed in a StatsCard. */
export interface Stat {
  label: string;
  value: string;
  change: string;
  icon: LucideIcon;
  up: boolean;
}

/** A row in the recent-orders table. */
export interface Order {
  id: string;
  customer: string;
  amount: string;
  status: "Completed" | "Processing" | "Pending";
}
`;

    const statsCardCode = `import React from "react";
import type { Stat } from "../types";

/** Displays a single KPI metric card with icon, value, and trend arrow. */
export function StatsCard({ icon: Icon, label, value, change, up }: Stat) {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 p-5 hover:bg-white/[0.07] transition">
      <div className="flex items-center justify-between mb-4">
        <span className="text-white/40 text-sm">{label}</span>
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <div className="text-2xl font-bold">{value}</div>
      <div className={"text-sm mt-1 " + (up ? "text-emerald-400" : "text-red-400")}>
        {change}
      </div>
    </div>
  );
}
`;

    const ordersTableCode = `import React from "react";
import { MoreHorizontal } from "lucide-react";
import type { Order } from "../types";

const ORDERS: Order[] = [
  { id: "#ORD-001", customer: "Alice Johnson", amount: "$249.00", status: "Completed" },
  { id: "#ORD-002", customer: "Bob Smith", amount: "$128.50", status: "Processing" },
  { id: "#ORD-003", customer: "Carol White", amount: "$542.00", status: "Completed" },
  { id: "#ORD-004", customer: "Dave Brown", amount: "$89.99", status: "Pending" },
  { id: "#ORD-005", customer: "Eve Davis", amount: "$310.00", status: "Completed" },
];

const statusClass = (s: Order["status"]) =>
  s === "Completed"
    ? "bg-emerald-400/10 text-emerald-400"
    : s === "Processing"
      ? "bg-amber-400/10 text-amber-400"
      : "bg-white/10 text-white/40";

/** Displays a scrollable table of recent orders with status badges. */
export function OrdersTable() {
  return (
    <div className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
      <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between">
        <h2 className="font-semibold">Recent Orders</h2>
        <button className="text-white/30 hover:text-white/60">
          <MoreHorizontal className="w-5 h-5" />
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-white/30 text-left">
              <th className="px-5 py-3 font-medium">Order</th>
              <th className="px-5 py-3 font-medium">Customer</th>
              <th className="px-5 py-3 font-medium">Amount</th>
              <th className="px-5 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {ORDERS.map((o) => (
              <tr
                key={o.id}
                className="border-t border-white/5 hover:bg-white/[0.03]"
              >
                <td className="px-5 py-3 font-mono text-white/50">{o.id}</td>
                <td className="px-5 py-3">{o.customer}</td>
                <td className="px-5 py-3 font-medium">{o.amount}</td>
                <td className="px-5 py-3">
                  <span
                    className={
                      "px-2.5 py-0.5 rounded-full text-xs font-medium " +
                      statusClass(o.status)
                    }
                  >
                    {o.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
`;

    const appCode = `import React from "react";
import { BarChart3, Users, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import { StatsCard } from "./components/StatsCard";
import { OrdersTable } from "./components/OrdersTable";
import type { Stat } from "./types";

const STATS: Stat[] = [
  { label: "Revenue", value: "$48,294", change: "+12.5%", icon: DollarSign, up: true },
  { label: "Users", value: "2,842", change: "+8.1%", icon: Users, up: true },
  { label: "Orders", value: "1,204", change: "-3.2%", icon: ShoppingCart, up: false },
  { label: "Growth", value: "24.8%", change: "+4.7%", icon: TrendingUp, up: true },
];

/** Analytics Dashboard — entry point. Composes StatsCard grid and OrdersTable. */
export default function Dashboard() {
  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-6 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-white/40 text-sm mt-1">
              Welcome back. Here's what's happening.
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition">
            <BarChart3 className="w-4 h-4" /> Reports
          </button>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          {STATS.map((stat) => (
            <StatsCard key={stat.label} {...stat} />
          ))}
        </div>

        <OrdersTable />
      </div>
    </div>
  );
}
`;

    return {
      "src/types.ts": typesCode,
      "src/components/StatsCard.tsx": statsCardCode,
      "src/components/OrdersTable.tsx": ordersTableCode,
      "src/App.tsx": appCode,
    };
  };

  const generateFormCode = (
    prompt: string,
  ) => `import React, { useState } from "react";
import { Mail, Lock, User, ArrowRight, Eye, EyeOff, CheckCircle2 } from "lucide-react";

/** A sign-up form with validation, show/hide password, and success state. */
export default function SignUpForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email.trim()) e.email = "Email is required";
    else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email)) e.email = "Invalid email format";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Password must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (ev: React.FormEvent) => {
    ev.preventDefault();
    if (validate()) setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-emerald-900 via-teal-900 to-emerald-900 p-4">
        <div className="text-center">
          <CheckCircle2 className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Welcome aboard!</h2>
          <p className="text-white/50">Your account has been created successfully.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-sm">
        <form onSubmit={handleSubmit} className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur">
          <h1 className="text-2xl font-bold text-white mb-1">Create account</h1>
          <p className="text-white/40 text-sm mb-6">Fill in the details to get started.</p>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Name</label>
              <div className="flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl bg-white/5 border " +
                (errors.name ? "border-red-400" : "border-white/10 focus-within:border-indigo-400")}>
                <User className="w-4 h-4 text-white/30 flex-shrink-0" />
                <input value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: "" })); }}
                  placeholder="Your name" className="bg-transparent text-white outline-none flex-1 text-sm placeholder-white/20" />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Email</label>
              <div className="flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl bg-white/5 border " +
                (errors.email ? "border-red-400" : "border-white/10 focus-within:border-indigo-400")}>
                <Mail className="w-4 h-4 text-white/30 flex-shrink-0" />
                <input value={email} onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: "" })); }}
                  placeholder="you@example.com" className="bg-transparent text-white outline-none flex-1 text-sm placeholder-white/20" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-white/60 uppercase tracking-wider">Password</label>
              <div className="flex items-center gap-2 mt-1.5 px-3 py-2.5 rounded-xl bg-white/5 border " +
                (errors.password ? "border-red-400" : "border-white/10 focus-within:border-indigo-400")}>
                <Lock className="w-4 h-4 text-white/30 flex-shrink-0" />
                <input type={showPw ? "text" : "password"} value={password}
                  onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: "" })); }}
                  placeholder="••••••" className="bg-transparent text-white outline-none flex-1 text-sm placeholder-white/20" />
                <button type="button" onClick={() => setShowPw((p) => !p)} className="text-white/30 hover:text-white/60">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
            </div>
          </div>

          <button type="submit"
            className="mt-6 w-full inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-500 hover:bg-indigo-400 px-4 py-3 text-sm font-semibold text-white transition">
            Create account <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}`;

  const generateWeatherCode = () => `import React, { useState } from "react";
import { Search, Cloud, CloudRain, Sun, Wind, Droplets } from "lucide-react";

/** A weather lookup app with mock data for demo cities. */
export default function WeatherApp() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("San Francisco");

  const weatherData: Record<string, { temp: number; condition: string; humidity: number; wind: number; icon: React.ElementType }> = {
    "san francisco": { temp: 64, condition: "Partly Cloudy", humidity: 72, wind: 8, icon: Cloud },
    "new york": { temp: 48, condition: "Rainy", humidity: 85, wind: 12, icon: CloudRain },
    "los angeles": { temp: 78, condition: "Sunny", humidity: 35, wind: 5, icon: Sun },
    "chicago": { temp: 38, condition: "Windy", humidity: 60, wind: 18, icon: Wind },
    "london": { temp: 52, condition: "Cloudy", humidity: 75, wind: 10, icon: Cloud },
  };

  const data = weatherData[query.toLowerCase()] ?? weatherData["san francisco"];
  const Icon = data.icon;

  const handleSearch = () => {
    const key = query.trim().toLowerCase();
    if (weatherData[key]) setCity(query.trim());
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-sky-900 via-blue-900 to-indigo-900 p-4">
      <div className="w-full max-w-sm">
        <div className="flex gap-2 mb-6">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter city..."
            className="flex-1 px-4 py-3 rounded-xl bg-white/10 border border-white/10 text-white placeholder-white/30 outline-none focus:border-sky-400 transition"
          />
          <button onClick={handleSearch} className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl transition">
            <Search className="w-5 h-5" />
          </button>
        </div>
        <div className="rounded-2xl bg-white/10 border border-white/10 p-6 text-center backdrop-blur">
          <h2 className="text-lg text-white/50 mb-1">{city}</h2>
          <Icon className="w-16 h-16 text-sky-300 mx-auto my-3" />
          <div className="text-6xl font-light text-white mb-2">{data.temp}°</div>
          <p className="text-white/60 text-lg">{data.condition}</p>
          <div className="flex justify-center gap-8 mt-6">
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Droplets className="w-4 h-4" /> {data.humidity}%
            </div>
            <div className="flex items-center gap-2 text-white/40 text-sm">
              <Wind className="w-4 h-4" /> {data.wind} mph
            </div>
          </div>
        </div>
        <p className="text-white/20 text-xs text-center mt-4">Try: San Francisco, New York, Los Angeles, Chicago, London</p>
      </div>
    </div>
  );
}`;

  const generateTimerCode =
    () => `import React, { useState, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";

/** A stopwatch with start, pause, reset, and lap functionality. */
export default function Stopwatch() {
  const [ms, setMs] = useState(0);
  const [running, setRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => setMs((p) => p + 10), 10);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running]);

  const format = (t: number) => {
    const m = Math.floor(t / 60000);
    const s = Math.floor((t % 60000) / 1000);
    const cs = Math.floor((t % 1000) / 10);
    return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0") + "." + String(cs).padStart(2, "0");
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      <div className="text-center">
        <Timer className="w-10 h-10 text-white/30 mx-auto mb-4" />
        <div className="text-7xl font-mono font-light tracking-tighter text-white mb-8 tabular-nums">{format(ms)}</div>
        <div className="flex items-center justify-center gap-3 mb-8">
          <button
            onClick={() => setRunning((p) => !p)}
            className={"inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition " +
              (running ? "bg-amber-500 hover:bg-amber-400 text-black" : "bg-emerald-500 hover:bg-emerald-400 text-black")}
          >
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
          </button>
          <button
            onClick={() => { setMs(0); setRunning(false); setLaps([]); }}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        {running && (
          <button onClick={() => setLaps((p) => [...p, ms])}
            className="text-sm text-white/40 hover:text-white/70 underline mb-4">Lap</button>
        )}
        {laps.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-1">
            {laps.map((l, i) => (
              <div key={i} className="text-white/30 text-sm font-mono">Lap {i + 1}: {format(l)}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}`;

  const generatePomodoroCode =
    () => `import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Brain } from "lucide-react";

/** A pomodoro timer with work/break cycles and session tracking. */
export default function Pomodoro() {
  const WORK = 25 * 60;
  const BREAK = 5 * 60;
  const [seconds, setSeconds] = useState(WORK);
  const [running, setRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const [sessions, setSessions] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (running) {
      intervalRef.current = setInterval(() => {
        setSeconds((p) => {
          if (p <= 1) {
            const nextBreak = !isBreak;
            setIsBreak(nextBreak);
            if (!isBreak) setSessions((s) => s + 1);
            return nextBreak ? BREAK : WORK;
          }
          return p - 1;
        });
      }, 1000);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [running, isBreak]);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return String(m).padStart(2, "0") + ":" + String(sec).padStart(2, "0");
  };

  const progress = isBreak
    ? ((BREAK - seconds) / BREAK) * 100
    : ((WORK - seconds) / WORK) * 100;

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-950 via-rose-950 to-red-950">
      <div className="text-center">
        <Brain className="w-10 h-10 text-rose-400 mx-auto mb-4" />
        <div className="text-sm text-rose-300/60 uppercase tracking-[0.2em] mb-2">
          {isBreak ? "Break Time" : "Focus Time"}
        </div>
        <div className="relative w-56 h-56 mx-auto mb-6">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
            <circle cx="50" cy="50" r="42" fill="none" stroke={isBreak ? "#34d399" : "#f43f5e"}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 42}
              strokeDashoffset={2 * Math.PI * 42 * (1 - progress / 100)}
              className="transition-[stroke-dashoffset] duration-1000 ease-linear" />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl font-mono font-light text-white tabular-nums">{fmt(seconds)}</span>
          </div>
        </div>
        <div className="flex items-center justify-center gap-3 mb-6">
          <button
            onClick={() => setRunning((p) => !p)}
            className={"inline-flex items-center gap-2 px-6 py-3 rounded-full font-semibold text-sm transition " +
              (running ? "bg-amber-500 hover:bg-amber-400 text-black" : "bg-rose-500 hover:bg-rose-400 text-white")}
          >
            {running ? <><Pause className="w-4 h-4" /> Pause</> : <><Play className="w-4 h-4" /> Start</>}
          </button>
          <button onClick={() => { setSeconds(WORK); setRunning(false); setIsBreak(false); }}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <p className="text-white/30 text-sm">Sessions completed: {sessions}</p>
      </div>
    </div>
  );
}`;

  const generateQuizCode = () => `import React, { useState } from "react";
import { CheckCircle2, XCircle, Trophy, RotateCcw } from "lucide-react";

const questions = [
  { q: "What does React use to update the DOM?", options: ["Real DOM", "Virtual DOM", "Shadow DOM", "HTML DOM"], answer: 1 },
  { q: "Which hook manages state in React?", options: ["useEffect", "useReducer", "useState", "useContext"], answer: 2 },
  { q: "What language is JSX based on?", options: ["JavaScript", "TypeScript", "Python", "Java"], answer: 0 },
  { q: "Which method renders a React element to the DOM in React 18?", options: ["render()", "createRoot().render()", "ReactDOM.create()", "hydrate()"], answer: 1 },
  { q: "What is the default export pattern for components?", options: ["module.exports", "export component", "export default function", "default export const"], answer: 2 },
] as const;

/** An interactive quiz with score tracking and review. */
export default function QuizApp() {
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [finished, setFinished] = useState(false);

  const handleAnswer = (idx: number) => {
    if (selected !== null) return;
    setSelected(idx);
    if (idx === questions[step].answer) setScore((s) => s + 1);
  };

  const next = () => {
    if (step + 1 < questions.length) {
      setStep((s) => s + 1);
      setSelected(null);
    } else {
      setFinished(true);
    }
  };

  const restart = () => { setStep(0); setScore(0); setSelected(null); setFinished(false); };

  if (finished) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-violet-950 p-4">
        <div className="text-center">
          <Trophy className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-white mb-2">Quiz Complete!</h2>
          <p className="text-2xl text-white/60 mb-6">{score} / {questions.length} correct</p>
          <button onClick={restart}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-violet-500 hover:bg-violet-400 text-white font-semibold transition">
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
        </div>
      </div>
    );
  }

  const q = questions[step];

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-violet-950 via-purple-950 to-violet-950 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-between mb-6">
          <span className="text-white/40 text-sm">Question {step + 1} of {questions.length}</span>
          <span className="text-white/40 text-sm">Score: {score}</span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-1.5 mb-8">
          <div className="bg-violet-400 h-1.5 rounded-full transition-all"
            style={{ width: ((step + (selected !== null ? 1 : 0)) / questions.length) * 100 + "%" }} />
        </div>
        <h2 className="text-xl font-semibold text-white mb-6">{q.q}</h2>
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            let cls = "bg-white/10 border-white/10 text-white";
            if (selected !== null) {
              if (i === q.answer) cls = "bg-emerald-500/20 border-emerald-400 text-emerald-400";
              else if (i === selected) cls = "bg-red-500/20 border-red-400 text-red-400";
              else cls = "bg-white/5 border-white/5 text-white/30";
            }
            return (
              <button key={i} onClick={() => handleAnswer(i)}
                className={"w-full flex items-center justify-between px-4 py-3.5 rounded-xl border transition text-left " + cls}>
                <span>{opt}</span>
                {selected !== null && i === q.answer && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                {selected === i && i !== q.answer && <XCircle className="w-5 h-5 text-red-400" />}
              </button>
            );
          })}
        </div>
        {selected !== null && (
          <button onClick={next}
            className="mt-6 w-full py-3 rounded-xl bg-violet-500 hover:bg-violet-400 text-white font-semibold transition">
            {step + 1 < questions.length ? "Next Question" : "See Results"}
          </button>
        )}
      </div>
    </div>
  );
}`;

  const generateChatCode =
    () => `import React, { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";

interface Msg { id: number; role: "user" | "bot"; text: string; }

const responses = [
  "That's interesting! Tell me more.",
  "I see what you mean. Can you elaborate?",
  "Great point! I hadn't thought of it that way.",
  "Thanks for sharing that with me.",
  "Let me think about that for a moment...",
  "That's a really good question!",
  "I appreciate your perspective on this.",
  "Interesting — what makes you say that?",
];

/** A simple chat interface with auto-reply simulation. */
export default function ChatApp() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: 0, role: "bot", text: "Hi there! How can I help you today?" },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const send = () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: Msg = { id: Date.now(), role: "user", text };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setTimeout(() => {
      const botMsg: Msg = { id: Date.now() + 1, role: "bot", text: responses[Math.floor(Math.random() * responses.length)] };
      setMessages((p) => [...p, botMsg]);
    }, 600 + Math.random() * 800);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4">
      <div className="w-full max-w-md h-[600px] flex flex-col rounded-2xl bg-white/5 border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
          <Bot className="w-5 h-5 text-indigo-400" />
          <span className="text-white font-semibold text-sm">Chat Assistant</span>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((m) => (
            <div key={m.id} className={"flex gap-2 " + (m.role === "user" ? "justify-end" : "")}>
              {m.role === "bot" && (
                <div className="grid h-7 w-7 place-items-center rounded-full bg-indigo-500/20 flex-shrink-0">
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                </div>
              )}
              <div className={"max-w-[80%] px-4 py-2.5 rounded-2xl text-sm " +
                (m.role === "user"
                  ? "bg-indigo-500 text-white rounded-br-md"
                  : "bg-white/10 text-white/80 rounded-bl-md")}>
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="grid h-7 w-7 place-items-center rounded-full bg-white/10 flex-shrink-0">
                  <User className="w-3.5 h-3.5 text-white/40" />
                </div>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
        <div className="p-3 border-t border-white/10 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/5 text-white placeholder-white/20 outline-none focus:border-indigo-400 text-sm transition"
          />
          <button onClick={send}
            className="px-4 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white rounded-xl transition">
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}`;

  const generateDrawingCode =
    () => `import React, { useRef, useState, useEffect } from "react";
import { Eraser, RotateCcw, Palette } from "lucide-react";

const colors = ["#ffffff", "#f43f5e", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#000000"];

/** A simple canvas drawing app with color selection and clear. */
export default function DrawingApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [drawing, setDrawing] = useState(false);
  const [color, setColor] = useState("#ffffff");
  const [lineW] = useState(3);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1e1e2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    if ("touches" in e) {
      return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    setDrawing(true);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawing) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.stroke();
  };

  const stopDraw = () => setDrawing(false);

  const clear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#1e1e2e";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#11111b] p-4">
      <div className="flex flex-col items-center gap-4">
        <div className="flex items-center gap-2">
          <Palette className="w-5 h-5 text-white/50" />
          <div className="flex gap-1.5">
            {colors.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={"w-7 h-7 rounded-full border-2 transition " +
                  (c === color ? "border-white scale-110" : "border-transparent")}
                style={{ backgroundColor: c }} />
            ))}
          </div>
          <div className="w-px h-6 bg-white/20 mx-1" />
          <button onClick={clear} className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white/60 hover:text-white transition">
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <canvas
          ref={canvasRef}
          width={500}
          height={400}
          className="rounded-xl border border-white/10 cursor-crosshair touch-none"
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={stopDraw}
          onMouseLeave={stopDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={stopDraw}
        />
      </div>
    </div>
  );
}`;

  const generateColorPickerCode =
    () => `import React, { useState } from "react";
	import { Copy, Check } from "lucide-react";

/** An interactive color picker with hex/rgb display and copy-to-clipboard. */
export default function ColorPicker() {
  const [color, setColor] = useState("#6366f1");
  const [copied, setCopied] = useState(false);

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return rgb(r, g, b) + "";
  };

  const copy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="rounded-2xl bg-white/5 border border-white/10 p-8 w-80 backdrop-blur">
        <div className="w-full h-48 rounded-xl mb-6 shadow-lg transition-all" style={{ backgroundColor: color }} />
        <div className="flex items-center gap-3 mb-4">
          <input type="color" value={color} onChange={(e) => setColor(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer border-0 bg-transparent" />
          <div className="flex-1">
            <button onClick={() => copy(color)}
              className="flex items-center gap-2 text-white text-lg font-mono hover:text-indigo-400 transition">
              {color} {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-white/30" />}
            </button>
            <button onClick={() => copy(hexToRgb(color))}
              className="text-white/40 text-sm font-mono hover:text-white/70 transition">{hexToRgb(color)}</button>
          </div>
        </div>
      </div>
    </div>
	  );
	}`;

  const generateHabitTrackerCode = (): Record<string, string> => {
    const typesCode = `export interface Habit {
  id: string;
  name: string;
  area: "Mind" | "Body" | "Work" | "Home";
  streak: number;
  target: number;
  doneToday: boolean;
}

export interface HabitInsight {
  label: string;
  value: string;
  detail: string;
}
`;

    const dataCode = `import type { Habit, HabitInsight } from "../types";

export const INITIAL_HABITS: Habit[] = [
  { id: "hydrate", name: "Hydrate before coffee", area: "Body", streak: 12, target: 21, doneToday: true },
  { id: "journal", name: "Ten-minute journal", area: "Mind", streak: 8, target: 14, doneToday: false },
  { id: "deep-work", name: "Deep work sprint", area: "Work", streak: 15, target: 30, doneToday: true },
  { id: "reset", name: "Evening reset", area: "Home", streak: 5, target: 10, doneToday: false },
];

export const HABIT_INSIGHTS: HabitInsight[] = [
  { label: "Weekly consistency", value: "86%", detail: "Up 12% from last week" },
  { label: "Best streak", value: "15", detail: "Deep work sprint" },
  { label: "Focus area", value: "Mind", detail: "2 habits need attention" },
];
`;

    const hookCode = `import { useMemo, useState } from "react";
import type { Habit } from "../types";
import { INITIAL_HABITS } from "../data/habits";

/** Manages habit completion, streak changes, and dashboard progress metrics. */
export function useHabitTracker() {
  const [habits, setHabits] = useState<Habit[]>(INITIAL_HABITS);

  const toggleHabit = (id: string) => {
    setHabits((items) =>
      items.map((habit) =>
        habit.id === id
          ? {
              ...habit,
              doneToday: !habit.doneToday,
              streak: Math.max(0, habit.streak + (habit.doneToday ? -1 : 1)),
            }
          : habit,
      ),
    );
  };

  const progress = useMemo(() => {
    const done = habits.filter((habit) => habit.doneToday).length;
    return Math.round((done / habits.length) * 100);
  }, [habits]);

  return { habits, progress, toggleHabit };
}
`;

    const dashboardCode = `import React from "react";
import { Check, Circle, Flame, Sparkles } from "lucide-react";
import type { Habit } from "../types";
import { HABIT_INSIGHTS } from "../data/habits";

const areaTone: Record<Habit["area"], string> = {
  Mind: "bg-violet-100 text-violet-700",
  Body: "bg-emerald-100 text-emerald-700",
  Work: "bg-blue-100 text-blue-700",
  Home: "bg-amber-100 text-amber-700",
};

/** Renders the polished habit dashboard with stats, habit toggles, and streak feedback. */
export function HabitDashboard({
  habits,
  progress,
  onToggle,
}: {
  habits: Habit[];
  progress: number;
  onToggle: (id: string) => void;
}) {
  return (
    <main className="min-h-screen bg-[#f6f4ef] p-5 text-[#24211d] sm:p-8">
      <section className="mx-auto max-w-6xl">
        <nav className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-[#24211d] text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight">Ritual OS</h1>
              <p className="text-sm font-medium text-[#7a746b]">Premium daily habit tracker</p>
            </div>
          </div>
          <div className="rounded-full bg-white px-4 py-2 text-sm font-bold shadow-sm">
            {progress}% today
          </div>
        </nav>

        <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <section className="rounded-[2rem] bg-[#24211d] p-7 text-white shadow-2xl shadow-[#24211d]/15">
            <p className="text-sm font-bold uppercase tracking-[0.22em] text-white/40">Today</p>
            <h2 className="mt-3 max-w-xl text-4xl font-black tracking-tight sm:text-5xl">
              Build a chain your future self can trust.
            </h2>
            <div className="mt-8 h-3 overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-emerald-300 transition-all duration-500" style={{ width: progress + "%" }} />
            </div>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              {HABIT_INSIGHTS.map((item) => (
                <article key={item.label} className="rounded-2xl bg-white/10 p-4">
                  <div className="text-2xl font-black">{item.value}</div>
                  <div className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/40">{item.label}</div>
                  <p className="mt-2 text-sm text-white/60">{item.detail}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[2rem] bg-white p-5 shadow-xl shadow-black/5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-black">Habit stack</h2>
              <span className="rounded-full bg-[#f6f4ef] px-3 py-1 text-xs font-bold text-[#7a746b]">
                {habits.filter((habit) => habit.doneToday).length}/{habits.length} complete
              </span>
            </div>
            <div className="space-y-3">
              {habits.map((habit) => (
                <button
                  key={habit.id}
                  onClick={() => onToggle(habit.id)}
                  className="group flex w-full items-center gap-4 rounded-2xl border border-black/5 bg-[#fbfaf7] p-4 text-left transition hover:-translate-y-0.5 hover:border-black/10 hover:shadow-lg hover:shadow-black/5"
                >
                  <span className={"grid h-10 w-10 place-items-center rounded-full transition " + (habit.doneToday ? "bg-emerald-500 text-white" : "bg-white text-[#a09a91]")}>
                    {habit.doneToday ? <Check className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold">{habit.name}</span>
                    <span className="mt-1 flex items-center gap-2 text-sm text-[#7a746b]">
                      <span className={"rounded-full px-2 py-0.5 text-xs font-bold " + areaTone[habit.area]}>{habit.area}</span>
                      <Flame className="h-4 w-4 text-orange-500" /> {habit.streak}/{habit.target} day streak
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
`;

    const appCode = `import React from "react";
import { useHabitTracker } from "./hooks/useHabitTracker";
import { HabitDashboard } from "./components/HabitDashboard";

/** Habit Tracker — entry point. Connects habit state to the premium dashboard UI. */
export default function HabitTracker() {
  const tracker = useHabitTracker();
  return <HabitDashboard {...tracker} />;
}
`;

    return {
      "src/types.ts": typesCode,
      "src/data/habits.ts": dataCode,
      "src/hooks/useHabitTracker.ts": hookCode,
      "src/components/HabitDashboard.tsx": dashboardCode,
      "src/App.tsx": appCode,
    };
  };

  const generateGenericCode = (prompt: string): Record<string, string> => {
    const subject = buildVibeProjectTitle(prompt);
    const contentCode = `export const PRODUCT_BRIEF = {
  title: ${JSON.stringify(subject)},
  eyebrow: "Interactive product",
  promise: "A polished, usable first screen with real controls, thoughtful states, and a clear product direction.",
  highlights: [
    "Responsive interface",
    "Stateful controls",
    "Production-style polish",
  ],
} as const;

export const FEATURE_CARDS = [
  { label: "Overview", detail: "A clean operational surface focused on the actual product experience." },
  { label: "Controls", detail: "Primary and secondary actions with hover, focus, and selected states." },
  { label: "Details", detail: "Supporting panels that make the screen feel ready instead of placeholder." },
] as const;
`;

    const surfaceCode = `import React, { useState } from "react";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { FEATURE_CARDS, PRODUCT_BRIEF } from "../data/product-brief";

/** Renders a polished custom product surface matched to the user's request. */
export function CustomProjectSurface() {
  const [active, setActive] = useState(0);
  const activeFeature = FEATURE_CARDS[active];

  return (
    <main className="min-h-screen bg-[#0d1117] p-6 text-white sm:p-10">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-5xl flex-col justify-center">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-400/20">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-cyan-300">{PRODUCT_BRIEF.eyebrow}</p>
            <h1 className="text-2xl font-black tracking-tight">{PRODUCT_BRIEF.title}</h1>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <article className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-7 shadow-2xl shadow-black/20">
            <p className="text-sm font-semibold text-white/45">Live product surface</p>
            <h2 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">{PRODUCT_BRIEF.title}</h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/60">{PRODUCT_BRIEF.promise}</p>
            <button className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:-translate-y-0.5">
              Open workspace <ArrowRight className="h-4 w-4" />
            </button>
          </article>

          <aside className="rounded-[2rem] bg-white p-5 text-slate-950">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-black">Product details</h3>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-500">
                {activeFeature.label}
              </span>
            </div>
            <div className="space-y-3">
              {FEATURE_CARDS.map((feature, index) => (
                <button
                  key={feature.label}
                  onClick={() => setActive(index)}
                  className={"flex w-full items-start gap-3 rounded-2xl p-4 text-left transition " +
                    (index === active ? "bg-slate-950 text-white shadow-lg shadow-slate-950/10" : "bg-slate-50 hover:bg-slate-100")}
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-cyan-400" />
                  <span>
                    <span className="block font-bold">{feature.label}</span>
                    <span className={index === active ? "text-sm text-white/60" : "text-sm text-slate-500"}>{feature.detail}</span>
                  </span>
                </button>
              ))}
            </div>
          </aside>
        </div>
      </section>
    </main>
  );
}
`;

    const appCode = `import React from "react";
import { CustomProjectSurface } from "./components/CustomProjectSurface";

/** Custom Build — entry point for the generated product surface. */
export default function CustomBuild() {
  return <CustomProjectSurface />;
}
`;

    return {
      "src/data/product-brief.ts": contentCode,
      "src/components/CustomProjectSurface.tsx": surfaceCode,
      "src/App.tsx": appCode,
    };
  };

  const countSourceLines = (source: string) =>
    source.length === 0 ? 0 : source.split("\n").length;

  const relFromProjectRoot = (projectRoot: string, fullPath: string) =>
    fullPath.startsWith(`${projectRoot}/`)
      ? fullPath.slice(projectRoot.length + 1)
      : fullPath;

  const countChangedOrRemovedLines = (before: string, after: string) => {
    const beforeLines = before.split("\n");
    const afterLines = after.split("\n");
    let changed = 0;
    for (let i = 0; i < beforeLines.length; i++) {
      if (afterLines[i] === undefined || beforeLines[i] !== afterLines[i]) {
        changed++;
      }
    }
    return changed;
  };

  const applyPromptEditToSource = (source: string, prompt: string) => {
    const p = prompt.toLowerCase();
    let next = source;

    if (/(dark|darker|black|night|background)/.test(p)) {
      next = next
        .replaceAll(
          "from-slate-900 via-slate-800 to-slate-900",
          "from-black via-slate-950 to-[#020617]",
        )
        .replaceAll(
          "from-indigo-950 via-slate-950 to-black",
          "from-black via-[#020617] to-black",
        )
        .replaceAll(
          "from-slate-950 via-indigo-950 to-slate-950",
          "from-black via-slate-950 to-[#020617]",
        )
        .replaceAll("bg-[#f5f5f7]", "bg-[#05070a]")
        .replaceAll("bg-[#1d1d1f]", "bg-black")
        .replaceAll("bg-[#0d1117]", "bg-[#05070a]")
        .replaceAll("bg-slate-900", "bg-black")
        .replaceAll("bg-slate-800", "bg-slate-950")
        .replaceAll("bg-white/70", "bg-white/[0.07]")
        .replaceAll("bg-white/90", "bg-slate-950/90")
        .replace(/\bbg-white\b(?![\/\[])/g, "bg-white/[0.06]")
        .replaceAll("text-[#1d1d1f]", "text-white")
        .replaceAll("text-[#6e6e73]", "text-white/58")
        .replaceAll("text-black/55", "text-white/55")
        .replaceAll("text-black", "text-white")
        .replaceAll("border-black/5", "border-white/10")
        .replaceAll("border-black/10", "border-white/15")
        .replaceAll("border-black/20", "border-white/25")
        .replaceAll("shadow-black/10", "shadow-black/35")
        .replaceAll("bg-white/[0.06]", "bg-white/[0.035]")
        .replaceAll("border-white/10", "border-white/[0.08]");
    }

    if (/(bigger|larger|increase size|make.*big)/.test(p)) {
      next = next
        .replaceAll("text-sm", "text-base")
        .replaceAll("text-base", "text-lg")
        .replaceAll("text-2xl", "text-3xl")
        .replaceAll("text-4xl", "text-5xl");
    }

    if (/(rounded|softer|smooth)/.test(p)) {
      next = next
        .replaceAll("rounded-xl", "rounded-2xl")
        .replaceAll("rounded-2xl", "rounded-3xl")
        .replaceAll("duration-200", "duration-300");
    }

    return next;
  };

  const buildFollowUpFileMap = (
    userPrompt: string,
    projectRoot: string,
    existingFiles: Record<string, string>,
    fallbackFileMap: Record<string, string>,
  ) => {
    const existingRelFiles: Record<string, string> = {};
    for (const [fullPath, body] of Object.entries(existingFiles)) {
      if (!fullPath.startsWith(`${projectRoot}/`)) continue;
      existingRelFiles[relFromProjectRoot(projectRoot, fullPath)] = body;
    }

    const candidateRelPaths = Object.keys(existingRelFiles).filter((rel) =>
      /^src\/.*\.(tsx|ts|jsx|js|css)$/i.test(rel),
    );
    const changed: Record<string, string> = {};
    const removedByRel: Record<string, number> = {};

    for (const rel of candidateRelPaths) {
      const original = existingRelFiles[rel]!;
      const edited = applyPromptEditToSource(original, userPrompt);
      if (edited !== original) {
        changed[rel] = edited;
        removedByRel[rel] = countChangedOrRemovedLines(original, edited);
      }
    }

    if (Object.keys(changed).length === 0) {
      const appRel = existingRelFiles["src/App.tsx"]
        ? "src/App.tsx"
        : candidateRelPaths[0];
      if (appRel) {
        const original = existingRelFiles[appRel]!;
        const note = `\n\n/** Follow-up request noted: ${userPrompt.replace(/\*\//g, "* /")} */`;
        changed[appRel] = original.includes("Follow-up request noted:")
          ? original
          : `${original}${note}`;
        removedByRel[appRel] = 0;
      }
    }

    return {
      fileMap: Object.keys(changed).length > 0 ? changed : fallbackFileMap,
      removedByRel,
    };
  };

  const buildLocalVibeFallback = (
    userPrompt: string,
    projectRoot: string,
    isFollowUp: boolean,
    existingFiles: Record<string, string> = {},
  ) => {
    const requestedKind = detectProjectKind(userPrompt);
    const existingProjectKind = detectProjectKind(
      `${projectRoot} ${Object.keys(existingFiles).join(" ")}`,
    );
    const kind =
      isFollowUp &&
      requestedKind === "generic" &&
      existingProjectKind !== "generic"
        ? existingProjectKind
        : requestedKind;
    const kindLabel = projectKindLabel(kind);
    const label = isFollowUp ? kindLabel : buildVibeProjectTitle(userPrompt);
    const creativeProfile = buildVibeCreativeProfile(
      kind,
      userPrompt,
      projectRoot,
      `local-${Date.now()}`,
    );
    const baseFileMap = generateAppCode(kind, userPrompt, projectRoot);
    const existingFilePaths = Object.keys(existingFiles).filter((path) =>
      path.startsWith(projectRoot),
    );
    const canApplyScopedFollowUp =
      isFollowUp &&
      existingFilePaths.length > 0 &&
      isVibeFileMapCompatibleWithKind(kind, existingFiles, projectRoot);
    const followUpEdit = canApplyScopedFollowUp
      ? buildFollowUpFileMap(
          userPrompt,
          projectRoot,
          existingFiles,
          baseFileMap,
        )
      : null;
    const fileMap = followUpEdit?.fileMap ?? baseFileMap;
    const removedByRel = followUpEdit?.removedByRel ?? {};
    const appFileEntries = Object.entries(fileMap);
    const analyzeBlocks =
      isFollowUp && existingFilePaths.length > 0
        ? `${existingFilePaths
            .map(
              (path) => `<<<VIBE_ANALYZE path="${path}">>>
<<<END_VIBE_ANALYZE>>>`,
            )
            .join("\n")}
I have finished reading the existing sandbox files for this project. Now I can make the requested change without rebuilding unrelated parts, keeping the work scoped to the files that actually need to move.
`
        : "";

    const isMultiFile = appFileEntries.length > 1;

    const codeBlock = (
      file: string,
      body: string,
      removed = 0,
    ) => `<<<VIBE_CODE file="${file}" added="${body.split("\n").length}" removed="${removed}">>>
${body}
<<<END_VIBE_CODE>>>`;

    const describeRelFile = (relPath: string) => {
      if (/types?\.(ts|tsx)$/i.test(relPath)) {
        return "the shared contract layer so the rest of the build has typed boundaries";
      }
      if (/data|content|constants/i.test(relPath)) {
        return "the product data and copy model so the UI is driven by meaningful content";
      }
      if (/hooks?\//i.test(relPath) || /^src\/hooks/i.test(relPath)) {
        return "the state and interaction logic so components stay focused on presentation";
      }
      if (/components\//i.test(relPath)) {
        return "a focused UI component with its own states and responsive behavior";
      }
      if (/App\.(tsx|jsx|ts|js)$/i.test(relPath)) {
        return "the app composition layer that wires the generated product together";
      }
      return "a focused support module required by the generated product";
    };

    // Build multi-file code blocks with transition prose between them
    const appCodeBlocks = appFileEntries
      .map(([relPath, code], index) => {
        const fullPath = `${projectRoot}/${relPath}`;
        const fileName = relPath.split("/").pop() || relPath;
        const isFirst = index === 0;
        const isLast = index === appFileEntries.length - 1;
        let prose: string;
        if (!isMultiFile) {
          prose = `Now I am wiring the React entry point. This file defines the full ${label.toLowerCase()} with all its interactive elements, state management, and visual polish. Every piece lives safely inside the vibe-project sandbox namespace with no access to Clyra's host source tree.`;
        } else if (isFirst) {
          prose = `I am starting the implementation map with ${fileName}. This is ${describeRelFile(relPath)}, and it sets up the rest of the ${label.toLowerCase()} without collapsing everything into one file.`;
        } else if (isLast) {
          prose = `Now I am closing the dependency chain with ${fileName}. This imports the lower-level modules and mounts the finished ${label.toLowerCase()} as the sandbox entry point.`;
        } else {
          prose = `Next I am adding ${fileName}. This is ${describeRelFile(relPath)}, so the generated project feels like a real connected codebase instead of disconnected snippets.`;
        }
        if (isFollowUp) {
          prose = `Now I am applying the requested change to ${fileName}. The edit is scoped to ${describeRelFile(relPath)}, preserving the existing ${label.toLowerCase()} identity while moving the file that needs to change.`;
        }
        return `${prose}\n${codeBlock(fullPath, code, removedByRel[relPath] ?? 0)}`;
      })
      .join("\n");

    const scaffoldBlocks = isFollowUp
      ? `Read is complete. I have enough context to edit the existing ${label.toLowerCase()} without rebuilding unrelated files.`
      : `This is a fresh project, so I am mapping the product surface and writing the sandbox source files directly.`;

    return `<<<VIBE_THINKING>>>
Build session
Active agent: Build
Phase: Interpret
Intent: ${userPrompt}
Context: ${isFollowUp ? `Existing ${kindLabel} files are available in ${projectRoot}; read before edit.` : `Brand-new ${kindLabel}; there are no generated files to read yet.`}
Creative profile:
${creativeProfile}
TodoWrite: ${isMultiFile ? `in_progress: write ${appFileEntries.length} focused source files; pending: verify sandbox output` : "in_progress: write the focused source file; pending: verify sandbox output"}
Next tool: ${isFollowUp ? "Read" : "Write"}
Why: ${isFollowUp ? "Follow-up changes must preserve the existing project identity." : "Build mode writes product files directly when no prior files exist."}
<<<END_VIBE_THINKING>>>
${scaffoldBlocks}
${analyzeBlocks}
<<<VIBE_THINKING>>>
Build session
Active agent: ${isFollowUp ? "Explore" : "General"}
Phase: ${isFollowUp ? "Discover" : "Design"}
Context: ${isFollowUp ? "Read completed for the relevant generated files." : "Read skipped because this is the first message for this generated project."}
TodoWrite: completed: establish context; in_progress: map connected files; pending: write source files; pending: run verification
Next tool: Write/Edit
Why: The preview needs a connected multi-file product under ${projectRoot}, not process documentation or a workflow mockup.
<<<END_VIBE_THINKING>>>
${appCodeBlocks}
<<<VIBE_THINKING>>>
Build session
Active agent: Build
Phase: Verify
Context: ${isMultiFile ? `${appFileEntries.length} source files are written.` : "The source file is written."}
TodoWrite: completed: write source files; in_progress: verify sandbox output
Next tool: Bash
Why: The build needs verification before returning the final summary.
<<<END_VIBE_THINKING>>>
I am now wrapping up with a verification pass. Running a quick lint check confirms the generated React file is structurally sound, all imports resolve within the sandbox, and the component exports are ready for the live preview server to pick up.
<<<VIBE_RUN>>>
RUNNING COMMAND
$ npm run lint
Purpose: validate the generated React file shape
	OUTPUT
	Command prepared for the sandbox preview. The host app also runs its own TypeScript checks before shipping.
		<<<END_VIBE_RUN>>>
Done! Here's what I built — ${isFollowUp ? `the requested update to the existing ${label.toLowerCase()}` : `a complete ${label.toLowerCase()} with a real multi-step file build`}.
Main features:
- ${isMultiFile ? "Multi-file project structure with separated state, UI, and app wiring" : "Focused React component with complete interaction logic"}
- Product-specific styling, responsive layout, and useful controls
- Sandboxed preview files kept inside ${projectRoot}
Controls / usage:
- Open the live preview — inspect the finished project after generation completes
- Continue in this chat — follow-up requests edit the same project folder
Polish and reliability:
- Verification step prepared before preview handoff
- Generated files stay isolated from the host app
- Follow-up mode reads existing files before applying changes`;
  };

  const streamLocalVibeFallback = async (
    aiMsgId: string,
    streamChatId: string,
    fallback: string,
  ) => {
    let full = "";
    const chunks = fallback.match(/[\s\S]{1,1200}/g) ?? [fallback];
    for (const chunk of chunks) {
      full = sanitizeVibeAgentContent(full + chunk);
      patchMessagesForChat(streamChatId, (prev) =>
        prev.map((msg) =>
          msg.id === aiMsgId
            ? { ...msg, content: full, isThinking: false, isStreaming: true }
            : msg,
        ),
      );
      await new Promise((resolve) => window.setTimeout(resolve, 8));
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
    isFollowUp: boolean = false,
    projectRoot: string = buildVibeProjectRoot(userPrompt),
    existingFiles: Record<string, string> = {},
  ) => {
    setVibePlaybackMessageId(aiMsgId);
    setVibePreviewMessageId(null);
    setVibePreviewFiles(isFollowUp ? existingFiles : null);
    setIsVibePreviewVisible(false);
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
      let full = "";
      const requestedKindForPrompt = detectProjectKind(userPrompt);
      const existingKindForPrompt = detectProjectKind(
        `${projectRoot} ${Object.keys(existingFiles).join(" ")}`,
      );
      const expectedKindForPrompt =
        isFollowUp &&
        requestedKindForPrompt === "generic" &&
        existingKindForPrompt !== "generic"
          ? existingKindForPrompt
          : requestedKindForPrompt;
      const creativeProfile = buildVibeCreativeProfile(
        expectedKindForPrompt,
        userPrompt,
        projectRoot,
        aiMsgId,
      );

      const existingFileContext =
        isFollowUp && Object.keys(existingFiles).length > 0
          ? `\nEXISTING PROJECT FILES (read these first, then edit only what is necessary):\n${Object.entries(
              existingFiles,
            )
              .filter(([path]) => path.startsWith(projectRoot))
              .map(([path, body]) => `\nFILE: ${path}\n${body.slice(0, 12000)}`)
              .join("\n")}\n`
          : "";

      const followUpInstructions = `
FOLLOW-UP MODE — build agent.

EXPECTED PROJECT SHAPE: ${expectedKindForPrompt}. Preserve this product type even if the user's follow-up is a small visual or copy change.

Use read-before-edit discipline:
- Emit <<<VIBE_ANALYZE path="...">>> blocks for the relevant existing project files before editing.
- Read enough context to understand the current architecture, then modify only the files that need changes.
- Do not rebuild the whole project, do not create plan.md, and do not turn the product into a workflow/status page.
${existingFileContext}
`;

      const openAiMessages = [
        {
          role: "user",
          content: `${isFollowUp ? followUpInstructions + "\n" : ""}You are Clyra's build agent running inside Vibe Coder. Use a dynamic tool loop, not the old fixed Vibe order.

PROJECT ROOT FOR THIS REQUEST:
${projectRoot}

PROJECT UNIQUENESS SEED:
${projectRoot}|chat:${streamChatId}|message:${aiMsgId}|time:${Date.now()}

CREATIVE PROFILE FOR THIS RUN:
${creativeProfile}

SESSION MODE:
${isFollowUp ? "Follow-up build session. Existing files are provided below; read relevant files first with <<<VIBE_ANALYZE>>> and edit surgically." : "Brand-new build session. No generated files exist yet; skip Read/Analyze and write the product files directly."}

AVAILABLE UI TOOL ENCODING:
  - <<<VIBE_THINKING>>> = reasoning/status/TodoWrite snapshot/next tool decision
  - <<<VIBE_ANALYZE path="...">>> = Read existing generated file
  - <<<VIBE_CODE file="..." added="N" removed="M">>> = Write/Edit/ApplyPatch complete final file body
  - <<<VIBE_RUN>>> = Bash verification

BUILD AGENT RULES:
  - Use the Build agent by default. Use Plan as a visible reasoning phase only when the user asks for planning or the architecture is blocked. Use Explore for reading existing generated files on follow-ups. Use General for broader multi-step product reasoning. Use Scout only for external docs/library uncertainty.
  - Choose tools dynamically. There is no mandatory plan.md, mandatory first file, fixed step count, or required reflection cadence.
  - Do not create plan.md, README.md, or process docs unless explicitly requested.
  - For complex work, use a short TodoWrite-style status inside thinking, then continue building. Keep one in-progress todo at a time.
  - Think in connected files: types/data/hooks/components/App/verification. Do not generate unrelated snippets.
  - First message: do not read files. Follow-up messages: read the existing generated files that matter before editing.
  - Non-trivial products should be multi-file and visibly follow the creative profile above. Tiny edits can stay tiny.
  - Preserve the requested product shape. Never generate an agent workflow UI unless the user asked for one.
  - Repeated prompts must still produce distinct projects. Use the uniqueness seed to vary concept, visual direction, copy, mechanics, sample data, and interaction details.
  - Use initiative: landing pages need real marketing sections plus sign-in/sign-up auth surfaces; games need playable mechanics, scoring, states, and controls; tools need validation, edge states, and useful workflows.
  - Verify before final summary. Do not emit another thinking panel after verification.
  - The host owns provider/model selection through the Clyra API. Do not mention model choices or provider internals.
  - Never mention the underlying harness or implementation name in thought process text, transition prose, final summary, generated UI copy, or code comments. In particular, never say OpenCode, opencode, Aider, or Archon.

FINAL SUMMARY FORMAT (plain text outside delimiters, after <<<VIBE_RUN>>>):
Done! Here's what I built — {SHORT_DESCRIPTION_OF_RESULT}.
Main features:
- {CORE_FEATURE_1}
- {CORE_FEATURE_2}
- {CORE_FEATURE_3}
Controls / usage:
- {CONTROL_OR_ACTION_1} — {WHAT_IT_DOES}
- {CONTROL_OR_ACTION_2} — {WHAT_IT_DOES}
Polish and reliability:
- {ERROR_HANDLING_OR_VALIDATION}
- {UI_OR_ANIMATION_IMPROVEMENT}
- {PERFORMANCE_OR_EDGE_CASE_FIX}

HARD RULES:
- NEVER use markdown triple-backtick fences. All code goes inside <<<VIBE_CODE>>> as raw source.
- NEVER print decorative divider lines (no dashes, equals, box-drawing characters).
- Every file path MUST start with ${projectRoot}/.
	- For medium or large builds, do not ship one lonely App.tsx. Create 4-6 focused source files with the primary App.tsx plus component, hook, data, and type files. Only tiny one-line edits may stay single-file.
	- Avoid shallow or generic UI. Include domain-specific copy/data, useful state, responsive layout, hover/focus states, empty/error/loading states where relevant, and at least one meaningful interaction beyond static display.
	- In <<<VIBE_CODE>>>, added = line count of the block; removed = lines removed.
- On the first message, do not read/analyze files before creating them. On follow-up messages, analyze all existing files before editing.

Request details: ${userPrompt}`,
        },
      ];

      // Use the Clyra API for the structured agent stream so the output budget goes
      // into the delimited timeline (thinking + analyze + code + verification).
      const vibeStreamController = new AbortController();
      const vibeStreamTimeout = window.setTimeout(() => {
        vibeStreamController.abort();
      }, 60000);

      try {
        await streamOpenAI(
          VIBE_CURSOR_AGENT_SYSTEM_PROMPT,
          openAiMessages,
          (chunkText, isReasoning) => {
            if (isReasoning) {
              return;
            }
            full = sanitizeVibeAgentContent(full + chunkText);
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
          0.72,
          12000,
          "deepseek-chat",
          vibeStreamController.signal,
        );
      } finally {
        window.clearTimeout(vibeStreamTimeout);
      }

      if (
        !full.includes("<<<VIBE_CODE") ||
        !full.includes("<<<VIBE_RUN>>>") ||
        !full.includes("Done! Here's what I built")
      ) {
        throw new Error(
          "Vibe stream ended before a complete build was produced.",
        );
      }

      const streamedFiles = extractVibeFilesFromContent(full);
      const requestedKind = detectProjectKind(userPrompt);
      const existingKind = detectProjectKind(
        `${projectRoot} ${Object.keys(existingFiles).join(" ")}`,
      );
      const expectedKind =
        isFollowUp && requestedKind === "generic" && existingKind !== "generic"
          ? existingKind
          : requestedKind;
      if (
        !isVibeFileMapCompatibleWithKind(
          expectedKind,
          streamedFiles,
          projectRoot,
        )
      ) {
        throw new Error(
          `Vibe stream produced files that do not match the expected ${expectedKind} project shape.`,
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
        scrollChatToBottom("smooth");
      }, 300);
    } catch (error) {
      console.warn("Vibe Coder switched to the local sandbox fallback:", error);
      const fallback = buildLocalVibeFallback(
        userPrompt,
        projectRoot,
        isFollowUp,
        existingFiles,
      );
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

      const existingFiles = vibePreviewFiles ?? {};
      const projectRoot =
        getVibeProjectRootFromFiles(existingFiles) ??
        buildVibeProjectRoot("preview fix");
      simulateVibeCoder(
        aiMsgId,
        errorPrompt,
        currentChatIdRef.current,
        true,
        projectRoot,
        existingFiles,
      );
    },
    [vibePreviewFiles, vibePreviewMessageId, simulateVibeCoder],
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
    if (selectedCommand?.id === "clip") {
      // AI Clip handles its own flow - don't send as message
      return;
    }
    if (value.trim() || selectedCommand) {
      setVibePreviewMessageId(null);
      setVibePreviewFiles(null);
      setIsVibePreviewVisible(true);
      const rawUserText = value.trim();
      const rawUserTextLower = rawUserText.toLowerCase();
      const typedCommand = commandSuggestions.find(
        (cmd) =>
          rawUserTextLower === cmd.prefix ||
          rawUserTextLower.startsWith(`${cmd.prefix} `),
      );
      const activeCommand = selectedCommand ?? typedCommand;
      const commandText = typedCommand
        ? rawUserText.slice(typedCommand.prefix.length).trim()
        : rawUserText;
      const userCommandLabel = activeCommand?.label;
      const userCommandId = activeCommand?.id;
      const userText =
        commandText || (userCommandLabel ? `Execute ${userCommandLabel}` : "");
      setValue("");
      setSelectedCommand(null);
      adjustHeight(true);
      setRecentCommand(null);

      let chatId = currentChatId;
      const isFirstMessage = messages.length === 0 && !chatId;
      if (isFirstMessage) {
        chatId = Date.now().toString();
        currentChatIdRef.current = chatId;
        setCurrentChatId(chatId);
      }

      const existingChatBeforeSend = chatId
        ? chats.find((chat) => chat.id === chatId)
        : undefined;
      const currentMessages =
        existingChatBeforeSend &&
        existingChatBeforeSend.messages.length > messages.length
          ? existingChatBeforeSend.messages
          : messages;
      const userMsgId = Date.now().toString();
      const aiMsgId = (Date.now() + 1).toString();

      const isExistingVibeConversation =
        currentMessages.some((message) => message.assistantKind === "vibe") ||
        existingChatBeforeSend?.kind === "vibe";
      const isVibeMode =
        userCommandId === "vibe" ||
        (!activeCommand && isExistingVibeConversation);
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
        scrollChatToBottom("smooth");
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
                const newTitle = titleResponse.text
                  ?.trim()
                  .replace(/^"|"$/g, "");
                if (newTitle) {
                  setChats((prev) =>
                    prev.map((c) =>
                      c.id === chatId ? { ...c, title: newTitle } : c,
                    ),
                  );
                }
              })
              .catch(console.error);
          }
        }

        if (isVibeMode && chatId) {
          const existingVibeMessages = currentMessages.filter(
            (m) => m.assistantKind === "vibe",
          );
          const isFollowUp = existingVibeMessages.length > 0;
          const extractedFiles = extractLatestVibeFiles(currentMessages);
          const existingFiles =
            vibePreviewMessageId &&
            currentMessages.some((m) => m.id === vibePreviewMessageId) &&
            vibePreviewFiles
              ? vibePreviewFiles
              : extractedFiles;
          const projectRoot =
            getVibeProjectRootFromFiles(existingFiles) ??
            buildVibeProjectRoot(userText, isFollowUp ? undefined : userMsgId);
          simulateVibeCoder(
            aiMsgId,
            userText,
            chatId,
            isFollowUp,
            projectRoot,
            existingFiles,
          );
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
    const mockFileName = `file-${Math.floor(Math.random() * 1000)}.pdf`;
    setAttachments((prev) => [...prev, mockFileName]);
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
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
            `,
          }}
        />
      )}
      <div className="h-dvh flex min-w-0 bg-[#f7f8fb] text-slate-900 font-sans selection:bg-slate-200 overflow-hidden scalable-container relative">
        <AnimatePresence initial={false}>
          {isSidebarOpen && (
            <motion.aside
              key="app-sidebar"
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
              className="relative z-[100] flex h-full shrink-0 flex-col overflow-hidden border-r border-slate-200/70 bg-white/[0.88] shadow-[inset_-1px_0_0_rgba(255,255,255,0.78)] backdrop-blur-2xl"
              style={{ willChange: "width, opacity" }}
            >
              <div className="w-[240px] h-full flex flex-col shrink-0">
                <div className="px-3 pb-2.5 pt-2 flex flex-col gap-1.5 shrink-0 border-b border-slate-200/70">
                  <div className="flex items-center justify-end h-9 -mt-0.5 -mb-0.5 -mr-1">
                    {isSidebarOpen && (
                      <button
                        type="button"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-label="Close sidebar"
                        title="Close sidebar"
                        className="flex h-9 w-9 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors duration-200"
                      >
                        <X className="w-[15px] h-[15px] stroke-[2.2]" />
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
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white hover:shadow-[0_8px_22px_rgba(15,23,42,0.06)] text-slate-700 transition-all duration-300 font-medium text-[13.5px]"
                    >
                      <SquarePen className="w-4 h-4 stroke-[2]" />
                      New chat
                    </button>
                    {/* Clips section */}
                    <button
                      type="button"
                      onClick={() => setIsClipsOpen((open) => !open)}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white hover:shadow-[0_8px_22px_rgba(15,23,42,0.06)] text-slate-700 transition-all duration-300 font-medium text-[13.5px]"
                    >
                      <Scissors className="w-4 h-4 stroke-[2]" />
                      <span className="flex-1 text-left">Clips</span>
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 text-slate-400 transition-transform",
                          isClipsOpen && "rotate-90",
                        )}
                      />
                    </button>
                    <AnimatePresence initial={false}>
                      {isClipsOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{
                            duration: 0.22,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="overflow-hidden pl-3"
                        >
                          <div className="mt-0.5 flex flex-col gap-0.5 border-l border-slate-200/70 pl-2">
                            {clips.length > 0 ? (
                              <AnimatePresence mode="popLayout" initial={false}>
                                {clips.slice(0, 8).map((clip) => (
                                  <motion.a
                                    layout="position"
                                    key={clip.id}
                                    href={clip.outputPath}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{
                                      opacity: 0,
                                      y: -12,
                                      height: 0,
                                      marginTop: 0,
                                      marginBottom: 0,
                                    }}
                                    transition={{
                                      duration: 0.24,
                                      ease: [0.22, 1, 0.36, 1],
                                    }}
                                    className="group relative flex w-full items-center gap-1 rounded-xl px-1.5 py-1 text-[12.5px] font-medium transition-all duration-300 text-slate-500 hover:bg-white/80 hover:text-slate-800 hover:shadow-[0_6px_16px_rgba(15,23,42,0.05)]"
                                  >
                                    <span className="min-w-0 flex-1 truncate">
                                      {clip.title || "Clip"}
                                    </span>
                                    <span className="text-[10px] text-slate-400 shrink-0">
                                      {clip.duration || ""}
                                    </span>
                                  </motion.a>
                                ))}
                              </AnimatePresence>
                            ) : (
                              <div className="px-2 py-1.5 text-[12px] font-medium text-slate-400">
                                No clips yet
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Projects section */}
                    <button
                      type="button"
                      onClick={() => setIsProjectsOpen((open) => !open)}
                      className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl hover:bg-white hover:shadow-[0_8px_22px_rgba(15,23,42,0.06)] text-slate-700 transition-all duration-300 font-medium text-[13.5px]"
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
                              ? "dot-pulse-smooth bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
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
                            duration: 0.22,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className="overflow-hidden pl-3"
                        >
                          <div className="mt-0.5 flex flex-col gap-0.5 border-l border-slate-200/70 pl-2">
                            {filteredProjectChats.length > 0 ? (
                              <AnimatePresence mode="popLayout" initial={false}>
                                {filteredProjectChats
                                  .slice(0, 8)
                                  .map((chat) => (
                                    <motion.div
                                      layout="position"
                                      key={`project-${chat.id}`}
                                      initial={{ opacity: 0, y: 8 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      exit={{
                                        opacity: 0,
                                        y: -12,
                                        height: 0,
                                        marginTop: 0,
                                        marginBottom: 0,
                                      }}
                                      transition={{
                                        duration: 0.24,
                                        ease: [0.22, 1, 0.36, 1],
                                      }}
                                      className={cn(
                                        "group relative flex w-full items-center gap-1 rounded-xl px-1.5 py-1 text-[12.5px] font-medium transition-all duration-300",
                                        currentChatId === chat.id
                                          ? "bg-white text-slate-950 shadow-[0_8px_20px_rgba(15,23,42,0.07)] ring-1 ring-slate-200/75"
                                          : "text-slate-500 hover:bg-white/80 hover:text-slate-800 hover:shadow-[0_6px_16px_rgba(15,23,42,0.05)]",
                                      )}
                                    >
                                      {editingChatId === chat.id ? (
                                        <input
                                          type="text"
                                          value={editingTitle}
                                          onChange={(e) =>
                                            setEditingTitle(e.target.value)
                                          }
                                          className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-[12.5px] font-medium text-slate-800 shadow-sm outline-none"
                                          autoFocus
                                          onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                              setChats((prev) =>
                                                prev.map((c) =>
                                                  c.id === chat.id
                                                    ? {
                                                        ...c,
                                                        title:
                                                          editingTitle ||
                                                          c.title,
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
                                            onClick={() =>
                                              openChatSession(chat)
                                            }
                                            className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-0.5 py-1 text-left"
                                          >
                                            <span
                                              className={cn(
                                                "h-1.5 w-1.5 shrink-0 rounded-full",
                                                chat.vibeRunning &&
                                                  currentChatId !== chat.id
                                                  ? "dot-pulse-smooth bg-blue-500 shadow-[0_0_0_3px_rgba(59,130,246,0.14)]"
                                                  : currentChatId === chat.id
                                                    ? "bg-transparent ring-1 ring-slate-300"
                                                    : chat.vibeUnread
                                                      ? "bg-blue-500 ring-2 ring-blue-200"
                                                      : "bg-blue-500",
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
                                              className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-slate-800"
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
                                              className="rounded-md p-1 text-slate-400 hover:bg-white hover:text-red-500"
                                              aria-label={`Delete ${chat.title}`}
                                              title="Delete project"
                                            >
                                              <Trash2 className="h-3.5 w-3.5" />
                                            </button>
                                          </div>
                                        </>
                                      )}
                                    </motion.div>
                                  ))}
                              </AnimatePresence>
                            ) : (
                              <div className="px-2 py-1.5 text-[12px] font-medium text-slate-400">
                                No Vibe projects yet
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="relative mt-1.5 mb-0 px-1">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 stroke-[2.5] pointer-events-none" />
                    <input
                      ref={searchInputRef}
                      type="text"
                      placeholder="Search chats"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9 pr-8 py-2 bg-white/[0.55] hover:bg-white focus:bg-white rounded-[14px] text-sm placeholder:text-slate-400 text-slate-700 font-medium focus:outline-none transition-all duration-300 border border-slate-200/[0.55] focus:border-slate-300/80 shadow-[0_6px_18px_rgba(15,23,42,0.04)]"
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

                <div className="scrollbar-none flex-1 overflow-y-auto flex flex-col p-2.5 space-y-4">
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
                              }}
                              transition={{
                                duration: 0.25,
                                type: "spring",
                                bounce: 0,
                                mass: 0.8,
                              }}
                              key={chat.id}
                              className={cn(
                                "group relative w-full px-3 py-2 rounded-xl transition-all duration-300 cursor-pointer flex flex-col justify-center",
                                currentChatId === chat.id
                                  ? "bg-white text-[#0f0f0f] shadow-[0_8px_20px_rgba(15,23,42,0.06)] ring-1 ring-slate-200/70"
                                  : "text-slate-600 hover:bg-white/75 hover:text-[#0f0f0f] hover:shadow-[0_6px_18px_rgba(15,23,42,0.05)]",
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
                                    className="flex-1 bg-white border border-slate-200 shadow-sm outline-none rounded-md px-2 py-0.5 text-[13.5px] font-medium"
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

                {/* User Profile Footer */}
                <button
                  onClick={() => setIsSettingsOpen(true)}
                  className="p-3 border-t border-slate-200/70 flex items-center gap-2.5 shrink-0 hover:bg-white/75 transition-all duration-300 cursor-pointer w-full text-left group"
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
          )}
        </AnimatePresence>

        <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col border-l border-slate-200/50 bg-[linear-gradient(180deg,#f9fafc_0%,#f3f5f9_100%)] sm:border-transparent">
          <div
            className={cn(
              "grid min-h-0 w-full flex-1 overflow-hidden transition-[grid-template-columns] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]",
              showVibeLivePreview
                ? "grid-cols-[minmax(300px,min(440px,38vw))_minmax(0,1fr)]"
                : "grid-cols-[minmax(0,1fr)_0fr]",
            )}
          >
            <div
              className={cn(
                "relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden bg-white/[0.38] backdrop-blur-[2px]",
                showVibeLivePreview &&
                  "border-r border-slate-200/75 shadow-[8px_0_32px_rgba(15,23,42,0.05)]",
              )}
            >
              {!isSidebarOpen && (
                <button
                  type="button"
                  onClick={() => setIsSidebarOpen(true)}
                  aria-label="Open sidebar"
                  aria-expanded={false}
                  title="Open sidebar"
                  className="fixed top-4 left-4 z-[110] flex h-10 w-10 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-colors duration-200 sm:top-6 sm:left-6"
                >
                  <span className="relative block h-[10px] w-[16px]">
                    <span className="absolute left-0 top-0 h-[1.5px] w-full rounded-full bg-current" />
                    <span className="absolute left-0 top-[4px] h-[1.5px] w-full rounded-full bg-current" />
                    <span className="absolute left-0 top-[8px] h-[1.5px] w-full rounded-full bg-current" />
                  </span>
                </button>
              )}

              <AnimatePresence>
                {(messages.length === 0 || isTemporaryChat) && (
                  <motion.button
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -20, scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 400,
                      damping: 25,
                      mass: 0.8,
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
                      "fixed top-4 right-4 z-[95] rounded-full p-2 transition-all duration-300 group sm:top-6 sm:right-6",
                      isTemporaryChat
                        ? "text-slate-700 bg-slate-100/50"
                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-50/50",
                    )}
                    title={
                      isTemporaryChat
                        ? "Turn off Temporary Chat"
                        : "Temporary Chat"
                    }
                  >
                    <MessageCircleDashed
                      className={cn(
                        "w-6 h-6 stroke-[1.5] transition-all duration-300",
                        isTemporaryChat
                          ? "opacity-100 scale-105"
                          : "opacity-70 group-hover:opacity-100",
                      )}
                    />
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
                            mass: 0.8,
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
              <AnimatePresence>
                {hasVibeLivePreview && (
                  <motion.button
                    type="button"
                    layout
                    initial={{ opacity: 0, x: -14, scale: 0.9 }}
                    animate={{ opacity: 1, x: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -10, scale: 0.94 }}
                    whileHover={{ y: -1, scale: 1.03 }}
                    whileTap={{ scale: 0.95 }}
                    transition={{
                      type: "spring",
                      stiffness: 420,
                      damping: 32,
                      mass: 0.45,
                    }}
                    onClick={() =>
                      setIsVibePreviewVisible((visible) => !visible)
                    }
                    className={cn(
                      "fixed top-4 left-20 z-[145] inline-flex h-10 min-w-[132px] items-center justify-center gap-2 overflow-hidden rounded-full border px-3 text-xs font-semibold shadow-[0_18px_48px_rgba(15,23,42,0.16)] backdrop-blur-xl transition-all duration-300 sm:top-6 sm:left-20",
                      showVibeLivePreview
                        ? "border-slate-200/90 bg-white/90 text-slate-700 hover:bg-white hover:text-slate-950"
                        : "border-blue-200/90 bg-blue-50/95 text-blue-700 ring-4 ring-blue-500/10 hover:bg-blue-50 hover:text-blue-900",
                    )}
                    aria-pressed={showVibeLivePreview}
                    title={
                      showVibeLivePreview
                        ? "Hide live preview"
                        : "Show live preview"
                    }
                  >
                    <motion.span
                      aria-hidden
                      className="pointer-events-none absolute -inset-8 bg-[conic-gradient(from_0deg,transparent,rgba(59,130,246,0.30),transparent_35%)] opacity-0"
                      animate={{
                        rotate: showVibeLivePreview ? 0 : 360,
                        opacity: showVibeLivePreview ? 0 : 1,
                      }}
                      transition={{
                        rotate: {
                          duration: 2.4,
                          repeat: showVibeLivePreview ? 0 : Infinity,
                          ease: "linear",
                        },
                        opacity: { duration: 0.28 },
                      }}
                    />
                    <span
                      className={cn(
                        "pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500",
                        !showVibeLivePreview &&
                          "bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.22),transparent_34%),linear-gradient(120deg,rgba(255,255,255,0.4),transparent)] opacity-100",
                      )}
                      aria-hidden
                    />
                    {showVibeLivePreview ? (
                      <EyeOff
                        className="relative h-3.5 w-3.5"
                        strokeWidth={2.1}
                      />
                    ) : (
                      <Eye className="relative h-3.5 w-3.5" strokeWidth={2.1} />
                    )}
                    <span className="relative">
                      {showVibeLivePreview ? "Hide preview" : "Show preview"}
                    </span>
                  </motion.button>
                )}
              </AnimatePresence>
              <div
                className={cn(
                  "flex flex-col h-full min-h-0 w-full",
                  showVibeLivePreview
                    ? "min-w-0 flex-1 px-4 sm:px-5"
                    : "max-w-3xl mx-auto",
                  messages.length === 0
                    ? "justify-center px-4 sm:px-6"
                    : cn(
                        "pt-14 sm:pt-16",
                        showVibeLivePreview ? "px-4 sm:px-5" : "px-4 sm:px-6",
                      ),
                )}
              >
                {selectedCommand?.id === "clip" ? (
                  <AIClipper onClose={() => setSelectedCommand(null)} />
                ) : messages.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="text-center space-y-3 mb-8 flex flex-col items-center"
                  >
                    <motion.h1
                      layout="position"
                      className="text-3xl sm:text-4xl font-semibold tracking-tight text-slate-900"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1, duration: 0.4 }}
                    >
                      Hi there, I'm Clyra
                    </motion.h1>
                    <motion.div
                      layout="position"
                      className="flex flex-col items-center"
                    >
                      <motion.p
                        layout="position"
                        className="text-slate-500 text-sm sm:text-base font-medium font-sans z-10 relative"
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
                  <div
                    className="flex flex-1 w-full flex-col gap-5 overflow-y-auto pt-0 scrollbar-none [scroll-behavior:smooth]"
                    id="chat-container"
                    style={{
                      paddingBottom: messages.some(
                        (message) => message.assistantKind === "vibe",
                      )
                        ? Math.max(28, composerHeight + 10)
                        : 24,
                      scrollPaddingBottom: composerHeight + 24,
                    }}
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
                          layout="position"
                          key={message.id}
                          initial={{ opacity: 0, y: 12, scale: 0.99 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 280,
                            damping: 30,
                            mass: 0.55,
                            duration: 0.42 * animationSpeed,
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
                                "px-5 py-3.5 rounded-[22px] max-w-[85%] sm:max-w-[75%] shadow-[0_10px_28px_rgba(15,23,42,0.07)] border border-white/75 whitespace-pre-wrap ring-1 ring-slate-200/[0.55]",
                                fontClass,
                              )}
                              style={{
                                backgroundColor: userBubbleColor,
                                color: "#1e293b",
                              }}
                            >
                              {message.content}
                            </div>
                          ) : (
                            <div
                              data-invert-ignore={
                                theme === "Dark" ? "true" : undefined
                              }
                              className="px-0 py-1.5 w-full flex items-start gap-3"
                              style={{
                                color: theme === "Dark" ? "#e2e8f0" : "#1e293b",
                              }}
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
                                assistantKind={
                                  message.assistantKind === "vibe"
                                    ? "vibe"
                                    : "chat"
                                }
                                isLastAssistant={isLastAssistant}
                                onVibePreviewReady={handleVibePreviewReady}
                              />
                            </div>
                          )}
                        </motion.div>
                      );
                    })}
                    <div
                      ref={chatBottomRef}
                      aria-hidden="true"
                      className="h-px w-full shrink-0"
                    />
                  </div>
                )}

                <AnimatePresence>
                  {!isFullscreen && selectedCommand?.id !== "clip" && (
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
                      exit={{ opacity: 0, y: 20, pointerEvents: "none" }}
                      transition={{
                        type: "spring",
                        bounce: 0,
                        duration: 0.6 * animationSpeed,
                      }}
                      className={cn(
                        "w-full shrink-0 relative z-20 transition-all duration-300",
                        messages.length === 0
                          ? "max-w-2xl mx-auto pb-12"
                          : "pb-3 sm:pb-4",
                      )}
                    >
                      <div
                        className={cn(
                          "input-wrapper relative border bg-white/[0.92] shadow-[0_20px_60px_rgba(15,23,42,0.10)] ring-1 ring-white/80 backdrop-blur-2xl transition-all duration-300 cursor-text rounded-[28px] sm:rounded-[32px] z-[3]",
                          isExpanded
                            ? showVibeLivePreview
                              ? "p-1.5 sm:p-2"
                              : "p-2 sm:p-3"
                            : "p-1.5 sm:p-2",
                          "hover:shadow-[0_24px_72px_rgba(15,23,42,0.13)] hover:-translate-y-0.5",
                          isVibeWorkbenchSurface
                            ? "border-blue-200/[0.45]"
                            : "border-slate-200/75",
                        )}
                      >
                        <div className="relative z-10 w-full h-full">
                          <AnimatePresence>
                            {showCommandPalette && (
                              <motion.div
                                ref={commandPaletteRef}
                                className="absolute left-4 right-4 sm:left-6 sm:right-6 bottom-[calc(100%+10px)] max-h-[190px] overflow-y-auto bg-white/[0.96] rounded-2xl shadow-[0_20px_64px_rgba(15,23,42,0.16)] border border-slate-200/80 z-50 scrollbar-none transform-gpu origin-bottom pb-1 backdrop-blur-xl"
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
                              placeholder={
                                showVibeLivePreview
                                  ? "Edit this build..."
                                  : isVibeWorkbenchSurface
                                    ? "Describe the next build or edit..."
                                    : "Ask Clyra anything..."
                              }
                              containerClassName="w-full"
                              className={cn(
                                "resize-none overflow-y-auto overflow-x-hidden",
                                showVibeLivePreview
                                  ? "text-slate-800 text-[14px] leading-relaxed sm:text-[14px]"
                                  : "text-slate-800 text-[15px] leading-relaxed sm:text-[17px]",
                                "placeholder:text-slate-400",
                                isExpanded
                                  ? "min-h-[50px] max-h-[35vh] py-3 px-1"
                                  : "h-[40px] min-h-[40px] max-h-[40px] py-1.5 px-1",
                                "scrollbar-none transition-all duration-300",
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
                                animate={{
                                  opacity: 1,
                                  height: "auto",
                                  scale: 1,
                                }}
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
                                    className="p-2 sm:p-2.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 hover:shadow-[0_6px_18px_rgba(15,23,42,0.07)]"
                                  >
                                    <Paperclip className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                                  </motion.button>

                                  <AnimatePresence>
                                    {selectedCommand && (
                                      <motion.div
                                        layout
                                        initial={{
                                          opacity: 0,
                                          scale: 0.9,
                                        }}
                                        animate={{
                                          opacity: 1,
                                          scale: 1,
                                        }}
                                        exit={{
                                          opacity: 0,
                                          scale: 0.9,
                                        }}
                                        transition={{
                                          type: "spring",
                                          bounce: 0,
                                          duration: 0.3,
                                        }}
                                        className="flex items-center gap-1.5 text-slate-700 px-2.5 py-1.5 rounded-full text-xs sm:text-sm font-semibold ml-1 bg-slate-100/70 ring-1 ring-slate-200/70 hover:bg-white hover:shadow-[0_6px_18px_rgba(15,23,42,0.06)] transition-all duration-300 cursor-default"
                                      >
                                        <span className="opacity-70">
                                          {selectedCommand.icon(false)}
                                        </span>
                                        <span className="hidden sm:inline-block">
                                          {selectedCommand.label}
                                        </span>
                                        <button
                                          onClick={() =>
                                            setSelectedCommand(null)
                                          }
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
                                    {value.trim() || selectedCommand ? (
                                      <motion.div
                                        key="send-hint"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 5 }}
                                        className={cn(
                                          "hidden items-center gap-2 text-[10px] text-slate-400/80 font-medium mr-1",
                                          !showVibeLivePreview && "sm:flex",
                                        )}
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
                                    ) : (
                                      <motion.div
                                        key="cmd-hint"
                                        initial={{ opacity: 0, x: 5 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 5 }}
                                        className={cn(
                                          "hidden items-center gap-1.5 text-[10px] text-slate-400/80 font-medium mr-1",
                                          !showVibeLivePreview && "sm:flex",
                                        )}
                                      >
                                        <span className="flex items-center gap-1">
                                          <kbd className="font-sans px-1 py-[1.5px] rounded-sm bg-slate-100/50 border border-slate-200/50 shadow-[0_1px_0.5px_rgba(0,0,0,0.02)] text-slate-400">
                                            Ctrl/⌘K
                                          </kbd>
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
                                    disabled={
                                      value.trim().length === 0 &&
                                      !selectedCommand
                                    }
                                    className={cn(
                                      "p-2.5 rounded-full transition-all duration-300 shrink-0",
                                      "flex items-center justify-center shadow-sm",
                                      value.trim() || selectedCommand
                                        ? "bg-slate-950 text-white shadow-[0_12px_26px_rgba(15,23,42,0.22)] hover:bg-slate-800 hover:shadow-[0_16px_32px_rgba(15,23,42,0.26)]"
                                        : "bg-slate-100 text-slate-400 cursor-not-allowed",
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
                "flex min-h-0 min-w-0 origin-left flex-col overflow-hidden bg-white transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
                showVibeLivePreview
                  ? "pointer-events-auto translate-x-0 scale-100 opacity-100"
                  : "pointer-events-none translate-x-5 scale-[0.985] opacity-0",
              )}
              aria-hidden={!showVibeLivePreview}
            >
              {showVibeLivePreview ? (
                <VibeLivePreviewPanel
                  key={vibePreviewMessageId || "no-preview"}
                  filesByPath={vibePreviewFiles!}
                  onAutoFix={handleAutoFix}
                  setToastMessage={setToastMessage}
                  onReferenceElement={handlePreviewElementReference}
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
      </div>
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

  const response = await fetch("/api/clyra/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    signal,
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
