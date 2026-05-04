import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Monitor, MessageSquare, SlidersHorizontal, Shield, Sparkles, BrainCircuit, HardDrive } from 'lucide-react';
import { cn } from '../lib/utils';

const Toggle = ({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) => (
    <button 
        type="button"
        onClick={() => onChange(!checked)}
        className={cn(
            "relative inline-flex h-[24px] w-11 shrink-0 items-center rounded-full transition-colors duration-300 ease-in-out focus:outline-none",
            checked ? "bg-slate-800" : "bg-slate-200"
        )}
    >
        <span className={cn(
            "inline-block h-[20px] w-[20px] transform rounded-full bg-white transition-transform duration-300 ease-in-out shadow-[0_2px_5px_rgba(0,0,0,0.1)]",
            checked ? "translate-x-[22px]" : "translate-x-[2px]"
        )} />
    </button>
);

const Select = ({ value, options, onChange }: { value: string, options: string[], onChange: (v: string) => void }) => {
    return (
        <div className="relative inline-flex">
            <select 
                value={value} 
                onChange={(e) => onChange(e.target.value)}
                className="appearance-none bg-slate-50 hover:bg-slate-100 transition-colors pr-8 pl-3 py-1.5 rounded-lg text-slate-700 text-[14px] font-medium focus:outline-none cursor-pointer border border-slate-200/60"
            >
                {options.map(opt => <option key={opt}>{opt}</option>)}
            </select>
            <svg className="absolute right-2.5 top-1/2 -translate-y-1/2 w-[14px] h-[14px] text-slate-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
        </div>
    )
}

const ButtonGroup = ({ options, value, onChange }: any) => {
    return (
        <div className="flex bg-slate-100/60 p-1 rounded-xl border border-slate-200/40">
            {options.map((opt: any) => (
                <button
                    key={opt.label}
                    onClick={() => onChange(opt.value)}
                    className={cn(
                        "flex-1 py-1.5 px-3 rounded-lg text-[13px] font-medium transition-all duration-200 outline-none",
                        value === opt.value 
                            ? "bg-white text-slate-800 shadow-[0_1px_3px_rgba(0,0,0,0.08)] border border-slate-200/50" 
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 border border-transparent"
                    )}
                >
                    {opt.label}
                </button>
            ))}
        </div>
    )
}

export function SettingsModal({ 
    isOpen, 
    onClose,
    theme, setTheme,
    sendOnEnter, setSendOnEnter,
    fontSize, setFontSize,
    clearChats,
    autoScroll, setAutoScroll,
    animationSpeed, setAnimationSpeed,
    codeHighlighting, setCodeHighlighting,
    markdownSupport, setMarkdownSupport,
    systemPrompt, setSystemPrompt,
    temperature, setTemperature,
    userBubbleColor, setUserBubbleColor,
    chats
}: any) {
    const [activeTab, setActiveTab] = React.useState('Appearance');

    const tabs = [
        { id: 'Appearance', label: 'Appearance', icon: Monitor },
        { id: 'Personalisation', label: 'Personalisation', icon: Sparkles },
        { id: 'Chat', label: 'Chat Behavior', icon: MessageSquare },
        { id: 'Intelligence', label: 'Intelligence', icon: BrainCircuit },
        { id: 'System', label: 'Advanced', icon: SlidersHorizontal },
        { id: 'Data controls', label: 'Data & Privacy', icon: Shield },
    ];

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 pb-20 sm:pb-6">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 bg-slate-900/10 backdrop-blur-[2px]" 
                        onClick={onClose} 
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(4px)" }}
                        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                        exit={{ opacity: 0, scale: 0.96, y: 12, filter: "blur(4px)" }}
                        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                        className="bg-white w-full max-w-[800px] h-[600px] max-h-[85vh] sm:max-h-[85vh] rounded-[24px] shadow-[0_24px_60px_-12px_rgba(0,0,0,0.12)] flex flex-col sm:flex-row relative overflow-hidden z-10 border border-black/[0.04]"
                    >
                {/* Mobile Header */}
                <div className="sm:hidden flex items-center justify-between p-4 border-b border-slate-100 bg-white">
                    <span className="font-semibold text-slate-800 text-[16px]">Settings</span>
                    <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Sidebar */}
                <div className="flex sm:w-[220px] shrink-0 bg-slate-50/50 sm:bg-slate-50/30 flex-row sm:flex-col p-2 sm:p-4 border-b sm:border-b-0 sm:border-r border-slate-100 overflow-x-auto sm:overflow-visible no-scrollbar">
                    <div className="hidden sm:flex px-2 mb-6 mt-2 items-center">
                        <span className="font-semibold text-slate-800 text-[15px]">Settings</span>
                    </div>
                    <div className="flex flex-row sm:flex-col gap-1 sm:gap-1.5 min-w-max sm:min-w-0">
                        {tabs.map(tab => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 sm:py-2 rounded-lg transition-all duration-200 text-[13.5px]",
                                        isActive 
                                            ? "bg-white text-slate-900 font-medium shadow-[0_1px_3px_rgba(0,0,0,0.05)] border border-slate-200/50" 
                                            : "hover:bg-slate-100/80 text-slate-500 font-medium border border-transparent"
                                    )}
                                >
                                    <Icon className={cn("w-[16px] h-[16px] shrink-0", isActive ? "text-slate-800" : "text-slate-400")} />
                                    <span>{tab.label}</span>
                                </button>
                            )
                        })}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col pt-4 sm:pt-8 pb-6 px-4 sm:px-10 overflow-y-auto relative bg-white">
                    <div className="hidden sm:flex justify-end absolute right-6 top-6 z-10">
                        <button 
                            onClick={onClose}
                            className="p-1.5 flex items-center justify-center rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="pb-6 mb-2">
                         <h2 className="text-[19px] font-semibold text-slate-800">{tabs.find(t => t.id === activeTab)?.label}</h2>
                    </div>
                    
                    <div className="max-w-[500px] pb-10">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 4 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -4 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                            >
                                {activeTab === 'Appearance' && (
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] text-slate-800 font-medium">Theme Options</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5">Choose your interface colors</span>
                                            </div>
                                            <Select 
                                                value={theme}
                                                options={['Light', 'Dark', 'System']}
                                                onChange={setTheme}
                                            />
                                        </div>
                                        <div className="flex flex-col py-4 border-b border-slate-100 gap-3">
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] text-slate-800 font-medium">Animation Speed</span>
                                                    <span className="text-[13px] text-slate-500 mt-0.5">Control how fast UI transforms</span>
                                                </div>
                                            </div>
                                            <ButtonGroup 
                                                options={[
                                                    { label: 'Relaxed', value: 1.5 },
                                                    { label: 'Normal', value: 1.0 },
                                                    { label: 'Snappy', value: 0.5 }
                                                ]}
                                                value={animationSpeed}
                                                onChange={setAnimationSpeed}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Personalisation' && (
                                    <div className="flex flex-col">
                                        <div className="flex flex-col py-4 border-b border-slate-100 gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] text-slate-800 font-medium">User Message Bubble Color</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5">Choose the color for your own messages</span>
                                            </div>
                                            <div className="flex gap-3 mt-1 flex-wrap">
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
                                                            "w-8 h-8 rounded-full border-2 transition-transform shadow-sm",
                                                            userBubbleColor === preset.color ? "border-slate-800 scale-110" : "border-transparent scale-100"
                                                        )}
                                                        style={{ backgroundColor: preset.color }}
                                                        title={preset.label}
                                                    />
                                                ))}
                                                <div className="w-[1px] h-8 bg-slate-200 mx-2"></div>
                                                <input 
                                                    type="color" 
                                                    value={userBubbleColor}
                                                    onChange={(e) => setUserBubbleColor(e.target.value)}
                                                    className="w-8 h-8 rounded-full border-0 p-0 cursor-pointer overflow-hidden"
                                                    title="Custom color"
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] text-slate-800 font-medium">Text Size</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5">Adjust readability of messages</span>
                                            </div>
                                            <Select 
                                                value={fontSize}
                                                options={['Small', 'Medium', 'Large']}
                                                onChange={setFontSize}
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Chat' && (
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                            <div className="flex flex-col pr-8">
                                                <span className="text-[14px] text-slate-800 font-medium">Quick Submit</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5">Send message on Enter (Shift+Enter for newline)</span>
                                            </div>
                                            <Toggle checked={sendOnEnter} onChange={setSendOnEnter} />
                                        </div>
                                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] text-slate-800 font-medium">Auto-Scroll</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5">Follow new messages as they stream</span>
                                            </div>
                                            <Toggle checked={autoScroll} onChange={setAutoScroll} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Intelligence' && (
                                    <div className="flex flex-col">
                                        <div className="flex flex-col py-4 border-b border-slate-100 gap-3">
                                            <div className="flex items-center justify-between mt-1">
                                                <div className="flex flex-col">
                                                    <span className="text-[14px] text-slate-800 font-medium">Reasoning Engine</span>
                                                    <span className="text-[13px] text-slate-500 mt-0.5">Adjust the AI's creativity level</span>
                                                </div>
                                            </div>
                                            <ButtonGroup 
                                                options={[
                                                    { label: 'Precise', value: 0.1 },
                                                    { label: 'Balanced', value: 0.7 },
                                                    { label: 'Creative', value: 1.0 }
                                                ]}
                                                value={temperature}
                                                onChange={setTemperature}
                                            />
                                        </div>
                                        <div className="flex flex-col py-4 border-b border-slate-100 gap-3">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] text-slate-800 font-medium">System Instructions</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5 mb-2">Define how the assistant behaves and responds</span>
                                            </div>
                                            <textarea 
                                                value={systemPrompt}
                                                onChange={(e) => setSystemPrompt(e.target.value)}
                                                placeholder="e.g. Always respond in markdown. Keep answers concise."
                                                spellCheck={false}
                                                className="w-full h-24 p-3 bg-slate-50 border border-slate-200/70 rounded-xl text-[13.5px] text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:border-slate-300 transition-colors resize-none placeholder:text-slate-400"
                                            />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'System' && (
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] text-slate-800 font-medium">Syntax Highlighting</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5">Highlight code block languages</span>
                                            </div>
                                            <Toggle checked={codeHighlighting} onChange={setCodeHighlighting} />
                                        </div>
                                        <div className="flex items-center justify-between py-4 border-b border-slate-100">
                                            <div className="flex flex-col">
                                                <span className="text-[14px] text-slate-800 font-medium">Markdown Rendering</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5">Parse rich text, tables, and lists</span>
                                            </div>
                                            <Toggle checked={markdownSupport} onChange={setMarkdownSupport} />
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'Data controls' && (
                                    <div className="flex flex-col">
                                        <div className="flex items-center justify-between py-5 border-b border-slate-100">
                                            <div className="flex flex-col pr-6">
                                                <span className="text-[14px] text-slate-800 font-medium">Clear History</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5">Erase all conversations entirely</span>
                                            </div>
                                            <button 
                                                onClick={clearChats}
                                                className="px-4 py-1.5 rounded-lg border border-red-200 text-red-600 font-medium text-[13.5px] hover:bg-red-50 transition-colors shrink-0"
                                            >
                                                Clear
                                            </button>
                                        </div>
                                        <div className="flex items-center justify-between py-5 border-b border-slate-100">
                                            <div className="flex flex-col pr-6">
                                                <span className="text-[14px] text-slate-800 font-medium">Export Data</span>
                                                <span className="text-[13px] text-slate-500 mt-0.5">Download your history as JSON</span>
                                            </div>
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
                                                className="px-4 py-1.5 rounded-lg border border-slate-200 text-slate-700 font-medium text-[13.5px] hover:bg-slate-50 transition-colors shrink-0"
                                            >
                                                Export
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
