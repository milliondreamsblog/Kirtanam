import { useState, useEffect } from "react";

/**
 * Delays updating a value until after a specified wait time has elapsed
 * since the last time it was changed.
 *
 * @param value  - The value to debounce
 * @param delay  - Milliseconds to wait before updating (default: 400ms)
 * @returns        The debounced value
 *
 * @example
 * const debouncedSearch = useDebounce(searchQuery, 400);
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
