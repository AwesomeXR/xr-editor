import _ from 'lodash';
import { getInternalRandomString } from '../../lib/getInternalRandomString';
import { IWBConfigData, IWBLayout, IWBLayoutComponent, IWBLayoutSplit, IWBSplitDirection } from './IWBLayout';

export const WBUtil = {
  walkLayout(entry: IWBLayout, tap: (cur: IWBLayout, parent?: IWBLayout) => 'stop' | void, parent?: IWBLayout) {
    const _walk = (
      _entry: IWBLayout,
      _tap: (cur: IWBLayout, parent?: IWBLayout) => 'stop' | void,
      _parent?: IWBLayout
    ) => {
      const ret = _tap(_entry, _parent);
      if (ret === 'stop') throw new Error('__stop__');

      if (_entry.type === 'Component') return; // 结束

      if (_entry.type === 'Split') {
        _entry.children.forEach(child => this.walkLayout(child, _tap, _entry));
      }
    };

    try {
      _walk(entry, tap, parent);
    } catch (err) {
      if (err instanceof Error && err.message === '__stop__') return;
      throw err;
    }
  },

  getAllLayouts(config: IWBConfigData) {
    const list: IWBLayout[] = [];

    this.walkLayout(config.layout, cur => {
      list.push(cur);
    });

    // side panel
    if (config.sidePanel) {
      for (const _sp of config.sidePanel.list) {
        this.walkLayout(_sp.layout, cur => {
          list.push(cur);
        });
      }
    }

    return list;
  },

  createSplit(children: IWBLayout[], direction: IWBSplitDirection = 'horizontal', ratio = 0.5): IWBLayoutSplit {
    return { type: 'Split', key: getInternalRandomString(), ratio, direction, children };
  },

  createComponent(component: string, query?: any): IWBLayoutComponent {
    return { type: 'Component', key: getInternalRandomString(), component, query };
  },

  resetLayout(layout: IWBLayout, newData: IWBLayout) {
    // 原地修改 layout，保持引用
    Object.keys(layout).forEach(k => delete (layout as any)[k]);
    Object.assign(layout, newData);
  },

  splitPanel(layout: IWBLayoutComponent, direction: IWBSplitDirection, lay2?: IWBLayout) {
    if (!lay2) lay2 = this.createComponent(layout.component, _.cloneDeep(layout.query));
    if (lay2.key === layout.key) throw new Error('duplicated key: ' + lay2.key);

    const newLayout = this.createSplit([_.cloneDeep(layout), lay2], direction);
    this.resetLayout(layout, newLayout);
  },

  closePanel(config: IWBConfigData, closeKey: string) {
    let closeParent: IWBLayout | undefined;

    this.walkLayout(config.layout, (_cur, _parent) => {
      if (_cur.key === closeKey) {
        closeParent = _parent;
        return 'stop';
      }
    });

    if (!closeParent) throw new Error('missing closeParent');
    if (closeParent.type !== 'Split') throw new Error('closeParent.type error');

    const toKeepLayout = closeParent.children.find(c => c.key !== closeKey);
    if (!toKeepLayout) throw new Error('missing toKeepLayout');

    this.resetLayout(closeParent, toKeepLayout);
  },
};
