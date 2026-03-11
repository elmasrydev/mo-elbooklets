import { useState, useRef, useEffect, useCallback } from 'react';

/**
 * useAutoReset Hook
 * Automatically resets a boolean state back to false after a specified delay.
 * Useful for validation borders that should disappear after a few seconds.
 */
export const useAutoReset = (initialValue: boolean = false, delay: number = 3000) => {
  const [value, setValue] = useState<boolean>(initialValue);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setAutoValue = useCallback(
    (newValue: boolean) => {
      setValue(newValue);

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // If setting to true, schedule a reset to false
      if (newValue === true) {
        timeoutRef.current = setTimeout(() => {
          setValue(false);
        }, delay);
      }
    },
    [delay],
  );

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return [value, setAutoValue] as const;
};
