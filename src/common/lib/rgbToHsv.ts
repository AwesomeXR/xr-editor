/**
 * https://zhuanlan.zhihu.com/p/105886300
 */
export function rgbToHsv(r: number, g: number, b: number) {
  r = r / 255;
  g = g / 255;
  b = b / 255;

  const cMax = Math.max(r, g, b);
  const cMin = Math.min(r, g, b);

  const delta = cMax - cMin;

  let h: number;

  if (delta === 0) h = 0;
  else if (cMax === r) h = 60 * ((g - b) / delta + 0);
  else if (cMax === g) h = 60 * ((b - r) / delta + 2);
  else h = 60 * ((r - g) / delta + 4);

  if (h < 0) h += 360;

  const s = cMax === 0 ? 0 : delta / cMax;
  const v = cMax;

  return { h, s, v };
}
