import { FileText, Folder, CheckCircle2, CircleDashed } from "lucide-react";
import { motion } from "framer-motion";

export interface FileNode {
  path: string;
  status: "pending" | "streaming" | "complete" | "error";
  action: "create" | "edit";
}

interface FileTreeProps {
  files: FileNode[];
}

export function FileTree({ files }: FileTreeProps) {
  // Simple flat list visualization for the file tree for now
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full w-full flex-col overflow-hidden rounded-[24px] border border-slate-200/60 bg-white shadow-[0_16px_46px_rgba(15,23,42,0.035)]"
    >
      <div className="flex flex-shrink-0 items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-3">
        <Folder className="h-4 w-4 text-slate-400" />
        <span className="text-[12px] font-bold tracking-wider text-slate-500 uppercase">
          Workspace Files
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 clyra-visible-scrollbar">
        {files.length === 0 ? (
          <div className="p-4 text-center text-[13px] font-medium text-slate-400">
            No files modified yet.
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {files.map((file, i) => (
              <div
                key={`${file.path}-${i}`}
                className="flex items-center gap-3 rounded-xl px-3 py-2 transition-colors hover:bg-slate-50"
              >
                {file.status === "complete" ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : file.status === "streaming" ? (
                  <CircleDashed className="h-4 w-4 animate-spin text-blue-500" />
                ) : file.status === "error" ? (
                  <CircleDashed className="h-4 w-4 text-rose-500" />
                ) : (
                  <FileText className="h-4 w-4 text-slate-300" />
                )}
                
                <span className="flex-1 truncate text-[13px] font-medium text-slate-700">
                  {file.path}
                </span>
                
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {file.action}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
