import { useRef, useState } from 'react';

export type IUseRequestRet<Q, T> = {
  state: { type: 'init' } | { type: 'loading' } | { type: 'success'; data: T } | { type: 'fail'; err: Error };
  refresh: (q: Q) => { ret: Promise<T>; cancel: (reason?: string) => void };
  lastQuery: () => Q | undefined;
  lastSuccessData: () => T | undefined;
};

export type IServiceType<Q, T> = (q: Q) => Promise<T>;

export function useRequest<Q, T>(service: IServiceType<Q, T>): IUseRequestRet<Q, T>;
export function useRequest<Q, T>(service: IServiceType<Q, T> | undefined): IUseRequestRet<Q, T> | undefined;

export function useRequest(service: any) {
  const lastQueryRef = useRef();
  const lastSuccessDataRef = useRef();

  const [state, updateState] = useState<IUseRequestRet<any, any>['state']>({ type: 'init' });

  const refresh = (q: any) => {
    lastQueryRef.current = q;

    const token: {
      ret: any;
      cancel: (reason?: string) => void;
    } = { ret: undefined, cancel: () => {} };

    updateState({ type: 'loading' });

    token.ret = Promise.race([
      // invoke service
      service(q),

      // 竞速取消
      new Promise((_, reject) => {
        token.cancel = (reason = 'refresh cancel') => {
          reject(Object.assign(new Error(reason), { __cancel: true }));
        };
      }),
    ])
      .then(data => {
        lastSuccessDataRef.current = data;
        updateState({ type: 'success', data });
        return data;
      })
      .catch(err => {
        if (err.__cancel) {
          console.info(err.message);
          return;
        }

        console.error(err);
        updateState({ type: 'fail', err });

        throw err;
      });

    return token;
  };

  if (!service) return;

  return {
    state,
    refresh,
    lastQuery: () => lastQueryRef.current,
    lastSuccessData: () => lastSuccessDataRef.current,
  };
}
