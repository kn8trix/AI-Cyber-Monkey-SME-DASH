import { useEffect, useRef } from "react";

/**
 * Debounce writes to `localStorage` for a given key.
 *
 * The dashboard had 5 useEffect hooks that each called
 * `localStorage.setItem` synchronously on every state change.
 * Catalog edits (re-ordering, bulk pricing updates, etc.) could
 * trigger dozens of writes per second, each JSON-serializing the
 * full product/profile state.
 *
 * This hook:
 *   - schedules a write `delay` ms after the value last changed
 *   - serializes via `serialize` (defaults to JSON.stringify)
 *   - flushes the latest value immediately on unmount so we never
 *     lose the final edit when the user closes the tab
 *
 * The write is also skipped entirely if `enabled` is false (useful
 * for SSR or for tests that want to assert against a clean DOM).
 */
export function useDebouncedLocalStorage<T>(
  key: string,
  value: T,
  options: { delay?: number; serialize?: (v: T) => string; enabled?: boolean } = {}
): void {
  const { delay = 250, serialize = JSON.stringify, enabled = true } = options;
  // Always read the latest value inside the timeout without making it
  // a dependency (otherwise the timeout resets on every keystroke).
  const valueRef = useRef(value);
  valueRef.current = value;

  useEffect(() => {
    if (!enabled) return;
    const handle = window.setTimeout(() => {
      try {
        window.localStorage.setItem(key, serialize(valueRef.current));
      } catch (err) {
        // Quota exceeded / private mode / serializable error — don't
        // crash the whole dashboard over a persisted-cache miss.
        console.warn(`[useDebouncedLocalStorage] write failed for ${key}:`, err);
      }
    }, delay);
    return () => window.clearTimeout(handle);
  }, [key, value, delay, serialize, enabled]);
}
