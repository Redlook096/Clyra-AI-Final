import React from "react";
import { ProjectFile } from "../../../hooks/useVibeCoderWorkspace";
import { FileCode2, CheckCircle2, Clock, XCircle, FileText } from "lucide-react";

interface FileTreePanelProps {
  files: Record<string, ProjectFile>;
  activeFile: string | null;
  planMd: string;
}

export function FileTreePanel({ files, activeFile, planMd }: FileTreePanelProps) {
  const fileList = Object.values(files).sort((a, b) => a.path.localeCompare(b.path));

  return (
    <div className="w-full h-full flex flex-col bg-neutral-900 border-r border-neutral-800 p-4">
      <h2 className="text-sm font-semibold text-neutral-400 mb-4 uppercase tracking-wider">Project Files</h2>
      
      <div className="flex flex-col gap-1 overflow-y-auto">
        {planMd && (
          <div className="flex items-center gap-2 p-2 rounded-md hover:bg-neutral-800 transition-colors text-sm text-neutral-300">
            <FileText className="w-4 h-4 text-emerald-400" />
            <span className="truncate">PLAN.md</span>
            <CheckCircle2 className="w-3 h-3 text-emerald-500 ml-auto" />
          </div>
        )}

        {fileList.map(f => (
          <div 
            key={f.path}
            className={`flex items-center gap-2 p-2 rounded-md hover:bg-neutral-800 transition-colors text-sm
              ${f.path === activeFile ? 'bg-neutral-800/80 text-white' : 'text-neutral-300'}`}
          >
            <FileCode2 className="w-4 h-4 text-blue-400" />
            <span className="truncate" title={f.path}>{f.path}</span>
            <div className="ml-auto flex items-center">
              {f.status === "complete" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
              {f.status === "streaming" && <Clock className="w-3 h-3 text-amber-500 animate-pulse" />}
              {f.status === "error" && <XCircle className="w-3 h-3 text-red-500" />}
            </div>
          </div>
        ))}

        {fileList.length === 0 && !planMd && (
          <div className="text-sm text-neutral-600 text-center py-8">
            No files generated yet
          </div>
        )}
      </div>
    </div>
  );
}
