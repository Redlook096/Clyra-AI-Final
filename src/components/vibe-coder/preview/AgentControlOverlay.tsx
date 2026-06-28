import { motion, AnimatePresence } from "framer-motion";

export function AgentControlOverlay({
  isActive,
}: {
  isActive: boolean;
}) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="pointer-events-none absolute inset-0 z-40 rounded-xl ring-2 ring-inset ring-blue-500/50"
          style={{
            boxShadow: "inset 0 0 40px rgba(59, 130, 246, 0.1)",
          }}
        >
          <div className="absolute top-3 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-blue-500/90 px-3 py-1 shadow-md backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-white"></span>
            </span>
            <span className="text-[11px] font-semibold tracking-wide text-white uppercase">
              AI Control Active
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
