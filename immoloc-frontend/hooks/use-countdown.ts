'use client';

import { useState, useEffect, useRef } from 'react';

export function useCountdown(initialSeconds: number) {
  const [seconds, setSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  function start() {
    setSeconds(initialSeconds);
  }

  useEffect(() => {
    if (seconds <= 0) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => setSeconds((s) => s - 1), 1000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [seconds]);

  return { seconds, isRunning: seconds > 0, start };
}
