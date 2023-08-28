import { Deferred } from 'xr-core';
import { Frame } from '../Frame';
import { ComposerBackend, IComposeArg } from './ComposerBackend';

export class GIFBackend extends ComposerBackend {
  private _workerURL?: string;

  compose({ list, fps }: IComposeArg) {
    const defer = new Deferred<Blob>();

    const _workerURLPromise = this._workerURL
      ? Promise.resolve(this._workerURL)
      : fetch('https://rshop.tech/gw/assets/gif/gif.worker.js')
          .then(res => res.text())
          .then(text => URL.createObjectURL(new Blob([text], { type: 'application/javascript' })));

    _workerURLPromise
      .then(async _workerURL => {
        const imgs: HTMLImageElement[] = [];
        for (const frame of list) {
          imgs.push(await frame.toImage().ret);
        }

        const width = imgs[0].naturalWidth;
        const height = imgs[0].naturalHeight;

        const gif = new GIF({ workerScript: _workerURL, quality: 1, width, height, workers: 4 });

        imgs.forEach(img => gif.addFrame(img, { delay: 1000 / fps }));

        gif.on('progress', defer.setProgress);
        gif.on('abort', defer.reject);
        gif.on('finished', defer.resolve);

        gif.render();
      })
      .catch(defer.reject);

    return defer;
  }
}
