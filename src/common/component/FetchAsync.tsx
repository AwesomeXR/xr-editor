import React, { useEffect } from 'react';
import { useRequest } from '../hook/useRequest';

export interface IFetchAsyncProps<T> {
  refreshKey?: string | number;
  request: () => Promise<T>;
  children: (data: T) => any;

  loading?: () => any;
}

export function FetchAsync<T>({
  refreshKey,
  loading = () => <span>载入中...</span>,
  request,
  children,
}: IFetchAsyncProps<T>) {
  const req = useRequest(request);

  useEffect(() => req.refresh({}).cancel, [refreshKey]);

  if (req.state.type === 'success') return children(req.state.data);
  if (req.state.type === 'loading' && loading) return loading();

  return null;
}
