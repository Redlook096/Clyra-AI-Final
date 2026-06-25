import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Server } from "lucide-react";
import type { PreviewStatus } from "../../../../types/vibe-preview";

const copy: Record<PreviewStatus, string> = {
  idle: "Preview idle",
  starting: "Starting preview...",
  installing: "Installing dependencies...",
  compiling: "Compiling project...",
  running: "Checking preview...",
  ready: "",
  refreshing: "Refreshing preview...",
  runtime_error: "Runtime error",
  build_failed: "Build failed",
  server_crashed: "Server crashed",
  restarting: "Restarting preview...",
  stopped: "Preview stopped",
};

export function PreviewStatusOverlay({ status }: { status?: PreviewStatus }) {
  const message = status ? copy[status] : "";
  const visible = Boolean(message && status !== "ready");

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22 }}
          className="absolute inset-0 z-20 grid place-items-center bg-white/78 backdrop-blur-[2px]"
        >
          <motion.div
            initial={{ y: 8, scale: 0.98 }}
            animate={{ y: 0, scale: 1 }}
            exit={{ y: 8, scale: 0.98 }}
            className="flex items-center gap-3 rounded-full border border-slate-200 bg-white/94 px-4 py-3 text-[13px] font-bold text-slate-600 shadow-[0_18px_58px_rgba(15,23,42,0.10)]"
          >
            {status === "build_failed" ||
            status === "runtime_error" ||
            status === "server_crashed" ? (
              <Server className="h-4 w-4 text-slate-500" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin text-slate-500" />
            )}
            {message}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
