import { IPerfData, PerformanceManager } from 'xr-impl-bjs/dist/bjs';
import _ from 'lodash';
import { BaseViewModel } from './BaseViewModel';
import { XRProjectModel } from './XRProjectModel';

type IPrefCounterData = { lastSecAverage: number; total: number; count: number };

export type IProjPerfData = {
  gpuFrameTime: IPrefCounterData;
  shaderCompilationTime: IPrefCounterData;
};

export class ProjectPerfModel extends BaseViewModel<{
  afterPerfDataChange: {};
}> {
  private _timer: any;

  private _innerPerfMngHostID?: string;
  private _innerPerfMng?: PerformanceManager;

  perfData?: IPerfData;

  constructor(private project: XRProjectModel) {
    super();

    this.event.delegate(this.project.event.delegateReceiver('performance:'));
    this._timer = setInterval(this._refresh, 2000);
  }

  private _refresh = () => {
    const scene = this.project.activeScene;
    if (!scene || !scene.rootFlowHost) {
      if (this._innerPerfMng) {
        this._innerPerfMng.dispose();
        this._innerPerfMng = undefined;
        this._innerPerfMngHostID = undefined;
      }

      return;
    }

    if (this._innerPerfMng) {
      if (this._innerPerfMngHostID !== scene.rootFlowHost.ID) {
        this._innerPerfMng.dispose();

        this._innerPerfMngHostID = scene.rootFlowHost.ID;
        this._innerPerfMng = new PerformanceManager(scene.rootFlowHost);
      }
    } else {
      this._innerPerfMngHostID = scene.rootFlowHost.ID;
      this._innerPerfMng = new PerformanceManager(scene.rootFlowHost);
    }

    this.perfData = this._innerPerfMng.calc();
    this.event.emit('afterPerfDataChange', {});
  };

  dispose() {
    if (this._innerPerfMng) this._innerPerfMng.dispose();
    if (this._timer) clearInterval(this._timer);
  }
}
