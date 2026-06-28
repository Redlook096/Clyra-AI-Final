import React from "react";
import { motion } from "framer-motion";
import { ShieldCheck, Target, LayoutDashboard, Bug } from "lucide-react";

interface ReviewPanelProps {
  score: number;
  blockers: string[];
}

export function ReviewPanel({ score, blockers }: ReviewPanelProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#1A1A1C] border border-emerald-500/20 rounded-xl overflow-hidden shadow-2xl mt-4"
    >
      <div className="bg-emerald-500/10 px-4 py-3 border-b border-emerald-500/20 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="text-emerald-400" size={18} />
          <h3 className="font-semibold text-emerald-400 text-sm">Final Review Agent</h3>
        </div>
        <div className="text-xs font-bold text-emerald-400 bg-emerald-500/20 px-2 py-1 rounded">
          {score}/100
        </div>
      </div>
      
      <div className="p-4 grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/50 flex items-center gap-1"><Target size={12}/> Request Fulfillment</span>
          <span className="text-sm text-white/90 font-medium">Passed</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/50 flex items-center gap-1"><LayoutDashboard size={12}/> Presentable Quality</span>
          <span className="text-sm text-white/90 font-medium">Premium UI Verified</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/50 flex items-center gap-1"><Bug size={12}/> Health Checks</span>
          <span className="text-sm text-white/90 font-medium">No Runtime Errors</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-xs text-white/50 flex items-center gap-1"><ShieldCheck size={12}/> Security Pass</span>
          <span className="text-sm text-white/90 font-medium">No Leaks Detected</span>
        </div>
      </div>

      {blockers.length > 0 && (
        <div className="px-4 pb-4">
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <h4 className="text-xs font-semibold text-red-400 mb-1">Blockers</h4>
            <ul className="text-xs text-red-400/80 list-disc list-inside">
              {blockers.map((b, i) => <li key={i}>{b}</li>)}
            </ul>
          </div>
        </div>
      )}
    </motion.div>
  );
}
