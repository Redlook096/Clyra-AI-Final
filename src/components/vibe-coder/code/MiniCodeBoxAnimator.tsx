import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { VibeMiniCodeBox } from "../../../../types/vibe-mini-code-box";
import { FilePlus, FileEdit, FileMinus } from "lucide-react";
// Assumes existing VibeMiniCodeBox component logic for the actual syntax highlighting
// we wrap it in a premium animator.

interface MiniCodeBoxAnimatorProps {
  box: VibeMiniCodeBox;
  isActive: boolean;
  isDone: boolean;
  canFinish: boolean;
  onDone: () => void;
}

export function MiniCodeBoxAnimator({ box, isActive, isDone, canFinish, onDone }: MiniCodeBoxAnimatorProps) {
  const [typedContent, setTypedContent] = useState("");
  const content = box.contentDiff || box.fullContent || "";
  const indexRef = useRef(0);
  const doneCalledRef = useRef(false);

  useEffect(() => {
    if (!isActive) return;
    
    // Simulate typing effect
    const interval = setInterval(() => {
      if (indexRef.current < content.length) {
        indexRef.current += 30; // Type in chunks for speed
        if (indexRef.current > content.length) {
          indexRef.current = content.length;
        }
        setTypedContent(content.substring(0, indexRef.current));
      }

      if (indexRef.current >= content.length && canFinish && !doneCalledRef.current) {
        doneCalledRef.current = true;
        setTimeout(onDone, 800); // Wait 0.8s after finishing typing before passing baton
      }
    }, 16); // ~60fps

    return () => clearInterval(interval);
  }, [isActive, content, canFinish, onDone]);

  // If not active and not done, stay hidden or tiny
  if (!isActive && !isDone) return null;

  const Icon = box.action === "create" ? FilePlus : box.action === "delete" ? FileMinus : FileEdit;
  const colorClass = box.action === "create" ? "text-green-400" : box.action === "delete" ? "text-red-400" : "text-blue-400";

  return (
    <motion.div 
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      className="bg-[#18181A] rounded-lg border border-white/10 overflow-hidden"
    >
      <div className="flex items-center gap-2 px-3 py-2 bg-white/[0.02] border-b border-white/5">
        <Icon size={14} className={colorClass} />
        <span className="text-xs font-mono text-white/80">{box.filePath}</span>
        {isActive && (
          <span className="ml-auto text-[10px] text-white/40 animate-pulse">Typing...</span>
        )}
      </div>
      
      <div className="p-3 text-xs font-mono whitespace-pre-wrap text-white/70 bg-[#0E0E10] max-h-[300px] overflow-y-auto">
        {isDone ? content : typedContent}
        {isActive && <span className="inline-block w-1.5 h-3 bg-white/50 ml-0.5 animate-pulse" />}
      </div>
    </motion.div>
  );
}
