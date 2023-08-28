import { getImage } from '../getImage';

export class Frame {
  constructor(readonly dataURL: string) {}

  readonly timestamp = performance.now();

  toImage() {
    return getImage(this.dataURL);
  }
}
