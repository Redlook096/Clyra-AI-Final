import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, FileText, ChevronDown, Activity, AlertTriangle } from "lucide-react";
import { VibePlan } from "../../../../types/vibe-plan";
import { PlanMarkdownViewer } from "./PlanMarkdownViewer";
import { PlanQualityScore } from "./PlanQualityScore";

interface PlanCardProps {
  plan: any;
  onApprove: () => void;
  onRegenerate: () => void;
}

export function PlanCard({ plan, onApprove, onRegenerate }: PlanCardProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white/70 backdrop-blur-md border border-slate-200/50 rounded-2xl overflow-hidden shadow-xl my-4 flex flex-col"
    >
      <div
        className="p-4 cursor-pointer hover:bg-slate-50/50 transition-colors flex items-center justify-between"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center border border-blue-100">
            <FileText size={16} className="text-blue-500" />
          </div>
          <div>
            <h3 className="text-[13px] font-bold text-slate-900">Plan Ready</h3>
            <p className="text-[11px] font-medium text-slate-500 mt-0.5 max-w-md truncate">
              {plan.title || "Architecture and execution strategy prepared."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex gap-3 text-[11px] font-medium text-slate-400">
            <span className="flex items-center gap-1"><Activity size={12}/> {plan.taskGraph?.length || 0} tasks</span>
            <span className="flex items-center gap-1"><FileText size={12}/> {plan.proposedFileTree?.length || 0} files</span>
          </div>

          <PlanQualityScore score={plan.qualityScore?.overall || "Moderate"} />

          <motion.div animate={{ rotate: expanded ? 180 : 0 }}>
            <ChevronDown size={16} className="text-slate-400" />
          </motion.div>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="border-t border-slate-200/40 overflow-hidden bg-white/40"
          >
            <div className="p-4 max-h-[500px] overflow-y-auto clyra-visible-scrollbar text-slate-700">
              <PlanMarkdownViewer plan={plan} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="p-3 bg-slate-50/50 border-t border-slate-200/50 flex justify-end gap-2">
        <button
          onClick={onRegenerate}
          className="px-4 py-2 rounded-xl text-[12px] font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-200/40 transition-colors flex items-center gap-2"
        >
          <X size={14} /> Reject & Try Again
        </button>
        <button
          onClick={onApprove}
          className="px-4 py-2 rounded-xl text-[12px] font-bold bg-blue-500 hover:bg-blue-600 text-white shadow-[0_4px_14px_rgba(59,130,246,0.25)] transition-all flex items-center gap-2"
        >
          <Check size={14} /> Approve Plan & Build
        </button>
      </div>
    </motion.div>
  );
}
