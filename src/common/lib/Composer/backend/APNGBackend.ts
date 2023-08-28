import { Deferred } from 'xr-core';
import { ComposerBackend, IComposeArg } from './ComposerBackend';
import UPNG from 'upng-js';
import { ProgressHelper } from '../../ProgressHelper';
import { ImageUtil } from '../../ImageUtil';

export class APNGBackend extends ComposerBackend {
  compose = Deferred.wrapAsyncFn<[arg: IComposeArg], Blob>(
    async (defer, { list, fps, width = 512, height = 512, quality = 1 }) => {
      const pgh = new ProgressHelper(defer.setProgress).splitAvg('compress', 'assemble');

      const imgBufList: ArrayBuffer[] = [];

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const _ctx = canvas.getContext('2d')!;

      // 提取 png buf
      for (let i = 0; i < list.length; i++) {
        const frame = list[i];
        const img = await frame.toImage().ret;

        const { drawArgs } = ImageUtil.calcDrawArgs(ImageUtil.getSize(img), { width, height, fit: 'contain' });

        _ctx.clearRect(0, 0, width, height);
        _ctx.drawImage(
          img,
          drawArgs.sx,
          drawArgs.sy,
          drawArgs.sw,
          drawArgs.sh,
          drawArgs.dx,
          drawArgs.dy,
          drawArgs.dw,
          drawArgs.dh
        );

        const buf = _ctx.getImageData(0, 0, width, height).data.buffer;

        imgBufList.push(buf);
        pgh.compress((i + 1) / list.length);
      }

      // 0.9->4k, 0.8->2k, 0.7->1k ...
      const cnum = quality >= 1 ? 0 : (1 << Math.floor(quality * 10)) * 8;
      const delays: number[] = new Array(list.length).fill(Math.round(1000 / fps));

      const apngBuf = UPNG.encode(imgBufList, width, height, cnum, delays);

      pgh.assemble(1);

      canvas.width = 0;
      canvas.height = 0;

      return new Blob([apngBuf], { type: 'image/apng' });
    }
  );
}
