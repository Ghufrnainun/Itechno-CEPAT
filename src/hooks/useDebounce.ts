import { useState, useEffect } from "react";

/**
 * Hook untuk men-debounce value
 * Berguna untuk input pencarian agar tidak memanggil API di setiap ketikan.
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Update debounced value setelah delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel timeout jika value berubah atau komponen unmount
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
