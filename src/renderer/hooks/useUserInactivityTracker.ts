

import { useEffect, useRef } from 'react';
import { useWalletsForceOpen } from '../state/wallets/hooks';

export function useUserInactivityTracker(
  onInactivity: () => void,
  timeout = 10 * 60 * 1000, // 默认 10 分钟
  debounceDelay = 300 // 防抖间隔
) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const forceOpen = useWalletsForceOpen();


  useEffect(() => {
    const resetTimer = () => {
      // 防抖：避免频繁重置
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(onInactivity, timeout);
      }, debounceDelay);
    };

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer, { passive: true }));
    resetTimer(); // 初始化

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (timerRef.current) clearTimeout(timerRef.current);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [onInactivity, timeout, debounceDelay, forceOpen]);
}
