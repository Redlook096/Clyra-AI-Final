import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, CheckCircle, Circle, AlertCircle } from "lucide-react";

interface CompactTaskStatusProps {
  tasks: { id: string; name: string; status: "pending" | "active" | "done" | "failed" }[];
  currentTaskId?: string;
}

export function CompactTaskStatus({ tasks, currentTaskId }: CompactTaskStatusProps) {
  const activeIndex = tasks.findIndex(t => t.id === currentTaskId);
  
  if (!tasks.length) return null;

  return (
    <div className="flex flex-col gap-2 p-3 bg-white/[0.02] border border-white/5 rounded-xl">
      <div className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1">
        Execution Progress ({activeIndex > -1 ? activeIndex + 1 : 0}/{tasks.length})
      </div>
      
      <div className="space-y-1.5">
        <AnimatePresence initial={false}>
          {tasks.map((task, idx) => {
            // Show only the previous, current, and next tasks to keep it compact
            if (idx < activeIndex - 1 || idx > activeIndex + 1) return null;
            
            return (
              <motion.div 
                key={task.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className={`flex items-center gap-2 text-sm ${task.status === "active" ? "text-white" : "text-white/40"}`}
              >
                {task.status === "done" && <CheckCircle size={14} className="text-green-400" />}
                {task.status === "active" && <Loader2 size={14} className="animate-spin text-blue-400" />}
                {task.status === "failed" && <AlertCircle size={14} className="text-red-400" />}
                {task.status === "pending" && <Circle size={14} className="opacity-50" />}
                
                <span className="truncate">{task.name}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
