import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, RotateCcw } from "lucide-react";
import type { PreviewError } from "../../../../types/vibe-preview";

export function PreviewErrorOverlay({
  error,
  onRestart,
  onOpenLogs,
}: {
  error?: PreviewError;
  onRestart: () => void;
  onOpenLogs: () => void;
}) {
  return (
    <AnimatePresence>
      {error && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 z-30 grid place-items-center bg-white/88 px-5 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ opacity: 0, y: 14, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 14, scale: 0.98 }}
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-[520px] rounded-[30px] border border-slate-200 bg-white p-5 shadow-[0_28px_90px_rgba(15,23,42,0.12)]"
          >
            <div className="flex items-start gap-3">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-slate-50 text-slate-600 ring-1 ring-slate-100">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-[17px] font-bold tracking-[-0.03em] text-slate-950">
                  {error.title}
                </h3>
                {error.filePath ? (
                  <p className="mt-1 text-[12px] font-semibold text-slate-400">
                    {error.filePath}
                    {error.line ? `:${error.line}` : ""}
                  </p>
                ) : null}
                <p className="mt-3 max-h-28 overflow-auto whitespace-pre-wrap text-[12.5px] font-semibold leading-relaxed text-slate-500">
                  {error.message}
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={onRestart}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-[12px] font-bold text-white transition-all hover:bg-slate-800"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Restart preview
              </button>
              <button
                onClick={onOpenLogs}
                className="rounded-full border border-slate-200 bg-white px-4 py-2.5 text-[12px] font-bold text-slate-700 transition-all hover:border-slate-300"
              >
                Open logs
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
