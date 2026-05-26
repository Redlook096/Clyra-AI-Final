import {
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
  type WheelEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  Chrome,
  CircleDotDashed,
  Globe2,
  Loader2,
  MoreVertical,
  PlusCircle,
  RefreshCw,
  SquareArrowOutUpRight,
} from "lucide-react";

interface Props {
  onClose: () => void;
  initialQuery?: string;
}

type BrowserState = {
  action: string;
  url: string;
  title: string;
  screenshot: string;
};

function toBrowserTarget(input: string) {
  const clean = input.trim();
  if (!clean) return "https://www.google.com";
  try {
    const url = new URL(clean.includes("://") ? clean : `https://${clean}`);
    if (url.hostname.includes(".") && ["http:", "https:"].includes(url.protocol)) {
      return url.toString();
    }
  } catch {
    // Fall through to Google Search.
  }
  return `https://www.google.com/search?q=${encodeURIComponent(clean)}`;
}

export default function AgenticBrowser({ initialQuery = "" }: Props) {
  const [address, setAddress] = useState(initialQuery || "https://www.google.com");
  const [browserState, setBrowserState] = useState<BrowserState | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const scrollTimerRef = useRef<number | null>(null);
  const scrollDeltaRef = useRef({ x: 0, y: 0 });

  const resolvedAddress = useMemo(() => toBrowserTarget(address), [address]);

  const runBrowserAction = async (
    endpoint: string,
    body: Record<string, unknown> = {},
    showBusy = true,
  ) => {
    if (showBusy) setIsBusy(true);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const next = await response.json();
      if (!response.ok) throw new Error(next?.error || "Browser action failed");
      setBrowserState(next);
      if (typeof next.url === "string") setAddress(next.url);
    } finally {
      if (showBusy) window.setTimeout(() => setIsBusy(false), 180);
    }
  };

  useEffect(() => {
    runBrowserAction("/api/agentic-browser/navigate", {
      query: initialQuery || "https://www.google.com",
    }).catch(() => setIsBusy(false));
    return () => {
      if (scrollTimerRef.current != null) window.clearTimeout(scrollTimerRef.current);
    };
    // The address bar owns navigation after first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    runBrowserAction("/api/agentic-browser/navigate", {
      query: address,
    }).catch(() => setIsBusy(false));
  };

  const clickScreenshot = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.focus();
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) * 1280) / rect.width);
    const y = Math.round(((event.clientY - rect.top) * 820) / rect.height);
    runBrowserAction("/api/agentic-browser/click", { x, y }).catch(() => setIsBusy(false));
  };

  const handleViewportKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;

    const keyMap: Record<string, string> = {
      Enter: "Enter",
      Backspace: "Backspace",
      Delete: "Delete",
      Tab: "Tab",
      Escape: "Escape",
      ArrowUp: "ArrowUp",
      ArrowDown: "ArrowDown",
      ArrowLeft: "ArrowLeft",
      ArrowRight: "ArrowRight",
      " ": " ",
    };

    if (event.key in keyMap) {
      event.preventDefault();
      const key = keyMap[event.key];
      const endpoint = key === " " ? "/api/agentic-browser/type" : "/api/agentic-browser/key";
      const body = key === " " ? { text: " " } : { key };
      runBrowserAction(endpoint, body).catch(() => setIsBusy(false));
      return;
    }

    if (event.key.length === 1) {
      event.preventDefault();
      runBrowserAction("/api/agentic-browser/type", { text: event.key }).catch(() =>
        setIsBusy(false),
      );
    }
  };

  const handleViewportWheel = (event: WheelEvent<HTMLButtonElement>) => {
    event.preventDefault();
    scrollDeltaRef.current.x += event.deltaX;
    scrollDeltaRef.current.y += event.deltaY;
    if (scrollTimerRef.current != null) window.clearTimeout(scrollTimerRef.current);
    scrollTimerRef.current = window.setTimeout(() => {
      const { x, y } = scrollDeltaRef.current;
      scrollDeltaRef.current = { x: 0, y: 0 };
      runBrowserAction(
        "/api/agentic-browser/scroll",
        { deltaX: Math.round(x), deltaY: Math.round(y) },
        false,
      ).catch(() => undefined);
    }, 90);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.99, filter: "blur(10px)" }}
      animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
      exit={{ opacity: 0, y: 10, scale: 0.99, filter: "blur(10px)" }}
      transition={{ duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
      className="flex h-full min-h-0 w-full flex-col overflow-hidden bg-[#f7f8fa] text-slate-950"
    >
      <div className="flex shrink-0 items-center gap-3 border-b border-slate-200/70 bg-[#fbfcfd]/95 px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.055)] backdrop-blur-xl">
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => runBrowserAction("/api/agentic-browser/back").catch(() => setIsBusy(false))}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-950 active:scale-95"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5 stroke-[1.8]" />
          </button>
          <button
            onClick={() => runBrowserAction("/api/agentic-browser/forward").catch(() => setIsBusy(false))}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-400 transition duration-200 hover:bg-slate-100 hover:text-slate-950 active:scale-95"
            aria-label="Forward"
          >
            <ArrowRight className="h-5 w-5 stroke-[1.8]" />
          </button>
          <button
            onClick={() => runBrowserAction("/api/agentic-browser/reload").catch(() => setIsBusy(false))}
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-950 active:scale-95"
            aria-label="Refresh"
          >
            <RefreshCw className="h-5 w-5 stroke-[1.8]" />
          </button>
        </div>

        <form
          onSubmit={submit}
          className="mx-auto flex h-12 min-w-0 max-w-[780px] flex-1 items-center gap-3 rounded-[22px] border border-slate-200/65 bg-slate-100/85 px-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_8px_22px_rgba(15,23,42,0.045)] transition duration-300 focus-within:border-slate-300 focus-within:bg-white focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,1),0_14px_34px_rgba(15,23,42,0.08)]"
        >
          <Globe2 className="h-[18px] w-[18px] shrink-0 text-slate-400" />
          <input
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder="Search Google or type a URL"
            className="h-full min-w-0 flex-1 bg-transparent text-center text-[17px] font-medium tracking-[-0.01em] text-slate-900 outline-none placeholder:text-slate-400"
          />
          <button
            type="submit"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-500 transition duration-200 hover:bg-white hover:text-slate-950 active:scale-95"
            aria-label="Search Google"
          >
            {isBusy ? (
              <Loader2 className="h-[18px] w-[18px] animate-spin" />
            ) : (
              <SquareArrowOutUpRight className="h-[18px] w-[18px] stroke-[1.8]" />
            )}
          </button>
        </form>

        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-950 active:scale-95"
            aria-label="Browser focus"
          >
            <CircleDotDashed className="h-5 w-5 stroke-[1.8]" />
          </button>
          <div className="grid h-9 w-9 place-items-center rounded-full border border-slate-200/75 bg-white text-slate-500 shadow-sm" aria-label="Chromium">
            <Chrome className="h-[18px] w-[18px]" />
          </div>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-950 active:scale-95"
            aria-label="New browser tab"
          >
            <PlusCircle className="h-5 w-5 stroke-[1.8]" />
          </button>
          <button
            type="button"
            className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition duration-200 hover:bg-slate-100 hover:text-slate-950 active:scale-95"
            aria-label="Browser menu"
          >
            <MoreVertical className="h-5 w-5 stroke-[1.8]" />
          </button>
        </div>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-white">
        {browserState?.screenshot ? (
          <button
            type="button"
            onClick={clickScreenshot}
            onKeyDown={handleViewportKeyDown}
            onWheel={handleViewportWheel}
            tabIndex={0}
            className="relative h-full w-full cursor-default overflow-hidden bg-white text-left outline-none"
            aria-label="Chromium browser viewport"
          >
            <img
              src={browserState.screenshot}
              alt={browserState.title || resolvedAddress}
              className="h-full w-full object-fill [image-rendering:auto] [transform:translateZ(0)]"
              draggable={false}
            />
          </button>
        ) : (
          <div className="grid place-items-center gap-3 text-slate-500">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm font-medium">Opening Chromium</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
