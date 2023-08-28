import { useCallback, useEffect, useRef } from 'react';

export const useThrottle = <T extends (...args: any[]) => void>(fn: T, delay: number, dep: any[] = []): T => {
  const { current } = useRef({ fn, timer: null as any });

  useEffect(() => {
    current.fn = fn;
  }, [fn]);

  const cb = useCallback((...args: any[]) => {
    if (current.timer) return; //  还在计时中, 返回
    current.timer = setTimeout(() => (current.timer = null), delay);

    current.fn(...args);
  }, dep);

  return cb as any;
};
