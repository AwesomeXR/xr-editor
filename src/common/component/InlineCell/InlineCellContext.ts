import { createContext } from 'react';

export type IInlineCellContextData = {
  readonly?: boolean;
  labelSpan?: number;
  childrenAlign?: 'left' | 'center' | 'right';
};

export const InlineCellContext = createContext<IInlineCellContextData>({});
