import React from "react";
import { motion } from "framer-motion";
import { Activity, ServerCrash, RefreshCw } from "lucide-react";

interface PreviewHealthStatusProps {
  status: "idle" | "compiling" | "ready" | "runtime_error" | "server_crashed";
}

export function PreviewHealthStatus({ status }: PreviewHealthStatusProps) {
  if (status === "idle") return null;

  const isError = status === "runtime_error" || status === "server_crashed";

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`absolute top-2 right-2 px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-2 backdrop-blur-md border ${
        isError ? "bg-red-500/20 text-red-400 border-red-500/30" : 
        status === "compiling" ? "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" : 
        "bg-green-500/20 text-green-400 border-green-500/30"
      }`}
    >
      {status === "compiling" && <RefreshCw size={12} className="animate-spin" />}
      {status === "ready" && <Activity size={12} />}
      {isError && <ServerCrash size={12} />}
      
      {status === "compiling" && "Building Preview..."}
      {status === "ready" && "Preview Live"}
      {status === "runtime_error" && "Runtime Error"}
      {status === "server_crashed" && "Server Crashed"}
    </motion.div>
  );
}
