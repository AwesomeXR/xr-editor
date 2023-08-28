import { useEffect, useMemo } from 'react';

/** 类似 constructor */
export const useSetup = (fn: () => (() => any) | undefined, deps: any[] = []) => {
  const cancel = useMemo(fn, deps);
  useEffect(() => () => cancel?.(), deps);
};
