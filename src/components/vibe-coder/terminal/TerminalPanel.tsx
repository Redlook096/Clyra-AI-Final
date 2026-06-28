import React, { useEffect, useRef } from "react";
import { TerminalLog } from "../../../hooks/useVibeCoderWorkspace";
import { TerminalSquare } from "lucide-react";

interface TerminalPanelProps {
  logs: TerminalLog[];
}

export function TerminalPanel({ logs }: TerminalPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  if (logs.length === 0) return null;

  return (
    <div className="w-full h-48 bg-[#0D0D0D] border-t border-neutral-800 flex flex-col font-mono">
      <div className="flex items-center gap-2 p-2 border-b border-neutral-800 bg-black/50 text-xs text-neutral-400">
        <TerminalSquare className="w-3 h-3" />
        Terminal
      </div>
      <div className="flex-1 overflow-y-auto p-3 text-xs leading-5">
        {logs.map((log) => (
          <div 
            key={log.id} 
            className={`mb-1 break-all ${log.command ? 'text-blue-400 font-semibold mt-2' : 'text-neutral-300'}`}
          >
            {log.output}
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
}
