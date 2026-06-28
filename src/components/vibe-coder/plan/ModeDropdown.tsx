import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, Map } from "lucide-react";
import { cn } from "../../../lib/utils";

export type HarnessMode = "plan" | "fast";

interface ModeDropdownProps {
  mode: HarnessMode;
  onChange: (mode: HarnessMode) => void;
}

export function ModeDropdown({ mode, onChange }: ModeDropdownProps) {
  const [open, setOpen] = useState(false);
  const options: Array<{ id: HarnessMode; title: string; copy: string; icon: React.ReactNode }> = [
    {
      id: "plan",
      title: "Plan Mode",
      copy: "Think first, review the plan, then build.",
      icon: <Map className="h-4 w-4 text-blue-500" />
    },
    {
      id: "fast",
      title: "Fast Mode",
      copy: "Short plan, save project, build immediately.",
      icon: <Sparkles className="h-4 w-4 text-amber-500" />
    },
  ];

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "inline-flex h-11 items-center gap-2 rounded-full border px-4 text-[13px] font-bold text-slate-700 outline-none transition-[background-color,border-color,color] duration-150 ease-out",
          open
            ? "border-slate-200/80 bg-white/88 text-slate-900 shadow-[0_10px_26px_rgba(15,23,42,0.045)]"
            : "border-transparent bg-transparent shadow-none hover:border-slate-200/70 hover:bg-white/72 hover:text-slate-900",
        )}
      >
        {mode === "plan" ? "Plan Mode" : "Fast Mode"}
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.16, ease: "easeOut" }}
          className="grid h-4 w-4 place-items-center"
        >
          <ChevronDown className="h-3.5 w-3.5" />
        </motion.span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.985 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.985 }}
            transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
            className="absolute left-0 bottom-[calc(100%+10px)] z-30 w-[270px] origin-bottom-left overflow-hidden rounded-[24px] border border-slate-200/75 bg-white/98 p-1 shadow-[0_14px_36px_rgba(15,23,42,0.06)] will-change-transform"
            style={{ contain: "layout paint" }}
          >
            <div className="flex flex-col gap-0.5">
              {options.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => {
                    onChange(opt.id);
                    setOpen(false);
                  }}
                  className={cn(
                    "flex flex-col items-start gap-1 rounded-[18px] p-3 text-left transition-[background-color] duration-150",
                    mode === opt.id ? "bg-slate-50/80" : "hover:bg-slate-50/50",
                  )}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="flex items-center gap-2 text-[13px] font-bold text-slate-900">
                      {opt.icon}
                      {opt.title}
                    </span>
                    {mode === opt.id && (
                      <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                    )}
                  </div>
                  <span className="text-[12px] font-medium leading-relaxed text-slate-500">
                    {opt.copy}
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
