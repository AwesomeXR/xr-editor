import type { Basisu } from 'xr-wasmlib/dist/Basisu';
import { WorkerProxyMain } from '../WorkerProxy/WorkerProxyMain';

export class BasisuUtil extends WorkerProxyMain {
  static Instance = new BasisuUtil();

  constructor() {
    super([
      new (require('./basisu.worker').default as any)(),
      new (require('./basisu.worker').default as any)(),
      new (require('./basisu.worker').default as any)(),
      new (require('./basisu.worker').default as any)(),
    ]);
  }

  async pack2KTX2(imageData: Uint8Array, imgExt: string, opt?: Parameters<Basisu['pack2KTX2']>[2]) {
    return this.invoke<any, Uint8Array>('pack2KTX2', [imageData, imgExt, opt]);
  }
}
