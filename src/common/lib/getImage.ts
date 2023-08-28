import { Deferred } from 'xr-core';

export function getImage(src: string): Deferred<HTMLImageElement> {
  const defer = new Deferred<HTMLImageElement>();

  const img = document.createElement('img');

  img.onload = () => defer.resolve(img);
  img.onerror = defer.reject;

  img.src = src;
  img.crossOrigin = 'anonymous';

  return defer;
}
