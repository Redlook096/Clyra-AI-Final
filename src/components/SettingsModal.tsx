import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ChevronDown, Check } from 'lucide-react';
import { cn } from '../lib/utils';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from './ui/dropdown-menu';

// Exact easing curves requested for ultra-premium Apple-like feel
const MODAL_TRANSITION = { duration: 0.4, ease: [0.23, 1, 0.32, 1] };
const TAB_TRANSITION = { duration: 0.2, ease: [0.23, 1, 0.32, 1] };

export function SettingsModal({ 
    isOpen, onClose,
    theme, setTheme,
    sendOnEnter, setSendOnEnter,
    fontSize, setFontSize,
    clearChats, autoScroll, setAutoScroll,
    animationSpeed, setAnimationSpeed,
    codeHighlighting, setCodeHighlighting,
    markdownSupport, setMarkdownSupport,
    systemPrompt, setSystemPrompt,
    temperature, setTemperature,
    userBubbleColor, setUserBubbleColor,
    orbColorTheme, setOrbColorTheme,
    chats
}: any) {
    const [activeTab, setActiveTab] = useState('Appearance');
    const isDark = theme === 'Dark';

    const tabs = [
        { id: 'Appearance', label: 'Appearance' },
        { id: 'Personalisation', label: 'Personalisation' },
        { id: 'Chat', label: 'Chat Behavior' },
        { id: 'Intelligence', label: 'Intelligence' },
        { id: 'System', label: 'Advanced' },
        { id: 'Data', label: 'Data & Privacy' },
    ];

    const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
        <button 
            type="button"
            onClick={() => onChange(!checked)}
            className={cn(
                "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors duration-300 ease-out focus:outline-none",
                checked ? (isDark ? "bg-blue-500" : "bg-slate-900") : (isDark ? "bg-slate-700" : "bg-slate-200")
            )}
        >
            <span className={cn(
                "inline-block h-5 w-5 transform rounded-full bg-white transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-[0_1px_3px_rgba(0,0,0,0.15)]",
                checked ? "translate-x-[22px]" : "translate-x-[2px]"
            )} />
        </button>
    );

    const Select = ({ value, options, onChange }: { value: string, options: string[], onChange: (v: string) => void }) => (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className={cn(
                    "inline-flex items-center gap-2 transition-colors px-3 py-1.5 rounded-lg text-[14px] font-medium outline-none border",
                    isDark ? "bg-slate-800 border-slate-700 hover:bg-slate-700 text-slate-300" : "bg-white border-slate-200 hover:bg-slate-50 text-slate-500 shadow-sm"
                )}>
                    {value}
                    <ChevronDown className={cn("w-4 h-4 shrink-0 transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]", isDark ? "text-slate-500" : "text-slate-400")} />
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
                align="end" 
                sideOffset={8}
                className={cn(
                    "z-[9999] overflow-hidden rounded-xl border p-1 shadow-xl",
                    "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-3",
                    "duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    isDark ? "bg-slate-800 border-slate-700/80 text-slate-300" : "bg-white border-slate-100 text-slate-600"
                )}
            >
                {options.map(opt => (
                    <DropdownMenuItem 
                        key={opt} 
                        onClick={() => onChange(opt)} 
                        className={cn(
                            "relative flex cursor-pointer select-none items-center justify-between gap-2 rounded-lg px-3 py-2 text-[14px] font-medium outline-none transition-colors duration-200 w-full min-w-[140px]", 
                            isDark ? "focus:bg-slate-700/50 text-slate-200" : "focus:bg-slate-50 text-slate-700"
                        )}
                    >
                        {opt}
                        {value === opt && <Check className="w-4 h-4 ml-3 shrink-0" />}
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );

    const SegmentedControl = ({ options, value, onChange }: any) => (
        <div className={cn("flex p-1 rounded-xl", isDark ? "bg-slate-800" : "bg-slate-100/70")}>
            {options.map((opt: any) => (
                <button
                    key={opt.label}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "flex-1 py-1.5 px-4 rounded-lg text-[13px] font-medium transition-all duration-200 ease-out outline-none",
                        value === opt.value 
                            ? (isDark ? "bg-slate-600 text-white shadow-sm" : "bg-white text-slate-900 shadow-[0_1px_3px_rgba(0,0,0,0.06)]") 
                            : (isDark ? "text-slate-400 hover:text-slate-300" : "text-slate-500 hover:text-slate-700")
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    );

    const SettingRow = ({ label, description, children, noBorder }: any) => (
        <div className={cn("flex items-center justify-between py-4", !noBorder && (isDark ? "border-b border-slate-800" : "border-b border-slate-100/60"))}>
            <div className="flex flex-col pr-8">
                <span className={cn("text-[14px] font-medium tracking-tight", isDark ? "text-slate-200" : "text-slate-900")}>{label}</span>
                {description && <span className={cn("text-[13px] mt-0.5 leading-snug", isDark ? "text-slate-400" : "text-slate-500")}>{description}</span>}
            </div>
            <div className="shrink-0 flex items-center justify-end">{children}</div>
        </div>
    );

    const SettingBlock = ({ label, description, children, noBorder }: any) => (
        <div className={cn("flex flex-col py-4", !noBorder && (isDark ? "border-b border-slate-800" : "border-b border-slate-100/60"))}>
            <div className="flex flex-col mb-4">
                <span className={cn("text-[14px] font-medium tracking-tight", isDark ? "text-slate-200" : "text-slate-900")}>{label}</span>
                {description && <span className={cn("text-[13px] mt-0.5 leading-snug", isDark ? "text-slate-400" : "text-slate-500")}>{description}</span>}
            </div>
            {children}
        </div>
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div data-invert-ignore={isDark ? "true" : undefined} className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="absolute inset-0 bg-slate-900/30" 
                        onClick={onClose} 
                    />
                    
                    {/* Premium Modal */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.97, y: 15 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.98, y: -5 }}
                        transition={MODAL_TRANSITION}
                        style={{ willChange: "transform, opacity" }}
                        className={cn(
                            "w-full max-w-[740px] h-[560px] max-h-[85vh] rounded-3xl flex relative overflow-hidden z-10 border",
                            isDark ? "bg-black border-slate-800 shadow-none" : "bg-white border-transparent shadow-[0_24px_64px_-16px_rgba(0,0,0,0.16)]"
                        )}
                    >
                        {/* Clean Close Button */}
                        <div className="absolute top-5 right-5 z-20">
                            <button onClick={onClose} className={cn("p-1.5 transition-colors rounded-full", isDark ? "text-slate-400 hover:text-white hover:bg-slate-800" : "text-slate-400 hover:text-slate-800 hover:bg-slate-100")}>
                                <X className="w-5 h-5 stroke-[2]" />
                            </button>
                        </div>

                        {/* Ultra-Minimal Sidebar */}
                        <div className={cn("hidden sm:flex w-[220px] shrink-0 pt-8 px-4 flex-col gap-1 border-r", isDark ? "bg-black border-slate-800" : "bg-slate-50/30 border-slate-100/50")}>
                            <h2 className={cn("text-[17px] font-semibold tracking-tight px-4 mb-6 mt-2", isDark ? "text-slate-100" : "text-slate-800")}>Settings</h2>
                            {tabs.map(tab => {
                                const isActive = activeTab === tab.id;
                                return (
                                    <button
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id)}
                                        className={cn(
                                            "px-4 py-2.5 rounded-xl text-[14px] text-left transition-all duration-200 outline-none relative",
                                            isActive 
                                                ? (isDark ? "text-white font-medium bg-slate-800 shadow-none ring-1 ring-slate-700" : "text-slate-900 font-medium bg-white shadow-sm ring-1 ring-slate-100") 
                                                : (isDark ? "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50" : "text-slate-500 hover:text-slate-800 hover:bg-slate-100/50")
                                        )}
                                    >
                                        {tab.label}
                                    </button>
                                )
                            })}
                        </div>

                        {/* Main Content Area */}
                        <div className={cn("flex-1 pt-8 sm:pt-14 px-6 sm:px-10 overflow-y-auto no-scrollbar relative", isDark ? "bg-black" : "bg-white")}>
                            <div className="sm:hidden mb-6 flex items-center justify-between">
                                <h2 className={cn("text-[22px] font-semibold tracking-tight", isDark ? "text-slate-100" : "text-slate-900")}>Settings</h2>
                                <select 
                                    value={activeTab} 
                                    onChange={(e) => setActiveTab(e.target.value)}
                                    className={cn("py-1.5 px-3 rounded-lg text-sm font-medium border", isDark ? "bg-slate-800 text-slate-200 border-slate-700" : "bg-slate-50 text-slate-700 border-slate-100")}
                                >
                                    {tabs.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                                </select>
                            </div>
                            
                            <h3 className={cn("hidden sm:block text-[22px] font-semibold tracking-tight mb-6", isDark ? "text-slate-100" : "text-slate-900")}>
                                {tabs.find(t => t.id === activeTab)?.label}
                            </h3>
                            
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={activeTab}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={TAB_TRANSITION}
                                    style={{ willChange: "transform, opacity" }}
                                    className="pb-12 max-w-[440px]"
                                >
                                    {activeTab === 'Appearance' && (
                                        <>
                                            <SettingRow label="Theme Mode" description="Interface color scheme">
                                                <Select value={theme} options={['Light', 'Dark', 'System']} onChange={setTheme} />
                                            </SettingRow>
                                            <SettingBlock label="Animation Speed" description="Control how fast the UI transforms" noBorder>
                                                <SegmentedControl 
                                                    options={[
                                                        { label: 'Relaxed', value: 1.5 },
                                                        { label: 'Normal', value: 1.0 },
                                                        { label: 'Snappy', value: 0.5 }
                                                    ]}
                                                    value={animationSpeed}
                                                    onChange={setAnimationSpeed}
                                                />
                                            </SettingBlock>
                                        </>
                                    )}

                                    {activeTab === 'Personalisation' && (
                                        <>
                                            <SettingBlock label="User Message Bubble" description="Color for your own messages">
                                                <div className="flex gap-3 flex-wrap">
                                                    {[
                                                        { label: 'Grey', color: '#e2e8f0' },
                                                        { label: 'Blue', color: '#bfdbfe' },
                                                        { label: 'Green', color: '#bbf7d0' },
                                                        { label: 'Purple', color: '#e9d5ff' },
                                                        { label: 'Rose', color: '#fecdd3' }
                                                    ].map(preset => (
                                                        <button
                                                            key={preset.color}
                                                            onClick={() => setUserBubbleColor(preset.color)}
                                                            className={cn(
                                                                "w-8 h-8 rounded-full transition-all shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
                                                                userBubbleColor === preset.color ? (isDark ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0b0f19] scale-105" : "ring-2 ring-slate-800 ring-offset-2 scale-105") : "hover:scale-105"
                                                            )}
                                                            style={{ backgroundColor: preset.color }}
                                                            title={preset.label}
                                                        />
                                                    ))}
                                                    <div className={cn("w-[1px] h-8 mx-2", isDark ? "bg-slate-800" : "bg-slate-200")}></div>
                                                    <div className={cn(
                                                        "relative w-8 h-8 rounded-full overflow-hidden shadow-[0_1px_3px_rgba(0,0,0,0.1)] transition-transform hover:scale-105",
                                                        ![ '#e2e8f0', '#bfdbfe', '#bbf7d0', '#e9d5ff', '#fecdd3' ].includes(userBubbleColor) && (isDark ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0b0f19] scale-105" : "ring-2 ring-slate-800 ring-offset-2 scale-105")
                                                    )}>
                                                        <input 
                                                            type="color" 
                                                            value={userBubbleColor}
                                                            onChange={(e) => setUserBubbleColor(e.target.value)}
                                                            className="absolute inset-[-10px] w-12 h-12 cursor-pointer p-0 border-0"
                                                            title="Custom color"
                                                        />
                                                    </div>
                                                </div>
                                            </SettingBlock>
                                            <SettingBlock label="AI Orb Theme" description="Color gradient for the AI indicator">
                                                <div className="flex gap-3 flex-wrap">
                                                    {([
                                                        { id: 'default', label: 'Default', gradient: 'conic-gradient(from 45deg, #0f172a, #2563eb, #22d3ee, #8b5cf6, #0f172a)' },
                                                        { id: 'ocean', label: 'Ocean', gradient: 'conic-gradient(from 45deg, #0c4a6e, #0284c7, #06b6d4, #0ea5e9, #0c4a6e)' },
                                                        { id: 'sunset', label: 'Sunset', gradient: 'conic-gradient(from 45deg, #7c2d12, #ea580c, #f472b6, #a855f7, #7c2d12)' },
                                                        { id: 'forest', label: 'Forest', gradient: 'conic-gradient(from 45deg, #14532d, #16a34a, #2dd4bf, #059669, #14532d)' },
                                                        { id: 'mono', label: 'Mono', gradient: 'conic-gradient(from 45deg, #1e293b, #64748b, #cbd5e1, #94a3b8, #1e293b)' },
                                                        { id: 'noir', label: 'Noir', gradient: 'conic-gradient(from 45deg, #000000, #333333, #ffffff, #111111, #000000)' },
                                                    ] as const).map(preset => (
                                                        <button
                                                            key={preset.id}
                                                            onClick={() => setOrbColorTheme(preset.id as any)}
                                                            className={cn(
                                                                "w-8 h-8 rounded-full transition-all shadow-[0_1px_3px_rgba(0,0,0,0.1)]",
                                                                orbColorTheme === preset.id ? (isDark ? "ring-2 ring-blue-500 ring-offset-2 ring-offset-[#0b0f19] scale-105" : "ring-2 ring-slate-800 ring-offset-2 scale-105") : "hover:scale-105"
                                                            )}
                                                            style={{ background: preset.gradient }}
                                                            title={preset.label}
                                                        />
                                                    ))}
                                                </div>
                                            </SettingBlock>
                                            <SettingRow label="Text Size" description="Adjust reading scale" noBorder>
                                                <Select value={fontSize} options={['Small', 'Medium', 'Large']} onChange={setFontSize} />
                                            </SettingRow>
                                        </>
                                    )}

                                    {activeTab === 'Chat' && (
                                        <>
                                            <SettingRow label="Quick Submit" description="Send message on Enter (Shift+Enter for newline)">
                                                <Toggle checked={sendOnEnter} onChange={setSendOnEnter} />
                                            </SettingRow>
                                            <SettingRow label="Auto-Scroll" description="Follow new messages as they stream" noBorder>
                                                <Toggle checked={autoScroll} onChange={setAutoScroll} />
                                            </SettingRow>
                                        </>
                                    )}

                                    {activeTab === 'Intelligence' && (
                                        <>
                                            <SettingRow label="Model Routing" description="Intelligent provider selection">
                                                <span className={cn("rounded-full px-3 py-1 text-[12px] font-semibold tracking-wide uppercase", isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-700")}>
                                                    Auto
                                                </span>
                                            </SettingRow>
                                            <SettingBlock label="Reasoning Style" description="Adjust AI creativity and precision">
                                                <SegmentedControl 
                                                    options={[
                                                        { label: 'Precise', value: 0.1 },
                                                        { label: 'Balanced', value: 0.7 },
                                                        { label: 'Creative', value: 1.0 }
                                                    ]}
                                                    value={temperature}
                                                    onChange={setTemperature}
                                                />
                                            </SettingBlock>
                                            <SettingBlock label="System Prompt" description="Custom instructions for behavior" noBorder>
                                                <textarea 
                                                    value={systemPrompt}
                                                    onChange={(e) => setSystemPrompt(e.target.value)}
                                                    placeholder="e.g. Always respond in markdown."
                                                    spellCheck={false}
                                                    className={cn(
                                                        "w-full h-24 p-4 rounded-2xl text-[13.5px] focus:outline-none focus:ring-1 transition-colors resize-none shadow-inner",
                                                        isDark 
                                                            ? "bg-slate-800/50 text-slate-200 focus:ring-slate-600 focus:bg-slate-800 placeholder:text-slate-500 border border-slate-700/60"
                                                            : "bg-slate-50/50 text-slate-800 focus:ring-slate-300 focus:bg-white placeholder:text-slate-400 border border-slate-200/60"
                                                    )}
                                                />
                                            </SettingBlock>
                                        </>
                                    )}

                                    {activeTab === 'System' && (
                                        <>
                                            <SettingRow label="Syntax Highlighting" description="Colorize code blocks">
                                                <Toggle checked={codeHighlighting} onChange={setCodeHighlighting} />
                                            </SettingRow>
                                            <SettingRow label="Markdown Rendering" description="Parse rich text formatting" noBorder>
                                                <Toggle checked={markdownSupport} onChange={setMarkdownSupport} />
                                            </SettingRow>
                                        </>
                                    )}

                                    {activeTab === 'Data' && (
                                        <>
                                            <SettingRow label="Clear History" description="Erase all conversations entirely">
                                                <button 
                                                    onClick={clearChats}
                                                    className={cn("px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors", isDark ? "bg-red-900/30 text-red-400 hover:bg-red-900/50" : "bg-red-50 text-red-600 hover:bg-red-100")}
                                                >
                                                    Clear All Data
                                                </button>
                                            </SettingRow>
                                            <SettingRow label="Export Data" description="Download your history as JSON" noBorder>
                                                <button 
                                                    onClick={() => {
                                                        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(chats, null, 2));
                                                        const downloadAnchorNode = document.createElement('a');
                                                        downloadAnchorNode.setAttribute("href", dataStr);
                                                        downloadAnchorNode.setAttribute("download", "chat-export.json");
                                                        document.body.appendChild(downloadAnchorNode);
                                                        downloadAnchorNode.click();
                                                        downloadAnchorNode.remove();
                                                    }}
                                                    className={cn("px-4 py-2 rounded-xl font-semibold text-[13px] transition-colors", isDark ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-100 text-slate-700 hover:bg-slate-200")}
                                                >
                                                    Export JSON
                                                </button>
                                            </SettingRow>
                                        </>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
