import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";

interface ValidationStatusCardProps {
  status: "running" | "passed" | "failed";
  errors?: string[];
}

export function ValidationStatusCard({ status, errors }: ValidationStatusCardProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`border rounded-lg p-3 ${
        status === "running" ? "bg-blue-500/5 border-blue-500/20" :
        status === "passed" ? "bg-green-500/5 border-green-500/20" :
        "bg-red-500/5 border-red-500/20"
      }`}
    >
      <div className="flex items-center gap-2">
        {status === "running" && <Loader2 size={16} className="animate-spin text-blue-400" />}
        {status === "passed" && <CheckCircle2 size={16} className="text-green-400" />}
        {status === "failed" && <AlertTriangle size={16} className="text-red-400" />}
        
        <span className="text-sm font-medium text-white/90">
          {status === "running" ? "Running typecheck and lint..." :
           status === "passed" ? "Validation passed" :
           "Validation failed"}
        </span>
      </div>

      {status === "failed" && errors && errors.length > 0 && (
        <div className="mt-2 pl-6">
          <ul className="list-disc list-inside text-xs text-red-400/80 space-y-1">
            {errors.map((err, i) => <li key={i} className="truncate">{err}</li>)}
          </ul>
        </div>
      )}
    </motion.div>
  );
}
