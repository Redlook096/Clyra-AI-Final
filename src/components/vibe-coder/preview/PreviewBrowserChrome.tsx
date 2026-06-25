import { ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { PreviewTabBar } from "./PreviewTabBar";
import { PreviewToolbar } from "./PreviewToolbar";
import { PreviewUrlInput } from "./PreviewUrlInput";
import type { PreviewDevice } from "./PreviewDeviceSwitcher";

export function PreviewBrowserChrome({
  title,
  address,
  device,
  canNavigate,
  onAddressChange,
  onNavigate,
  onBack,
  onForward,
  onRefresh,
  onRestart,
  onOpenExternal,
  onCopyUrl,
  onDeviceChange,
  isFullscreen,
  onToggleFullscreen,
}: {
  title: string;
  address: string;
  device: PreviewDevice;
  canNavigate: boolean;
  onAddressChange: (value: string) => void;
  onNavigate: (value: string) => void;
  onBack: () => void;
  onForward: () => void;
  onRefresh: () => void;
  onRestart: () => void;
  onOpenExternal: () => void;
  onCopyUrl: () => void;
  onDeviceChange: (device: PreviewDevice) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="relative z-10 bg-white/86 backdrop-blur-xl">
      <PreviewTabBar title={title} onNewTab={() => onNavigate("about:blank")} />
      <div className="flex min-h-12 items-center gap-2 border-b border-slate-200/70 px-3 py-2">
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onBack}
            disabled={!canNavigate}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35"
            aria-label="Go back"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onForward}
            disabled={!canNavigate}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 disabled:opacity-35"
            aria-label="Go forward"
          >
            <ArrowRight className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onRefresh}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
            aria-label="Refresh preview"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
        <PreviewUrlInput
          value={address}
          onChange={onAddressChange}
          onNavigate={onNavigate}
        />
        <PreviewToolbar
          device={device}
          onDeviceChange={onDeviceChange}
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
