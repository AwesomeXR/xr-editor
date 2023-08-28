import { EventBus } from 'ah-event-bus';
import { IBizIconName } from '../../../common/component/BizIcon';
import { BaseViewModel } from '../BaseViewModel';
import { WorkbenchModel } from './WorkbenchModel';
import { Logger } from 'ah-logger';

export type IMenuItem = {
  title: string;
  icon?: IBizIconName;

  command?: string;
  arg?: string;

  hotkey?: string;

  active?: boolean;
  disabled?: boolean;

  children?: IMenuItem[];
};

export type IMenuBarItem = { title: string; items: IMenuItem[]; active?: boolean };

export type IPanelModelBaseEvent<S extends Record<string, any>> = {
  afterMenuBarChange: {};
  afterStateChange: Partial<S>;
  invoke: { method: string; arg?: string };
};

export abstract class PanelModel<
  P,
  S extends Record<string, any>,
  EV extends Record<string, any>,
> extends BaseViewModel<EV & IPanelModelBaseEvent<S>> {
  // init 阶段初始化
  workbench!: WorkbenchModel;
  comp!: string;
  ID!: string; // 面板 ID
  wbIndexID!: number; // 工作区序号
  logger!: Logger;

  private _menuBar: IMenuBarItem[] = [];

  /** @override 初始化状态 */
  _state: S = {} as any;

  private get _typedEvent() {
    return this.event as any as EventBus<IPanelModelBaseEvent<S>>;
  }

  init(workbench: WorkbenchModel, comp: string, ID: string, wbIndexID: number) {
    this.workbench = workbench;
    this.comp = comp;
    this.ID = ID;
    this.wbIndexID = wbIndexID;

    this.logger = this.workbench.project.logger.extend(`${this.comp}:${this.ID}`);

    this.workbench.panelModels.push(this as any);
    this._typedEvent.delegate(this.workbench.event.delegateReceiver('panel:'));
  }

  get menuBar(): IMenuBarItem[] {
    return this._menuBar;
  }
  set menuBar(value: IMenuBarItem[]) {
    this._menuBar = value;
    this._typedEvent.emit('afterMenuBarChange', {});
  }

  get state(): S {
    return this._state;
  }

  get project() {
    return this.workbench.project;
  }

  get scene() {
    return this.project.activeScene;
  }

  updateState(st: Partial<S>, opt: { silence?: boolean } = {}) {
    Object.assign(this._state, st);
    if (!opt.silence) this._typedEvent.emit('afterStateChange', st);
  }

  dispose(): void {
    super.dispose();

    const idx = this.workbench.panelModels.findIndex(
      p => p.ID === this.ID && p.wbIndexID === this.workbench.wbConfigIdx
    );
    if (idx >= 0) this.workbench.panelModels.splice(idx, 1);
  }

  abstract restore(props: P): void;
  abstract save(): P;
}
