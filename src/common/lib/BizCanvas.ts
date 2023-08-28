export class BizCanvas {
  static getCanvasImageSourceSize = getCanvasImageSourceSize;
  static calcDrawArgs = calcDrawArgs;

  private readonly _scaleRate = 2;
  private readonly _canvas = document.createElement('canvas');

  private _ctx?: CanvasRenderingContext2D;

  constructor(width: number, height: number) {
    // 默认画布参数
    this._canvas.width = width;
    this._canvas.height = height;
  }

  get canvas() {
    return this._canvas;
  }

  get ctx() {
    if (this._ctx) return this._ctx;

    const ctx = this._canvas.getContext('2d');
    if (!ctx) throw new Error('missing ctx');

    this._ctx = ctx;
    return ctx;
  }

  fillColor(color: string) {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawImage(source: CanvasImageSource, fit: 'contain' | 'cover' | 'fill', maskData?: ImageData) {
    const sourceSize = getCanvasImageSourceSize(source);
    const arg = calcDrawArgs(sourceSize, this._canvas, fit);

    this.ctx.drawImage(source, arg.sx, arg.sy, arg.sw, arg.sh, arg.dx, arg.dy, arg.dw, arg.dh);

    if (maskData) {
      if (maskData.height !== sourceSize.height || maskData.width !== sourceSize.width) {
        throw new Error('mask size error');
      }

      const imgData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
      for (let i = 0; i < imgData.data.length; i += 4) {
        const level = maskData.data[i + 3];
        imgData.data[i + 3] *= level / 255;
      }

      this.ctx.putImageData(imgData, 0, 0);
    }
  }

  putImageData(imagedata: ImageData) {
    return this.ctx.putImageData(imagedata, 0, 0);
  }

  getImageData() {
    return this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
  }
}

function getCanvasImageSourceSize(source: CanvasImageSource): { height: number; width: number } {
  const size =
    source instanceof HTMLImageElement
      ? { height: source.naturalHeight, width: source.naturalWidth }
      : source instanceof HTMLVideoElement
      ? { height: source.videoHeight, width: source.videoWidth }
      : source instanceof HTMLCanvasElement
      ? { height: source.height, width: source.width }
      : null;

  if (!size) throw new Error('source not support');
  return size;
}

function calcDrawArgs(
  iSize: { height: number; width: number },
  cavSize: { height: number; width: number },
  fit: 'contain' | 'cover' | 'fill'
) {
  // 计算 drawArgs, 默认是平铺
  // prettier-ignore
  let drawArgs = { sx: 0, sy: 0, sw: iSize.width, sh: iSize.height, dx: 0, dy: 0, dw: cavSize.width, dh: cavSize.height };

  if (fit === 'contain') {
    const scaleW = cavSize.width / iSize.width;
    const scaleH = cavSize.height / iSize.height;
    const fitAxis = scaleW < scaleH ? 'w' : 'h';
    const scale = Math.min(scaleW, scaleH);

    drawArgs = {
      sx: 0,
      sy: 0,
      sw: iSize.width,
      sh: iSize.height,
      dx: fitAxis === 'w' ? 0 : (cavSize.width - iSize.width * scale) / 2,
      dy: fitAxis === 'w' ? (cavSize.height - iSize.height * scale) / 2 : 0,
      dw: iSize.width * scale,
      dh: iSize.height * scale,
    };
  }

  //
  else if (fit === 'cover') {
    const iwRate = iSize.width / iSize.height;
    const owRate = cavSize.width / cavSize.height;

    const fillAxis = iwRate < owRate ? 'w' : 'h';
    const scale = fillAxis === 'w' ? cavSize.width / iSize.width : cavSize.height / iSize.height;

    drawArgs = {
      sx: fillAxis === 'w' ? 0 : (iSize.width - cavSize.width / scale) / 2,
      sy: fillAxis === 'w' ? (iSize.height - cavSize.height / scale) / 2 : 0,
      sw: fillAxis === 'w' ? iSize.width : cavSize.width / scale,
      sh: fillAxis === 'w' ? cavSize.height / scale : iSize.height,
      dx: 0,
      dy: 0,
      dw: cavSize.width,
      dh: cavSize.height,
    };
  }

  //
  else {
    // prettier-ignore
    drawArgs = { sx: 0, sy: 0, sw: iSize.width, sh: iSize.height, dx: 0, dy: 0, dw: cavSize.width, dh: cavSize.height };
  }

  return drawArgs;
}
