import {
  Copy,
  ExternalLink,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  RotateCcw,
} from "lucide-react";

export function PreviewToolbar({
  onOpenExternal,
  onRestart,
  onCopyUrl,
  isFullscreen,
  onToggleFullscreen,
}: {
  onOpenExternal: () => void;
  onRestart: () => void;
  onCopyUrl: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="flex shrink-0 items-center gap-1">
      <button
        type="button"
        onClick={onToggleFullscreen}
        className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        aria-label={isFullscreen ? "Exit full screen preview" : "Full screen preview"}
      >
        {isFullscreen ? (
          <Minimize2 className="h-4 w-4" />
        ) : (
          <Maximize2 className="h-4 w-4" />
        )}
      </button>
      <button
        type="button"
        onClick={onOpenExternal}
        className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        aria-label="Open preview externally"
      >
        <ExternalLink className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onRestart}
        className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        aria-label="Restart preview"
      >
        <RotateCcw className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={onCopyUrl}
        className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        aria-label="Copy preview URL"
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900"
        aria-label="More preview options"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}
