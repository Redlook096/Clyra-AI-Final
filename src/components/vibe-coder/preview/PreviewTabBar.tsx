import { Globe2, Plus } from "lucide-react";

export function PreviewTabBar({
  title,
  onNewTab,
}: {
  title: string;
  onNewTab: () => void;
}) {
  return (
    <div className="flex h-11 items-center gap-2 border-b border-slate-200/70 px-3">
      <div className="inline-flex max-w-[230px] items-center gap-2 rounded-full border border-slate-200 bg-white/84 px-3 py-2 text-[12px] font-bold text-slate-600 shadow-[0_8px_22px_rgba(15,23,42,0.04)]">
        <Globe2 className="h-3.5 w-3.5 shrink-0" />
        <span className="truncate">{title || "New tab"}</span>
      </div>
      <button
        type="button"
        onClick={onNewTab}
        className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        aria-label="Open preview tab"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
