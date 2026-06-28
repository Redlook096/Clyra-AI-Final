import { motion, AnimatePresence } from "framer-motion";
import { MousePointer2 } from "lucide-react";

export function AgentCursor({
  x,
  y,
  isClicking,
  isActive,
}: {
  x: number;
  y: number;
  isClicking: boolean;
  isActive: boolean;
}) {
  return (
    <AnimatePresence>
      {isActive && (
        <motion.div
          className="pointer-events-none absolute z-50 drop-shadow-lg"
          initial={{ opacity: 0, x, y }}
          animate={{ opacity: 1, x, y }}
          exit={{ opacity: 0 }}
          transition={{
            x: { type: "spring", stiffness: 100, damping: 20, mass: 0.5 },
            y: { type: "spring", stiffness: 100, damping: 20, mass: 0.5 },
            opacity: { duration: 0.2 },
          }}
          style={{ left: 0, top: 0 }}
        >
          <motion.div
            animate={{ scale: isClicking ? 0.8 : 1 }}
            transition={{ duration: 0.1 }}
            className="text-blue-500 drop-shadow-md"
          >
            <MousePointer2 className="h-6 w-6 fill-blue-500" />
          </motion.div>
          
          {/* Click Ripple */}
          <AnimatePresence>
            {isClicking && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0.8 }}
                animate={{ scale: 2.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="absolute -left-2 -top-2 h-8 w-8 rounded-full border-2 border-blue-400 bg-blue-400/20"
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
