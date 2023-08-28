export type IImageResizeOpt = {
  width?: number;
  height?: number;
  fit?: { type: 'contain' } | { type: 'cover' } | { type: 'fill' };
};

export const ImageUtil = {
  getSize(source: CanvasImageSource) {
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
  },
  calcDrawArgs(
    iSize: { height: number; width: number },
    opt: { width?: number; height?: number; fit: 'contain' | 'cover' | 'fill' }
  ) {
    let oSize = { width: 0, height: 0 };

    if (opt.width && opt.height) {
      oSize = { width: opt.width, height: opt.height };
    }
    //
    else if (opt.width && !opt.height) {
      oSize = { width: opt.width, height: (opt.width / iSize.width) * iSize.height };
    }
    //
    else if (!opt.width && opt.height) {
      oSize = { width: (opt.height / iSize.height) * iSize.width, height: opt.height };
    }
    //
    else oSize = { ...iSize };

    // 计算 drawArgs, 默认是平铺
    // prettier-ignore
    let drawArgs = { sx: 0, sy: 0, sw: iSize.width, sh: iSize.height, dx: 0, dy: 0, dw: oSize.width, dh: oSize.height,};

    if (opt.fit === 'contain') {
      const scaleW = oSize.width / iSize.width;
      const scaleH = oSize.height / iSize.height;
      const fitAxis = scaleW < scaleH ? 'w' : 'h';
      const scale = Math.min(scaleW, scaleH);

      drawArgs = {
        sx: 0,
        sy: 0,
        sw: iSize.width,
        sh: iSize.height,
        dx: fitAxis === 'w' ? 0 : (oSize.width - iSize.width * scale) / 2,
        dy: fitAxis === 'w' ? (oSize.height - iSize.height * scale) / 2 : 0,
        dw: iSize.width * scale,
        dh: iSize.height * scale,
      };
    }

    //
    else if (opt.fit === 'cover') {
      const iwRate = iSize.width / iSize.height;
      const owRate = oSize.width / oSize.height;

      const fillAxis = iwRate < owRate ? 'w' : 'h';
      const scale = fillAxis === 'w' ? oSize.width / iSize.width : oSize.height / iSize.height;

      drawArgs = {
        sx: fillAxis === 'w' ? 0 : (iSize.width - oSize.width / scale) / 2,
        sy: fillAxis === 'w' ? (iSize.height - oSize.height / scale) / 2 : 0,
        sw: fillAxis === 'w' ? iSize.width : oSize.width / scale,
        sh: fillAxis === 'w' ? oSize.height / scale : iSize.height,
        dx: 0,
        dy: 0,
        dw: oSize.width,
        dh: oSize.height,
      };
    }

    //
    else if (opt.fit === 'fill') {
      // prettier-ignore
      drawArgs = { sx: 0, sy: 0, sw: iSize.width, sh: iSize.height, dx: 0, dy: 0, dw: oSize.width, dh: oSize.height };
    }

    const drawArgParams = [
      drawArgs.sx,
      drawArgs.sy,
      drawArgs.sw,
      drawArgs.sh,
      drawArgs.dx,
      drawArgs.dy,
      drawArgs.dw,
      drawArgs.dh,
    ] as const;

    return { oSize, drawArgs, drawArgParams };
  },
  quickResizeSquare(
    source: CanvasImageSource,
    size: number,
    type?: 'image/jpeg' | 'image/png',
    quality?: number,
    canvas = document.createElement('canvas')
  ) {
    const iSize = this.getSize(source);
    const { drawArgParams } = this.calcDrawArgs(iSize, { width: size, height: size, fit: 'fill' });

    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(source, ...drawArgParams);

    return canvas.toDataURL(type, quality);
  },
  // quickFlipY(
  //   source: CanvasImageSource,
  //   type?: 'image/jpeg' | 'image/png',
  //   quality?: number,
  //   canvas = document.createElement('canvas')
  // ) {
  //   const iSize = this.getSize(source);

  //   canvas.width = iSize.width;
  //   canvas.height = iSize.height;

  //   const ctx = canvas.getContext('2d')!;
  //   ctx.scale(1, -1);
  //   ctx.drawImage(source, 0, 0, iSize.width, iSize.height);

  //   return canvas.toDataURL(type, quality);
  // },
};
