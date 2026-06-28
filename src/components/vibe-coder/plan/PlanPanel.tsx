import React from "react";
import ReactMarkdown from "react-markdown";

interface PlanPanelProps {
  markdown: string;
}

export function PlanPanel({ markdown }: PlanPanelProps) {
  if (!markdown) return null;
  
  return (
    <div className="w-full h-full p-6 overflow-y-auto bg-neutral-900 text-neutral-200">
      <div className="prose prose-invert prose-sm max-w-3xl mx-auto">
        <ReactMarkdown>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
