/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useCallback, useTransition, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { GoogleGenAI } from "@google/genai";
import { cn } from "./lib/utils";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
import { SettingsModal } from "./components/SettingsModal";
import { ShiningText } from "./components/ShiningText";
import { BlurTextEffect } from "./components/BlurTextEffect";

import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';


const ReasoningDisplay = ({ reasoningContent, isStreaming, isThinking }: { reasoningContent: string, isStreaming?: boolean, isThinking?: boolean }) => {
    const [isCollapsed, setIsCollapsed] = useState(true);
    const [isDoneState, setIsDoneState] = useState(false);
    const expandTimerRef = useRef<NodeJS.Timeout | null>(null);
    const finishTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    useEffect(() => {
        if (isThinking && isStreaming && reasoningContent && !expandTimerRef.current) {
           expandTimerRef.current = setTimeout(() => {
               setIsCollapsed(false);
           }, 800);
        }
        return () => {
            if (expandTimerRef.current && !isStreaming) {
                clearTimeout(expandTimerRef.current);
            }
        };
    }, [isStreaming, isThinking, !!reasoningContent]);

    useEffect(() => {
        if (!isThinking && reasoningContent && !finishTimerRef.current) {
           finishTimerRef.current = setTimeout(() => {
               setIsCollapsed(true);
               // Wait for collapse animation to finish before showing 'Thought'
               setTimeout(() => {
                   setIsDoneState(true);
               }, 500);
           }, 0);
        }
    }, [isThinking, reasoningContent]);

    if (!reasoningContent && !isThinking) return null;

    return (
        <div className="flex flex-col w-full text-[14px]">
            <button 
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="flex items-center gap-2 transition-colors w-fit pb-1 relative z-10 group"
            >
                <div className="flex items-center justify-center w-5 h-5 shrink-0">
                   <ChevronRight className={cn("w-4 h-4 transition-transform duration-500 text-slate-400 group-hover:text-slate-600", !isCollapsed ? "rotate-90" : "")} />
                </div>
                {isDoneState ? (
                    <span className="text-[14px] leading-none text-slate-400 font-medium">Thought Process</span>
                ) : (
                    <ShiningText text="Thinking..." className="text-[14px] leading-none font-medium" />
                )}
            </button>
            <AnimatePresence initial={false}>
                {!isCollapsed && reasoningContent && (
                    <motion.div 
                        key="reasoning-content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.6, type: "spring", bounce: 0.2, opacity: { duration: 0.3 } }}
                        className="overflow-hidden opacity-70 ml-[9px] pl-5 border-l-2 border-slate-200"
                    >
                        <div className="pt-2 pb-4 markdown-body text-slate-600">
                           <BlurTextEffect isStreaming={isThinking}>
                               {reasoningContent}
                           </BlurTextEffect>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}

const AnimatedMessage = ({ content, isThinking, isStreaming, reasoningContent, fontSizeClass, markdownSupport, codeHighlighting = true }: { content: string, isThinking?: boolean, isStreaming?: boolean, reasoningContent?: string, fontSizeClass?: string, markdownSupport?: boolean, codeHighlighting?: boolean }) => {
    return (
        <div className={cn("pt-0.5 font-medium text-inherit w-full relative flex flex-col gap-2", fontSizeClass)}>
            {isThinking ? (
                <ShiningText text="Thinking..." className="text-[15px] sm:text-base font-medium" />
            ) : null}
            
            {!isThinking && content.length > 0 ? (
                <div className="markdown-body mt-1">
                    {markdownSupport ? (
                        <Markdown 
                            components={{
                                code({node, inline, className, children, ...props}: any) {
                                    const match = /language-(\w+)/.exec(className || '')
                                    return (!inline && match && codeHighlighting) ? (
                                        <SyntaxHighlighter
                                            {...props}
                                            children={String(children).replace(/\n$/, '')}
                                            style={vscDarkPlus}
                                            language={match[1]}
                                            PreTag="div"
                                            className="rounded-lg my-2 !bg-[#1E1E1E] border border-slate-700/50"
                                        />
                                    ) : (
                                        <code {...props} className={cn("bg-slate-100/80 px-1 py-0.5 rounded text-[0.9em] font-mono", className)}>
                                            {children}
                                        </code>
                                    )
                                }
                            }}
                        >
                            {content}
                        </Markdown>
                    ) : (
                        <BlurTextEffect isStreaming={isStreaming}>
                            {content}
                        </BlurTextEffect>
                    )}
                </div>
            ) : null}
        </div>
    );
};

import {
    ImageIcon,
    FileUp,
    Figma,
    MonitorIcon,
    CircleUserRound,
    ArrowUpIcon,
    Paperclip,
    PlusIcon,
    SendIcon,
    XIcon,
    LoaderIcon,
    Sparkles,
    Command,
    Settings,
    Clock,
    Blocks,
    Mic,
    Terminal,
    Play,
    AppWindow,
    MousePointer2,
    FilePenLine,
    FileText,
    MessageCircle,
    MessageCircleDashed,
    Search,
    Pin,
    Pencil,
    Trash2,
    Check,
    X,
    SquarePen,
    PanelLeftClose,
    ChevronDown,
    ChevronRight,
    Folder
} from "lucide-react";
import * as React from "react";
import { ProgressCircle } from "./components/ui/progress";

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

const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
    if (!highlight.trim()) return <>{text}</>;
    const regex = new RegExp(`(${highlight})`, 'gi');
    const parts = text.split(regex);
    return (
        <>
            {parts.map((part, i) => 
                regex.test(part) ? <span key={i} className="text-blue-500 font-medium transition-colors duration-300 ease-out">{part}</span> : part
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
    const [searchQuery, setSearchQuery] = useState("");
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState("");
    const [value, setValue] = useState("");
    const [attachments, setAttachments] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [isPending, startTransition] = useTransition();
    const [activeSuggestion, setActiveSuggestion] = useState<number>(-1);
    const [showCommandPalette, setShowCommandPalette] = useState(false);
    const [recentCommand, setRecentCommand] = useState<string | null>(null);
    const [isInputExpanded, setIsInputExpanded] = useState(false);
    const [isAiAnimating, setIsAiAnimating] = useState(false);
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

    useEffect(() => {
        setIsSearching(searchQuery.length > 0);
    }, [searchQuery]);

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

    useEffect(() => {
        const handleActive = () => setIsAiAnimating(true);
        const handleComplete = () => setIsAiAnimating(false);
        window.addEventListener('ai-animation-active', handleActive);
        window.addEventListener('ai-animation-complete', handleComplete);
        return () => {
            window.removeEventListener('ai-animation-active', handleActive);
            window.removeEventListener('ai-animation-complete', handleComplete);
        }
    }, []);

    const isAiResponding = (messages.length > 0 && (messages[messages.length - 1].isThinking || messages[messages.length - 1].isStreaming)) || isAiAnimating;
    const isExpanded = !isAiResponding && (isInputExpanded || value.trim().length > 0 || attachments.length > 0 || selectedCommand !== null || messages.length > 0);

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

    const simulateVibeCoder = async (aiMsgId: string, userPrompt: string) => {
        try {
            let fullCode = "";
            let planText = "";
            const openAiMessages = [
                { role: 'user', content: `Generate a single-file React component for this request: "${userPrompt}". 
It must be exported as default and use inline Tailwind CSS classes.
You have access to the following dependencies:
- react (hooks like useState, useEffect)
- lucide-react (for icons)
- framer-motion (for animations)
DO NOT output any explanation. Output ONLY the raw React code inside a \`\`\`tsx block.` }
            ];
            
            await streamOpenAI(
                 "You are an expert Frontend Developer. In your internal reasoning, briefly discuss the project overview and goal, then your key decisions and approach in 2-4 sentences.",
                 openAiMessages,
                 (chunkText, isReasoning) => {
                     if (isReasoning) {
                         planText += chunkText;
                         setMessages(prev => prev.map(msg => 
                             msg.id === aiMsgId ? { 
                                 ...msg, 
                                 reasoningContent: planText,
                             } : msg
                         ));
                     } else {
                         fullCode += chunkText;
                         setMessages(prev => prev.map(msg => 
                             msg.id === aiMsgId ? { 
                                 ...msg, 
                                 content: fullCode,
                                 isThinking: false
                             } : msg
                         ));
                     }
                 }
            );

            // Removed fetch

            setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId ? { 
                    ...msg, 
                    isThinking: false,
                    isStreaming: false
                } : msg
            ));
            
            setTimeout(() => {
                const chatContainer = document.getElementById('chat-container');
                if (chatContainer && autoScroll) {
                    chatContainer.scrollTo({ top: chatContainer.scrollHeight, behavior: 'smooth' });
                }
            }, 300);

        } catch (error) {
            console.error('Vibe Coder error:', error);
            setMessages(prev => prev.map(msg => 
                msg.id === aiMsgId ? { 
                    ...msg, 
                    isThinking: false,
                    isStreaming: false,
                    content: "Sorry, I encountered an error during Vibe Coding."
                } : msg
            ));
        }
    };

    const handleSendMessage = async () => {
        if (value.trim() || selectedCommand) {
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
            
            setMessages(prev => [
                ...prev, 
                { id: userMsgId, role: 'user', content: userText },
                { 
                    id: aiMsgId, 
                    role: 'assistant', 
                    content: '', 
                    isThinking: true, 
                    isStreaming: true
                }
            ]);

            setTimeout(() => {
                const chatContainer = document.getElementById('chat-container');
                if (chatContainer && autoScroll) {
                    chatContainer.scrollTo({
                        top: chatContainer.scrollHeight,
                        behavior: 'smooth'
                    });
                }
            }, 100);

            const isVibeMode = userCommandId === 'vibe' || 
                rawUserText.toLowerCase().includes('code') || 
                rawUserText.toLowerCase().includes('app') || 
                rawUserText.toLowerCase().includes('website') ||
                rawUserText.toLowerCase().includes('design');

            try {
                if (isFirstMessage && !isTemporaryChat) {
                    ai.models.generateContent({
                        model: "gemini-3-flash-preview",
                        contents: `Generate a concise, up to 4 word title for a conversation that starts with the following prompt: "${userText}". Output only the title string without quotes.`,
                    }).then(titleResponse => {
                        const newTitle = titleResponse.text?.trim().replace(/^"|"$/g, '');
                        if (newTitle) {
                            setChats(prev => prev.map(c => c.id === chatId ? { ...c, title: newTitle } : c));
                        }
                    }).catch(console.error);
                }

                if (isVibeMode) {
                    simulateVibeCoder(aiMsgId, userText);
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
        <div className="h-dvh flex w-full bg-white text-slate-900 font-sans selection:bg-slate-200 overflow-hidden scalable-container relative">
            <AnimatePresence initial={false}>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: 240 }}
                        exit={{ width: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 40, mass: 0.8 }}
                        className="h-full shrink-0 flex flex-col z-[80] overflow-hidden bg-white border-r border-slate-200/60"
                        style={{ willChange: 'width' }}
                    >
                        <div className="w-[240px] h-full flex flex-col shrink-0">
                            <div className="pt-3 pb-2 px-3 flex flex-col gap-1.5 shrink-0 border-b border-black/5">
                                    <div className="px-1 flex flex-col gap-1 mt-2">
                                        <button 
                                            onClick={() => {
                                                setMessages([]);
                                                setCurrentChatId(null);
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
                                    
                                    <div className="relative mt-2 mb-0.5 px-1">
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
                                
                                <div className="flex-1 overflow-y-auto flex flex-col p-2 space-y-4">
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
                        </motion.div>
                )}
            </AnimatePresence>

            <div className="flex-1 min-w-[100vw] md:min-w-0 w-full h-full flex flex-col items-center bg-slate-50 relative z-10 transition-all border-l border-slate-200/50 sm:border-transparent">
                <button 
                    onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                    className="absolute top-4 left-4 sm:top-6 sm:left-6 w-10 h-10 rounded-full hover:bg-slate-200/50 text-slate-600 transition-colors z-[90] flex items-center justify-center group" 
                    title="Sidebar"
                >
                    <div className="relative w-[18px] h-[12px] opacity-70 group-hover:opacity-100 transition-opacity *:absolute *:left-0 *:w-full *:h-[2px] *:bg-current *:rounded-full">
                        <motion.span
                            animate={isSidebarOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                            className="top-0"
                            transition={{ duration: 0.2 }}
                        />
                        <motion.span
                            animate={isSidebarOpen ? { opacity: 0 } : { opacity: 1 }}
                            className="top-[5px]"
                            transition={{ duration: 0.2 }}
                        />
                        <motion.span
                            animate={isSidebarOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                            className="top-[10px]"
                            transition={{ duration: 0.2 }}
                        />
                    </div>
                </button>
                
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
                                "absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full transition-all duration-300 z-50 group",
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
                    "w-full max-w-3xl mx-auto flex flex-col h-full",
                    messages.length === 0 ? "justify-center px-4 sm:px-6" : "px-4 sm:px-6 pt-4"
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
                    <div className="flex-1 overflow-y-auto w-full pb-4 flex flex-col space-y-6 scrollbar-none pt-4 sm:pt-8" id="chat-container">
                        {messages.map((message) => {
                            const fontClass = fontSize === 'Small' ? 'text-[14px] leading-relaxed' : fontSize === 'Large' ? 'text-[18px] leading-loose' : 'text-[15px] sm:text-[16px] leading-relaxed';
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
                                        className={cn("px-5 py-3.5 rounded-[24px] rounded-br-[8px] max-w-[85%] sm:max-w-[75%] shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-200/60 whitespace-pre-wrap", fontClass)}
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
                                            content={message.content} 
                                            isThinking={message.isThinking} 
                                            isStreaming={message.isStreaming}
                                            reasoningContent={message.reasoningContent}
                                            fontSizeClass={fontClass}
                                            markdownSupport={markdownSupport}
                                            codeHighlighting={codeHighlighting}
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
                        if (!isInputExpanded && !isAiResponding) {
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
                            !isAiResponding && "hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]",
                            isAiResponding ? "loading border-transparent pointer-events-none" : "border-slate-200/60"
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
                                placeholder={isAiResponding ? "" : "Ask Clyra anything..."}
                                containerClassName="w-full"
                                className={cn(
                                    "resize-none overflow-y-auto",
                                    "text-slate-800 text-[15px] leading-relaxed sm:text-lg",
                                    "placeholder:text-slate-400",
                                    isExpanded ? "min-h-[50px] max-h-[35vh] py-3 px-1" : "h-[40px] min-h-[40px] max-h-[40px] py-1.5 px-1",
                                    isAiResponding && "opacity-0 select-none",
                                    "scrollbar-none transition-all duration-300"
                                )}
                                readOnly={isAiResponding}
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

function TypingDots() {
    return (
        <div className="flex items-center ml-1">
            {[1, 2, 3].map((dot) => (
                <motion.div
                    key={dot}
                    className="w-1.5 h-1.5 bg-slate-400 rounded-full mx-[2px]"
                    initial={{ opacity: 0.4 }}
                    animate={{ 
                        opacity: [0.4, 1, 0.4],
                        scale: [0.8, 1.2, 0.8]
                    }}
                    transition={{
                        duration: 1.4,
                        repeat: Infinity,
                        delay: dot * 0.2,
                        ease: "easeInOut",
                    }}
                />
            ))}
        </div>
    );
}

export async function streamOpenAI(systemInstruction: string | null, messages: any[], onChunk: (text: string, isReasoning?: boolean) => void, temperature: number = 0.7) {
    const formattedMessages = systemInstruction 
        ? [{ role: "system", content: systemInstruction }, ...messages] 
        : messages;

    const response = await fetch("https://api.deepseek.com/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer sk-c4fdab6332894c29933ece343b1b192a`
        },
        body: JSON.stringify({
            model: "deepseek-reasoner",
            messages: formattedMessages,
            temperature,
            stream: true,
        })
    });

    if (!response.ok) {
        throw new Error(`OpenAI error: ${response.status} ${response.statusText}`);
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
                        } else if (delta.content) {
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
