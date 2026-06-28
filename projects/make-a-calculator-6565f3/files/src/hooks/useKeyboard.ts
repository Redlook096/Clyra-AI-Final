import { useEffect, useCallback } from "react";

interface UseKeyboardOptions {
  onKey: (key: string) => void;
  onEvaluate: () => void;
  onClear: () => void;
  onDelete: () => void;
  enabled?: boolean;
}

const KEY_MAP: Record<string, string> = {
  "0": "0",
  "1": "1",
  "2": "2",
  "3": "3",
  "4": "4",
  "5": "5",
  "6": "6",
  "7": "7",
  "8": "8",
  "9": "9",
  ".": ".",
  "+": "+",
  "-": "-",
  "*": "*",
  "/": "/",
  "=": "=",
  Enter: "=",
};

const isInputElement = (el: Element | null): boolean => {
  if (!el) return false;
  const tag = el.tagName.toLowerCase();
  return (
    tag === "input" ||
    tag === "textarea" ||
    tag === "select" ||
    (el as HTMLElement).isContentEditable
  );
};

export function useKeyboard({
  onKey,
  onEvaluate,
  onClear,
  onDelete,
  enabled = true,
}: UseKeyboardOptions): void {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Don't capture if user is typing in an input
      if (isInputElement(document.activeElement)) return;

      const key = event.key;

      // Map the key
      const mapped = KEY_MAP[key];

      if (mapped === "=") {
        event.preventDefault();
        onEvaluate();
        return;
      }

      if (mapped) {
        event.preventDefault();
        onKey(mapped);
        return;
      }

      if (key === "Backspace") {
        event.preventDefault();
        onDelete();
        return;
      }

      if (key === "Escape" || key === "Delete") {
        event.preventDefault();
        onClear();
        return;
      }
    },
    [enabled, onKey, onEvaluate, onClear, onDelete]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);
}
