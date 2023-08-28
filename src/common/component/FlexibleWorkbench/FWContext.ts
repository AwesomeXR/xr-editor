import { createContext } from 'react';
import { EventBus } from 'ah-event-bus';
import { IWBConfigData, IWBLayout, IWBLayoutComponent } from './IWBLayout';

export type IFWEvt = {
  reflow: null;
  afterConfigChange: { source?: IWBLayout; skipRefresh?: boolean };
  afterEnterPanel: { item: IWBLayoutComponent };
};

export type IFWContext = {
  config: IWBConfigData;
  components: Record<string, any>;
  event: EventBus<IFWEvt>;

  currentLayout: IWBLayout;

  renderTitle: (layout: IWBLayout) => any;
  renderIcon?: (layout: IWBLayout) => any;
};

export const FWContext = createContext<IFWContext>(null as any);
