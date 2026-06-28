import { Globe2 } from "lucide-react";

export function PreviewTabBar({
  title,
  onNewTab,
}: {
  title: string;
  onNewTab?: () => void;
}) {
  return (
    <div className="flex h-10 items-center gap-2 border-b border-slate-200/60 px-3">
      {/* Plain tab title — no pill, no border, no background */}
      <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[12px] font-medium text-slate-500 opacity-80">
        <Globe2 className="h-3 w-3 shrink-0 text-slate-400" aria-hidden />
        <span className="truncate">{title || "New tab"}</span>
      </div>
    </div>
  );
}
