import { useEffect, useRef } from 'react';

export const usePanicTap = (tapCount = 4, timeWindow = 600) => {
  const tapsRef = useRef<number[]>([]);

  useEffect(() => {
    const handleTap = (e: MouseEvent | TouchEvent) => {
      // Ignore taps on keypad buttons or interactive elements
      const target = e.target as HTMLElement;
      if (
        target.closest('button') ||
        target.closest('input') ||
        target.closest('[data-ignore-panic]')
      ) {
        return;
      }

      const now = Date.now();
      tapsRef.current.push(now);
      
      // Keep only taps within the time window
      tapsRef.current = tapsRef.current.filter(tap => now - tap < timeWindow);
      
      if (tapsRef.current.length >= tapCount) {
        // Panic! Redirect to Google
        window.location.href = 'https://google.com';
      }
    };

    document.addEventListener('touchstart', handleTap);
    document.addEventListener('click', handleTap);

    return () => {
      document.removeEventListener('touchstart', handleTap);
      document.removeEventListener('click', handleTap);
    };
  }, [tapCount, timeWindow]);
};
