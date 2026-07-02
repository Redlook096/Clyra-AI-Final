import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { PreviewTabBar } from "./PreviewTabBar";
import { PreviewToolbar } from "./PreviewToolbar";
import { PreviewUrlInput } from "./PreviewUrlInput";

export function PreviewBrowserChrome({
  title,
  address,
  canNavigate,
  onAddressChange,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  onRestart,
  onOpenExternal,
  onCopyUrl,
  isFullscreen,
  onToggleFullscreen,
}: {
  title: string;
  address: string;
  canNavigate: boolean;
  onAddressChange: (value: string) => void;
  onNavigate: (value: string) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onRestart: () => void;
  onOpenExternal: () => void;
  onCopyUrl: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="group relative z-10 bg-white/40 backdrop-blur-2xl border-b border-white/50 shadow-sm rounded-t-2xl overflow-hidden">
      <PreviewTabBar title={title} onNewTab={() => onNavigate("about:blank")} />
      <div className="flex min-h-12 items-center gap-2 px-3 py-2">
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onBack}
            disabled={!canNavigate}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition-all hover:bg-white/60 hover:text-slate-900 disabled:opacity-35 hover:shadow-sm"
            aria-label="Go back"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onForward}
            disabled={!canNavigate}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition-all hover:bg-white/60 hover:text-slate-900 disabled:opacity-35 hover:shadow-sm"
            aria-label="Go forward"
          >
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="grid h-8 w-8 place-items-center rounded-full text-slate-500 transition-all hover:bg-white/60 hover:text-slate-900 hover:shadow-sm"
            aria-label="Refresh preview"
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
        <PreviewUrlInput
          value={address}
          onChange={onAddressChange}
          onNavigate={onNavigate}
        />
        <PreviewToolbar
          onOpenExternal={onOpenExternal}
          onRestart={onRestart}
          onCopyUrl={onCopyUrl}
          isFullscreen={isFullscreen}
          onToggleFullscreen={onToggleFullscreen}
        />
      </div>
    </div>
  );
}
