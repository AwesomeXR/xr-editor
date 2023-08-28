import { useRef } from 'react';

export const useHandler = <T extends (...args: any[]) => any>(fn: T) => {
  const cc = useRef<T>(fn);
  cc.current = fn; // 始终指向最新闭包函数

  const handlerRef = useRef<any>((...args: any[]) => cc.current(...args));
  return handlerRef.current as T;
};
