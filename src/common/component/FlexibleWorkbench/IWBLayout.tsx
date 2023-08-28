export type IWBLayoutComponent = { key: string; type: 'Component'; component: string; query?: any };

export type IWBSplitDirection = 'vertical' | 'horizontal';
export type IWBLayoutSplit = {
  key: string;
  type: 'Split';
  ratio?: number;
  direction?: IWBSplitDirection;
  children: IWBLayout[];
};

export type IWBLayout = IWBLayoutComponent | IWBLayoutSplit;

export type IWBSidePanel = {
  layout: IWBLayout;
};

export type IWBConfigData = {
  key: string;

  title?: string;
  layout: IWBLayout;

  // 侧边栏
  sidePanel?: {
    width: number; // 侧边栏宽度
    activeIdx: number; // 当前激活的侧边栏
    list: IWBSidePanel[]; // 侧边栏列表
  };

  /** 当仅有一个组件时，隐藏 header widget */
  hideHeaderWhenSingleComponent?: boolean;

  hideHeaderWidget?: boolean;

  /** 组件白名单 */
  componentWhitelist?: string[];
};
