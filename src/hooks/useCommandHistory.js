import { useCallback, useEffect, useState } from 'react';

const STORAGE_KEY = 'arc-command-history';
const MAX_ENTRIES = 20;

function readHistory() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function useCommandHistory() {
  const [history, setHistory] = useState(readHistory);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const addEntry = useCallback((entry) => {
    setHistory((current) => [
      {
        id: crypto.randomUUID?.() || `${Date.now()}-${Math.random()}`,
        createdAt: new Date().toISOString(),
        ...entry
      },
      ...current
    ].slice(0, MAX_ENTRIES));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  return {
    history,
    addEntry,
    clearHistory
  };
}