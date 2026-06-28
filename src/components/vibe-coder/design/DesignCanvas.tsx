import React, { useState } from "react";
import { motion } from "framer-motion";
import { Paintbrush, Layers, Check, X } from "lucide-react";

export function DesignCanvas() {
  const [activeVariant, setActiveVariant] = useState(0);
  const variants = ["Modern Glass", "Minimalist Light", "Brutal Dark"];

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="absolute top-4 right-4 bg-[#18181A] border border-pink-500/30 rounded-xl shadow-2xl p-4 w-64 z-50"
    >
      <div className="flex items-center gap-2 mb-4 text-pink-400">
        <Paintbrush size={16} />
        <h3 className="text-sm font-semibold text-white">Design Canvas</h3>
      </div>
      
      <div className="space-y-2 mb-4">
        {variants.map((v, i) => (
          <button
            key={i}
            onClick={() => setActiveVariant(i)}
            className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeVariant === i 
                ? "bg-pink-500/20 text-pink-300 border border-pink-500/30" 
                : "bg-white/5 text-white/60 hover:bg-white/10"
            }`}
          >
            {v}
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button className="flex-1 py-1.5 rounded bg-white/10 hover:bg-white/20 text-white/80 text-xs flex justify-center items-center gap-1 transition-colors">
          <X size={12}/> Dismiss
        </button>
        <button className="flex-1 py-1.5 rounded bg-pink-500 hover:bg-pink-400 text-white text-xs flex justify-center items-center gap-1 transition-colors shadow-[0_0_15px_rgba(236,72,153,0.3)]">
          <Check size={12}/> Apply
        </button>
      </div>
    </motion.div>
  );
}
