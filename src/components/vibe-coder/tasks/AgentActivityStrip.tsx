import React from "react";
import { motion } from "framer-motion";
import { Bot, Terminal, Code2, PenTool, Globe, Shield } from "lucide-react";

interface AgentActivityProps {
  activeAgent: "Planner" | "Architect" | "Frontend" | "Backend" | "Design" | "Terminal" | "BrowserTester" | "Fixer" | "Reviewer" | "Security" | null;
}

export function AgentActivityStrip({ activeAgent }: AgentActivityProps) {
  const agents = [
    { id: "Planner", icon: Bot, color: "text-purple-400", bg: "bg-purple-500/10" },
    { id: "Architect", icon: Globe, color: "text-blue-400", bg: "bg-blue-500/10" },
    { id: "Frontend", icon: Code2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { id: "Design", icon: PenTool, color: "text-pink-400", bg: "bg-pink-500/10" },
    { id: "Terminal", icon: Terminal, color: "text-yellow-400", bg: "bg-yellow-500/10" },
    { id: "BrowserTester", icon: Globe, color: "text-cyan-400", bg: "bg-cyan-500/10" },
    { id: "Security", icon: Shield, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  if (!activeAgent) return null;

  return (
    <div className="flex items-center gap-2 p-2 bg-[#1A1A1A] border border-white/5 rounded-lg overflow-x-auto scrollbar-hide">
      {agents.map(agent => {
        const isActive = activeAgent === agent.id;
        const Icon = agent.icon;
        
        return (
          <div 
            key={agent.id}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all ${isActive ? `${agent.bg} ${agent.color} border border-current/20` : 'text-white/20 hover:text-white/40'}`}
          >
            <Icon size={14} className={isActive ? "animate-pulse" : ""} />
            <span className={`text-xs font-medium ${isActive ? "" : "hidden sm:inline"}`}>
              {agent.id}
            </span>
            {isActive && (
              <motion.div 
                layoutId="active-indicator"
                className="w-1.5 h-1.5 rounded-full bg-current ml-1"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
