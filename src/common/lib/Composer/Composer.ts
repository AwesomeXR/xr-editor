import { Deferred } from 'xr-core';
import { Frame } from './Frame';
import { ComposerBackend, IComposeArg } from './backend/ComposerBackend';

export class Composer {
  private _frames: Frame[] = [];
  private _backend?: ComposerBackend;

  setBackend(backend: ComposerBackend) {
    this._backend = backend;
  }

  addFrame(frame: Frame) {
    this._frames.push(frame);
  }

  clearFrames() {
    this._frames.length = 0;
  }

  get frameLength() {
    return this._frames.length;
  }

  compose(arg: Omit<IComposeArg, 'list'>): Deferred<Blob> {
    if (!this._backend) throw new Error('missing backend');
    if (this._frames.length === 0) throw new Error('frames is empty');

    const defer = this._backend.compose({ ...arg, list: this._frames });
    return defer;
  }
}
