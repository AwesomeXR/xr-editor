import _ from 'lodash';
import { IWBConfigData, IWBLayoutComponent, WBUtil } from '../../../common/component/FlexibleWorkbench';
import { BaseViewModel } from '../BaseViewModel';
import { XRProjectModel } from '../XRProjectModel';
import { IPanelModelBaseEvent, PanelModel } from './PanelModel';
import { XRExtensionRegistry } from '../../XRExtensionRegistry';

export type IWBScope = { comp: string; ID: string };

const DefaultWBConfig: IWBConfigData = {
  key: '__default',
  title: '默认工作区',
  layout: WBUtil.createComponent('ProjectSetting'),
};

/** 工作区内置的key */
export type IBuiltinWBKeyItem = 'ModelDesign' | 'AnimationDesign' | 'LogicDesign' | 'Export';

export class WorkbenchModel extends BaseViewModel<
  {
    scopeChange: {};
    wbConfigChange: {};
    wbConfigMetaChange: {};
  } & IPanelModelBaseEvent<{}>
> {
  // 工作分区
  wbConfigList: IWBConfigData[] = [DefaultWBConfig];
  wbConfigIdx: number = 0;

  wbScope: IWBScope = { comp: '*', ID: '' };

  readonly panelModels: PanelModel<any, any, IPanelModelBaseEvent<{}>>[] = [];

  constructor(readonly project: XRProjectModel) {
    super();
  }

  get wbConfig(): IWBConfigData {
    return this.wbConfigList[this.wbConfigIdx];
  }

  set wbConfig(data: IWBConfigData) {
    this.wbConfigList[this.wbConfigIdx] = data;
  }

  /** 添加工作分区 */
  addWbConfig(config: IWBConfigData) {
    this.wbConfigList.push(config);
    this.wbConfigIdx = this.wbConfigList.length - 1;
    this.wbScope = { comp: '*', ID: '' };

    this.event.emit('wbConfigChange', {});
  }

  /** 删除工作分区 */
  removeWbConfig(indx: number) {
    this.wbConfigList.splice(indx, 1);
    this.wbConfigIdx = this.wbConfigList.length - 1;
    this.wbScope = { comp: '*', ID: '' };

    this.event.emit('wbConfigChange', {});
  }

  switchWbConfig(index: number) {
    if (index === this.wbConfigIdx) return; // 无需切换

    const batchDispose = (PanelModelList: PanelModel<any, any, IPanelModelBaseEvent<{}>>[]): any => {
      const panel = PanelModelList.find(p => p.wbIndexID === this.wbConfigIdx);
      if (!panel) return;

      panel.dispose();

      return batchDispose(PanelModelList);
    };

    this.flushPanelModel(); // 保存当前工作区的数据
    batchDispose(this.panelModels);

    this.wbConfigIdx = index;
    this.wbScope = { comp: '*', ID: '' };

    this.event.emit('wbConfigChange', {});
  }

  setWbConfig(config: IWBConfigData, opt: { silence?: boolean } = {}) {
    this.wbConfig = config;

    this.cleanupPanelModel();
    if (!opt.silence) this.event.emit('wbConfigChange', {});
  }

  setScope(scope: IWBScope) {
    if (_.isEqual(this.wbScope, scope)) return;
    this.wbScope = scope;
    this.event.emit('scopeChange', {});
  }

  getPanelModel(ID: string): PanelModel<any, any, any> {
    const attachedLayout = WBUtil.getAllLayouts(this.wbConfig).find(
      d => d.type === 'Component' && d.key === ID
    ) as IWBLayoutComponent;
    if (!attachedLayout) throw new Error('missing layout: ' + ID);

    const existModel = this.panelModels.find(p => p.ID === ID && p.wbIndexID === this.wbConfigIdx);
    if (existModel) return existModel;

    const regData = XRExtensionRegistry.Default.getPanel(attachedLayout.component);
    if (!regData) throw new Error('missing registry data: ' + attachedLayout.key);

    const Cls = regData.model;
    const newModel = new Cls();

    newModel.init(this, attachedLayout.component, ID, this.wbConfigIdx);
    newModel.restore(attachedLayout.query);

    return newModel;
  }

  cleanupPanelModel() {
    const visibleCompIDs = new Set<string>();

    WBUtil.getAllLayouts(this.wbConfig).forEach(cur => {
      if (cur.type === 'Component') visibleCompIDs.add(cur.key);
    });

    for (const panel of this.panelModels) {
      if (panel.wbIndexID === this.wbConfigIdx && !visibleCompIDs.has(panel.ID)) panel.dispose();
    }
  }

  flushPanelModel() {
    const propsMap = new Map<string, any>();

    for (const panel of this.panelModels) {
      const props = panel.save();
      propsMap.set(panel.ID, props);
    }

    WBUtil.getAllLayouts(this.wbConfig).forEach(cur => {
      if (cur.type === 'Component') {
        if (propsMap.has(cur.key)) cur.query = JSON.parse(JSON.stringify(propsMap.get(cur.key)));
      }
    });
  }
}
