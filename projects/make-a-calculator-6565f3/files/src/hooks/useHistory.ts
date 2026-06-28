import { useState, useCallback, useEffect } from "react";

export interface HistoryEntry {
  id: string;
  expression: string;
  result: string;
  timestamp: number;
}

const STORAGE_KEY = "calculator_history";
const MAX_HISTORY = 50;

function loadHistory(): HistoryEntry[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (e: unknown): e is HistoryEntry =>
        typeof e === "object" &&
        e !== null &&
        typeof (e as HistoryEntry).id === "string" &&
        typeof (e as HistoryEntry).expression === "string" &&
        typeof (e as HistoryEntry).result === "string" &&
        typeof (e as HistoryEntry).timestamp === "number"
    );
  } catch {
    return [];
  }
}

function saveHistory(entries: HistoryEntry[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage full or unavailable — silently ignore
  }
}

export function useHistory() {
  const [entries, setEntries] = useState<HistoryEntry[]>(loadHistory);
  const [isOpen, setIsOpen] = useState(false);

  // Persist whenever entries change
  useEffect(() => {
    saveHistory(entries);
  }, [entries]);

  const addEntry = useCallback(
    (expression: string, result: string) => {
      const entry: HistoryEntry = {
        id: crypto.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2),
        expression,
        result,
        timestamp: Date.now(),
      };
      setEntries((prev) => [entry, ...prev].slice(0, MAX_HISTORY));
    },
    []
  );

  const clearHistory = useCallback(() => {
    setEntries([]);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const togglePanel = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const closePanel = useCallback(() => {
    setIsOpen(false);
  }, []);

  return {
    entries,
    isOpen,
    addEntry,
    clearHistory,
    togglePanel,
    closePanel,
  };
}
