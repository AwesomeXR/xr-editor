import { IWBConfigData } from '../common';
import { IBizIconName } from '../common/component/BizIcon';
import { PanelModel } from './ViewModel';

// 定义 PanelModel 的构造类
export interface PanelModelCls {
  new (): PanelModel<any, any, any>;
}

export type IXRExtensionPanel = {
  component: string;
  title: string;
  icon?: IBizIconName;
  model: PanelModelCls;
  view: React.FC<any>;

  // 该面板可以在哪些工作台中显示
  allowedSlots?: ('main' | 'side')[];
};

export type IXRExtensionWorkbench = {
  data: IWBConfigData;
};

export type IXRExtension = {
  panels?: IXRExtensionPanel[];
  workbenches?: IXRExtensionWorkbench[];
};

// 编辑器扩展注册表
export class XRExtensionRegistry {
  static readonly Default = new XRExtensionRegistry();

  private _store = new Map<string, IXRExtension>();

  register(name: string, data: IXRExtension) {
    this._store.set(name, data);
  }

  get(name: string) {
    return this._store.get(name);
  }

  getAll() {
    return this._store;
  }

  get componentViewMap() {
    const map: { [key: string]: React.FC<any> } = {};

    this._store.forEach(value => {
      value.panels?.forEach(panel => {
        map[panel.component] = panel.view;
      });
    });

    return map;
  }

  getPanelTitle(component: string) {
    return this.getPanel(component)?.title;
  }

  getPanel(component: string) {
    for (const [key, value] of this._store) {
      for (const panel of value.panels || []) {
        if (panel.component === component) {
          return panel;
        }
      }
    }
  }
}
