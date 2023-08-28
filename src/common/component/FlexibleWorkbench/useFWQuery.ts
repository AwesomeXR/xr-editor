import { useContext } from 'react';
import { FWContext } from './FWContext';
import { useForceUpdate } from '../../hook';

export const useFWQuery = <T, C extends string>(updatable?: boolean) => {
  const ctx = useContext(FWContext);
  const fu = useForceUpdate();

  const layout = ctx.currentLayout;

  const getQuery = (): T | undefined => {
    return layout.type === 'Component' ? layout.query : undefined;
  };
  const query = getQuery();

  const setQuery = (q: T | undefined) => {
    if (layout.type === 'Component') {
      layout.query = q;
      ctx.event.emit('afterConfigChange', { source: layout, skipRefresh: true });

      if (updatable) fu.update();
    }
  };

  const mergeQuery = (q: Partial<T> | undefined) => {
    setQuery({ ...getQuery(), ...q } as any);
  };

  return { query, setQuery, getQuery, mergeQuery };
};
