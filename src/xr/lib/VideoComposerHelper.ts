import { EventBus } from 'ah-event-bus';
import { SceneModel } from '../ViewModel';
import { APNGBackend, Composer, Frame } from '../../common';
import { MovieClipHelper } from './MovieClipHelper';
import { Deferred } from 'xr-core';

type IComposerState = 'init' | 'recording' | 'recorded' | 'composing' | 'composed' | 'stop';

export class VideoComposerHelper {
  readonly event = new EventBus<{
    afterStateChange: {};
    afterSnapshot: { snap: Frame; frameNo: number };
    onComposeProgress: { pg: number };
    afterComposed: { blob: Blob };
  }>();

  private _clipHelper?: MovieClipHelper;
  private _state: IComposerState = 'init';

  private _timer: any;
  private _snapshots: Frame[] = [];

  private _composingProgress = 0;

  constructor(readonly scene: SceneModel) {}

  set clipHelper(helper: MovieClipHelper) {
    this._clipHelper = helper;
  }

  get state() {
    return this._state;
  }

  get composingProgress() {
    return this._composingProgress;
  }

  private _setState(state: IComposerState) {
    if (this._state === state) return;
    this._state = state;
    this.event.emit('afterStateChange', {});
  }

  stop() {
    if (this._state === 'recording') {
      if (this._timer) cancelAnimationFrame(this._timer);
      this._setState('stop');
    }
  }

  record(sampleRate = 30) {
    if (!this._clipHelper) throw new Error('clipHelper not set');

    const clipHelper = this._clipHelper;
    const frameStep = Math.floor(60 / sampleRate);
    const range = clipHelper.range;

    this._snapshots = [];
    let frameNo = range[0];

    const _doTakeSnap = () => {
      this._setState('recording');

      if (range[1] < frameNo) {
        this._setState('recorded');
        return;
      }

      clipHelper.setFrame(frameNo);

      this.scene.takeSnapshot().ret.then(data => {
        const snap = new Frame(data);
        this._snapshots.push(snap);

        this.event.emit('afterSnapshot', { snap, frameNo });

        // 开始下一帧
        frameNo += frameStep;
        this._timer = requestAnimationFrame(_doTakeSnap);
      });
    };

    _doTakeSnap();
  }

  compose(target: 'APNG', width: number, height: number, sampleRate = 30, quality = 0.7): Deferred<Blob> {
    if (this._snapshots.length === 0) throw new Error('no snapshots');

    const composer = new Composer();

    if (target === 'APNG') composer.setBackend(new APNGBackend());
    else throw new Error('unknown target: ' + target);

    // 添加 frames
    this._snapshots.forEach(snap => composer.addFrame(snap));

    this._composingProgress = 0;
    this._setState('composing');

    const defer = composer.compose({ fps: sampleRate, width, height, quality });

    defer.event.listen('progressChange', pg => {
      this._composingProgress = pg;
      this.event.emit('onComposeProgress', { pg });
    });

    defer.ret.then(blob => {
      this._setState('composed');
      this.event.emit('afterComposed', { blob });
    });

    return defer;
  }
}
