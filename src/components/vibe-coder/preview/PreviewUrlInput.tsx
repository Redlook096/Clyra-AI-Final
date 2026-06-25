import { type FormEvent } from "react";

export function normalizePreviewAddress(input: string) {
  const trimmed = input.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(localhost|127\.0\.0\.1)(:\d+)?/i.test(trimmed)) {
    return `http://${trimmed}`;
  }
  if (/^[\w.-]+\.[a-z]{2,}(\/.*)?$/i.test(trimmed)) {
    return `https://${trimmed}`;
  }
  return `https://www.bing.com/search?q=${encodeURIComponent(trimmed)}`;
}

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
      className="min-w-0 flex-1 opacity-0 transition-opacity duration-180 ease-out focus-within:opacity-100 group-hover:opacity-100"
    >
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="Enter a URL"
        className="h-10 w-full rounded-full border border-slate-200/80 bg-white px-4 text-center text-[13px] font-semibold text-slate-700 shadow-inner shadow-slate-100/80 outline-none transition-all placeholder:text-slate-300 focus:border-slate-300 focus:bg-white"
      />
    </form>
  );
}
