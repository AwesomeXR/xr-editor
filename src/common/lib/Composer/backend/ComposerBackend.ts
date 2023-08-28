import { Deferred } from 'xr-core';
import { Frame } from '../Frame';

export type IComposeArg = {
  list: Frame[];
  fps: number;
  quality?: number;
  width?: number;
  height?: number;
};

export abstract class ComposerBackend {
  abstract compose(arg: IComposeArg): Deferred<Blob>;
}
