import { WorkerProxySlave } from '../WorkerProxy/WorkerProxySlave';
import { Basisu } from 'xr-wasmlib/dist/Basisu';

class BasisuSlave extends WorkerProxySlave {
  private _basisu?: Basisu;

  private async getBasisuIns() {
    if (!this._basisu) {
      this._basisu = await new Basisu().init();
    }
    return this._basisu!;
  }

  async __handle_pack2KTX2(imageData: Uint8Array, imgExt: string, opt?: Parameters<Basisu['pack2KTX2']>[2]) {
    const basisu = await this.getBasisuIns();
    const ktx2 = basisu.pack2KTX2(imageData, imgExt, opt);
    return ktx2;
  }
}

new BasisuSlave();
