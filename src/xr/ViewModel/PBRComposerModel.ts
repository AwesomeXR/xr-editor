import { BaseViewModel } from './BaseViewModel';
import _ from 'lodash';
import { IPaintOp, PaintOpExecutor } from '../../common/lib/PaintOp';
import { Deferred } from 'xr-core';
import { BizCanvas } from '../../common/lib/BizCanvas';
import { ProgressHelper, getInternalRandomString } from '../../common';
import { XRProjectModel } from './XRProjectModel';

export type IPBRComposerChannel = 'baseColor' | 'metallic' | 'roughness';

export type IPBRComposerConfigLayer = {
  channelMap: Record<IPBRComposerChannel, { ops: Array<IPaintOp>; grayMode?: boolean }>;
};

/** JSON描述，可序列化 */
export type IPBRComposeConfig = {
  slots: Record<string, { layers: Array<IPBRComposerConfigLayer>; mask?: Uint8ClampedArray }>;
};

export type IPBRComposerModelSeqData = { name: string; config: IPBRComposeConfig };

export class PBRComposerModel extends BaseViewModel<{
  afterConfigChange: null;
  afterCompose: null;
}> {
  private _logger = this.project.logger.extend('PBRComposer');

  name = getInternalRandomString(true);
  config: IPBRComposeConfig = { slots: {} };
  latestResult?: Record<IPBRComposerChannel, BizCanvas>;

  constructor(readonly project: XRProjectModel) {
    super();
    this.event.delegate(this.project.event.delegateReceiver('PbrComposer:'));
  }

  private lazyCompose = _.throttle(() => this.compose(), 100);

  get slots() {
    return this.config.slots;
  }

  addSlot(name: string) {
    this.config.slots[name] = { layers: [] };
    this.triggerConfigChange();
  }

  addLayer(slotName: string) {
    const slot = this.config.slots[slotName];
    if (!slot) throw new Error('missing slot: ' + slotName);

    slot.layers.unshift({
      channelMap: {
        baseColor: { ops: [] },
        metallic: { ops: [], grayMode: true },
        roughness: { ops: [], grayMode: true },
      },
    });

    this.triggerConfigChange();
  }

  triggerConfigChange() {
    this.lazyCompose();
    this.event.emit('afterConfigChange', null);
  }

  save() {
    return { name: this.name, config: this.config };
  }

  async restore(data: IPBRComposerModelSeqData) {
    this.name = data.name;
    this.config = data.config;
    this.lazyCompose();
    this.event.emit('afterConfigChange', null);
  }

  compose = Deferred.wrapAsyncFn<[], any>(async defer => {
    const actionMap: Record<
      IPBRComposerChannel,
      Array<{ slotName: string; layerIdx: number; op: IPaintOp; mask?: Uint8ClampedArray }>
    > = { baseColor: [], metallic: [], roughness: [] };

    for (const [sName, slot] of Object.entries(this.config.slots)) {
      const _layers = slot.layers.reverse();

      for (let _lyIdx = 0; _lyIdx < _layers.length; _lyIdx++) {
        const layer = _layers[_lyIdx];

        for (const ch of Object.keys(layer.channelMap) as IPBRComposerChannel[]) {
          for (const op of layer.channelMap[ch].ops) {
            actionMap[ch].push({ slotName: sName, layerIdx: _lyIdx, op, mask: slot.mask });
          }
        }
      }
    }

    const ph = new ProgressHelper(defer.setProgress).splitAvg('baseColor', 'metallic', 'roughness');
    const opExecutor = new PaintOpExecutor();

    const canvasMap: Record<IPBRComposerChannel, BizCanvas> = {
      baseColor: new BizCanvas(1024, 1024),
      metallic: new BizCanvas(1024, 1024),
      roughness: new BizCanvas(1024, 1024),
    };

    const imgDataMap: Record<IPBRComposerChannel, ImageData> = {
      baseColor: canvasMap.baseColor.getImageData(),
      metallic: canvasMap.metallic.getImageData(),
      roughness: canvasMap.roughness.getImageData(),
    };

    let cnt = 0;

    // 开始执行合成
    for (const [_ch, actions] of Object.entries(actionMap)) {
      cnt += 1;
      const ch = _ch as IPBRComposerChannel;

      for (let i = 0; i < actions.length; i++) {
        const act = actions[i];
        ph[ch](i / actions.length);

        this._logger.info(
          '[%s] composing %s: slot=%s, layer=%s, op=%s',
          `${cnt}/${actions.length}`,
          _ch,
          act.slotName,
          act.layerIdx,
          act.op.type + ':' + JSON.stringify(act.op.arg)
        );
        await opExecutor.execute(imgDataMap[ch], act.op, act.mask);
      }

      // 回写 canvas
      canvasMap[ch].putImageData(imgDataMap[ch]);
    }

    this.latestResult = canvasMap;
    this.event.emit('afterCompose', null);
  });
}
