import { LookUpType } from 'ah-type-helper';
import { BizCanvas } from './BizCanvas';
import { getImage } from './getImage';

export type IPaintOp =
  | {
      type: 'FillColor';
      arg?: { color: number[] };
    }
  | {
      type: 'FillImage';
      arg?: { source: string | CanvasImageSource };
    };

type IIPaintOpImpl = {
  [T in IPaintOp['type'] as `_${T}`]: (imgData: ImageData, op: LookUpType<IPaintOp, T>) => Promise<void>;
};

export class PaintOpExecutor<T extends IPaintOp> implements IIPaintOpImpl {
  async _FillColor(imgData: ImageData, op: LookUpType<IPaintOp, 'FillColor'>) {
    const arg = op.arg;
    if (!arg) return;

    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i] = arg.color[0];
      imgData.data[i + 1] = arg.color[1];
      imgData.data[i + 2] = arg.color[2];
      imgData.data[i + 3] = arg.color[3];
    }
  }

  async _FillImage(imgData: ImageData, op: LookUpType<IPaintOp, 'FillImage'>) {
    const arg = op.arg;
    if (!arg) return;

    const tempCanvas = new BizCanvas(imgData.width, imgData.height);
    const source = typeof arg.source === 'string' ? await getImage(arg.source).ret : arg.source;

    tempCanvas.drawImage(source, 'fill');

    const srcData = tempCanvas.ctx.getImageData(0, 0, tempCanvas.canvas.width, tempCanvas.canvas.height);

    for (let i = 0; i < imgData.data.length; i += 4) {
      imgData.data[i] = srcData.data[i];
      imgData.data[i + 1] = srcData.data[i + 1];
      imgData.data[i + 2] = srcData.data[i + 2];
      imgData.data[i + 3] = srcData.data[i + 3];
    }
  }

  async execute(imgData: ImageData, op: T, mask?: Uint8ClampedArray) {
    if (mask && mask.byteLength !== imgData.width * imgData.height) {
      throw new Error('mask size error');
    }

    const handler = (this as any)['_' + op.type];
    if (typeof handler !== 'function') throw new Error('missing handler: ' + op.type);

    const stash = new ImageData(imgData.data, imgData.width, imgData.height, { colorSpace: imgData.colorSpace });
    await (handler as Function).call(this, stash, op, mask);

    // mask 剪裁
    if (mask) {
      for (let i = 0; i < stash.data.length; i += 4) {
        const level = mask[i];
        stash.data[i] *= level;
        stash.data[i + 1] *= level;
        stash.data[i + 2] *= level;
        stash.data[i + 3] *= level;
      }
    }

    imgData.data.set(stash.data, 0);
  }
}
