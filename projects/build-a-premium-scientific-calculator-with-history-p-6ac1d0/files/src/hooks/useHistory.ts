import { useState, useCallback, useEffect } from 'react';
import { HistoryEntry } from '../types/calculator';

const STORAGE_KEY = 'calc_history';
const MAX_ENTRIES = 50;

function loadHistory(): HistoryEntry[] {
  try {
    const stored = sessionStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // Ignore parse errors
  }
  return [];
}

function saveHistory(history: HistoryEntry[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // Ignore storage errors
  }
}

export function useHistory() {
  const [history, setHistory] = useState<HistoryEntry[]>(loadHistory);

  // Persist on change
  useEffect(() => {
    saveHistory(history);
  }, [history]);

  const addEntry = useCallback((expression: string, result: string) => {
    const entry: HistoryEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      expression,
      result,
      timestamp: Date.now(),
    };
    setHistory(prev => {
      const next = [entry, ...prev];
      return next.slice(0, MAX_ENTRIES);
    });
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeEntry = useCallback((id: string) => {
    setHistory(prev => prev.filter(e => e.id !== id));
  }, []);

  return { history, addEntry, clearHistory, removeEntry };
}
