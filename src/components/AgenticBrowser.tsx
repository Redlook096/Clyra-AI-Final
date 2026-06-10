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
  return (
    <div className="flex h-full min-h-0 w-full flex-col items-center justify-center overflow-hidden bg-transparent">
      <div className="grid place-items-center gap-3 text-slate-500">
        <span className="text-sm font-medium">Coming soon</span>
      </div>
    </div>
  );
}
