import React from "react";
import { motion } from "framer-motion";
import { Shield, Check, X } from "lucide-react";

interface AgentBrowserPermissionCardProps {
  onAllow: () => void;
  onDeny: () => void;
}

export function AgentBrowserPermissionCard({ onAllow, onDeny }: AgentBrowserPermissionCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#18181A] border border-blue-500/30 rounded-xl p-4 shadow-2xl max-w-sm"
    >
      <div className="flex items-center gap-3 text-blue-400 mb-2">
        <Shield size={18} />
        <h4 className="font-semibold text-sm text-white">Allow AI to test live preview?</h4>
      </div>
      <p className="text-xs text-white/60 mb-4 leading-relaxed">
        The AI will control the preview to click, type, scroll, and test the app like a user. You can stop it anytime.
      </p>
      <div className="flex gap-2">
        <button 
          onClick={onDeny}
          className="flex-1 py-1.5 rounded text-xs font-medium text-white/50 hover:bg-white/5 transition-colors flex items-center justify-center gap-1.5"
        >
          <X size={14} /> Deny
        </button>
        <button 
          onClick={onAllow}
          className="flex-1 py-1.5 rounded text-xs font-medium bg-blue-500 hover:bg-blue-400 text-white transition-colors flex items-center justify-center gap-1.5"
        >
          <Check size={14} /> Allow for this task
        </button>
      </div>
    </motion.div>
  );
}
