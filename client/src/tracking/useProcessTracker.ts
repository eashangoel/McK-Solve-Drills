import { useRef } from 'react';
import { ProcessTracker } from './tracker.js';

/** One tracker per mounted game session. */
export function useProcessTracker(): ProcessTracker {
  const ref = useRef<ProcessTracker | null>(null);
  if (ref.current === null) ref.current = new ProcessTracker();
  return ref.current;
}
