import { EventBus } from 'ah-event-bus';
import { BizCanvas } from './BizCanvas';
import { getImage } from './getImage';
import { MemoryFS } from 'ah-memory-fs';
import { getFetchableURL } from './getFetchableURL';

export type IPaintAction = { type: 'FillColor'; color?: string } | { type: 'FillImage'; image?: string };

export class ActionPainter {
  readonly event = new EventBus<{ afterActionsChange: null; afterDraw: null }>();

  private _bizCanvas: BizCanvas;
  private _actions: IPaintAction[] = [];

  constructor(
    private mfs: MemoryFS,
    width: number,
    height: number
  ) {
    this._bizCanvas = new BizCanvas(width, height);
  }

  get bizCanvas() {
    return this._bizCanvas;
  }

  get actions() {
    return this._actions;
  }

  private async _applyAction(act: IPaintAction) {
    switch (act.type) {
      case 'FillColor':
        if (!act.color) return;
        this._bizCanvas.fillColor(act.color);
        break;

      case 'FillImage':
        if (!act.image) return;
        const url = await getFetchableURL(this.mfs, act.image);
        const img = await getImage(url).ret;
        this._bizCanvas.drawImage(img, 'fill');

      default:
        break;
    }
  }

  private async _redraw(list: IPaintAction[], clear?: boolean) {
    if (clear) this._bizCanvas.fillColor('transparent');

    for (const act of list) {
      await this._applyAction(act);
    }

    this.event.emit('afterDraw', null);
  }

  async addActions(list: IPaintAction[]) {
    this._actions.push(...list);
    this.event.emit('afterActionsChange', null);
    await this._redraw(list);
  }

  async resetActions(list: IPaintAction[]) {
    this._actions = [...list];
    this.event.emit('afterActionsChange', null);
    await this._redraw(this._actions, true);
  }

  async spliceActions(start: number, deleteCount: number, ...add: IPaintAction[]) {
    this._actions.splice(start, deleteCount, ...add);
    this.event.emit('afterActionsChange', null);
    await this._redraw(this._actions, true);
  }

  dispose() {
    this.event.clear();
  }
}
