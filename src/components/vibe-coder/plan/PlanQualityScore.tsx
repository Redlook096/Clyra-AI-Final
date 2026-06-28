import React from "react";

export function PlanQualityScore({ score }: { score: "Strong" | "Moderate" | "Weak" }) {
  const getColors = () => {
    switch (score) {
      case "Strong": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "Moderate": return "bg-yellow-500/10 text-yellow-400 border-yellow-500/20";
      case "Weak": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-gray-500/10 text-gray-400 border-gray-500/20";
    }
  };

  return (
    <div className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${getColors()}`}>
      Quality: {score}
    </div>
  );
}
