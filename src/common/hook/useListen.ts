import { EventBus } from 'ah-event-bus';
import { useEffect } from 'react';

export const useListen = <T extends Record<string, any>, K extends keyof T>(
  evBus: EventBus<T>,
  key: K,
  cb: (ev: T[K]) => any,
  deps: any[] = []
) => {
  useEffect(() => {
    return evBus.listen(key, cb);
  }, [evBus, key, ...deps]);
};
