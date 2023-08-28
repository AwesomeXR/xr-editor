import { EventBus } from 'ah-event-bus';

export type GetEventBusMeta<T> = T extends EventBus<infer R> ? R : any;
export type AddKeyPrefix<T, P extends string> = {
  [K in keyof T as K extends string ? `${P}${K}` : never]: T[K];
};

export type GetEventBusDelegateMeta<T, P extends string> = AddKeyPrefix<GetEventBusMeta<T>, P>;
export const isFile = (val: unknown): val is File => {
  return Object.prototype.toString.call(val) === '[object File]';
};
