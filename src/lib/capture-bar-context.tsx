'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

/**
 * Shared state for the study nav's "Undo" button (2026-06-18). The capture
 * page records the last saved touch here; the nav (which persists across
 * Capture↔Settings↔Dashboard navigation) renders an Undo button that removes
 * it. `undoSignal` is bumped after an undo so the capture page can refetch.
 */
export interface LastTouch {
  id: string;
  label: string;
}

interface CaptureBarContextType {
  lastTouch: LastTouch | null;
  setLastTouch: (t: LastTouch | null) => void;
  undoSignal: number;
  bumpUndoSignal: () => void;
}

const CaptureBarContext = createContext<CaptureBarContextType>({
  lastTouch: null,
  setLastTouch: () => {},
  undoSignal: 0,
  bumpUndoSignal: () => {},
});

export function CaptureBarProvider({ children }: { children: ReactNode }) {
  const [lastTouch, setLastTouch] = useState<LastTouch | null>(null);
  const [undoSignal, setUndoSignal] = useState(0);
  const bumpUndoSignal = useCallback(() => setUndoSignal((n) => n + 1), []);
  return (
    <CaptureBarContext.Provider value={{ lastTouch, setLastTouch, undoSignal, bumpUndoSignal }}>
      {children}
    </CaptureBarContext.Provider>
  );
}

export function useCaptureBar() {
  return useContext(CaptureBarContext);
}
