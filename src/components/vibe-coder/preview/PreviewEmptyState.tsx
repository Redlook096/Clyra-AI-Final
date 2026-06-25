import { Globe2 } from "lucide-react";

export function PreviewEmptyState() {
  return (
    <div className="grid h-full place-items-center bg-white">
      <div className="text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-slate-50 text-slate-300 ring-1 ring-slate-100">
          <Globe2 className="h-9 w-9" strokeWidth={1.5} />
        </div>
        <p className="mt-5 text-[18px] font-bold tracking-[-0.03em] text-slate-700">
          Start browsing
        </p>
        <p className="mt-1 text-[13px] font-semibold text-slate-400">
          Enter a URL to open a page
        </p>
      </div>
    </div>
  );
}
