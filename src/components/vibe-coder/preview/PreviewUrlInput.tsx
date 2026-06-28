import { type FormEvent } from "react";

export function normalizePreviewAddress(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return `https://www.bing.com/search?q=${encodeURIComponent(trimmed)}`;
}

/**
 * URL input that is invisible by default.
 * Shows on parent `group` hover via opacity + pointer-events.
 * Takes no flex space when hidden so the toolbar isn't pushed around.
 */
export function PreviewUrlInput({
  value,
  onChange,
  onNavigate,
}: {
  value: string;
  onChange: (value: string) => void;
  onNavigate: (value: string) => void;
}) {
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const url = normalizePreviewAddress(value);
    if (url) onNavigate(url);
  };

  return (
    <form
      onSubmit={submit}
      className="min-w-0 flex-1 transition-opacity duration-200 ease-out"
    >
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter a URL"
        className={
          "h-8 w-full rounded-full " +
          "px-3.5 text-center text-[12px] font-normal text-slate-600 " +
          "outline-none transition-all placeholder:text-slate-300 " +
          "border border-transparent bg-transparent " +
          "hover:border-slate-200/60 hover:bg-white/50 " +
          "focus:border-slate-300 focus:bg-white focus:shadow-[0_0_0_3px_rgba(148,163,184,0.10)]"
        }
      />
    </form>
  );
}
