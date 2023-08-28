import { getInternalRandomString } from 'xr-core';
import { AbstractMesh, ArcRotateCamera, Camera, Tools, Vector3 } from 'xr-impl-bjs/dist/bjs';
import { BaseViewModel } from '../BaseViewModel';
import { SceneModel } from '../SceneModel';
import { IFlowHost } from 'ah-flow-node';

export enum CameraModeEnum {
  PERSPECTIVE = 0,
  ORTHOGRAPHIC = 1,
}

export class CameraModule extends BaseViewModel<{
  afterCameraChange: {};
}> {
  _camera: ArcRotateCamera;

  constructor(
    readonly scene: SceneModel,
    private flowHost: IFlowHost
  ) {
    super();

    this.event.delegate(this.scene.event.delegateReceiver('camera:'));

    // 编辑器相机
    this._camera = new ArcRotateCamera(
      '编辑器相机_' + getInternalRandomString(true),
      Tools.ToRadians(45),
      Tools.ToRadians(60),
      20,
      Vector3.Zero(),
      this.flowHost
    );
    this._camera.useNaturalPinchZoom = true;
    this._camera.minZ = 0.1;
    this._camera.lowerRadiusLimit = 0.01;
    this._camera.inertia = 0;
    this._camera.panningInertia = 0;
    this._camera.mapPanning;
    this._camera.angularSensibilityX = this._camera.angularSensibilityY = 200;
    this._camera.wheelDeltaPercentage = 0.1;

    this._camera.zoomOnFactor = 1;

    const rob = this.flowHost.onBeforeRenderObservable.add(() => {
      this._camera.panningSensibility = Math.min(500, 1000 / this._camera.radius); // 相机平移动态灵敏度
      this.resetOrthoArgIfNeeded();
    });

    this._camera.onDisposeObservable.addOnce(() => {
      if (rob) rob.unregisterOnNextCall = true;
    });
  }

  private resetOrthoArgIfNeeded() {
    if (this._camera.mode === CameraModeEnum.ORTHOGRAPHIC) {
      const minZ = this._camera.minZ;
      const nearHalfH = minZ * Math.tan(this._camera.fov / 2);

      const aspect = this._camera.getEngine().getAspectRatio(this._camera);
      const nearHalfW = nearHalfH * aspect;

      // 求 radius 距离处的视平面尺寸
      const halfH = (nearHalfH / minZ) * this._camera.radius;
      const halfW = (nearHalfW / minZ) * this._camera.radius;

      this._camera.orthoLeft = -halfW;
      this._camera.orthoRight = halfW;
      this._camera.orthoTop = halfH;
      this._camera.orthoBottom = -halfH;
    }
  }

  get mode(): CameraModeEnum {
    return this._camera.mode;
  }

  set mode(m: CameraModeEnum) {
    if (this._camera.mode === m) return;

    this._camera.mode = m;
    this.resetOrthoArgIfNeeded();

    this.event.emit('afterCameraChange', {});
  }

  get name() {
    return this._camera.name;
  }

  get alpha(): number {
    return Tools.ToDegrees(this._camera.alpha);
  }

  set alpha(v: number) {
    this._camera.alpha = Tools.ToRadians(v);
    this.event.emit('afterCameraChange', {});
  }

  get beta(): number {
    return Tools.ToDegrees(this._camera.beta);
  }

  set beta(v: number) {
    this._camera.beta = Tools.ToRadians(v);
    this.event.emit('afterCameraChange', {});
  }

  get radius(): number {
    return this._camera.radius;
  }

  set radius(v: number) {
    this._camera.radius = v;
    this.event.emit('afterCameraChange', {});
  }

  get target(): Vector3 {
    return this._camera.target;
  }

  set target(v: Vector3) {
    this._camera.setTarget(v.clone(), true, undefined, true);
    this.event.emit('afterCameraChange', {});
  }

  zoomOn(target: AbstractMesh[]) {
    this._camera.zoomOn(target, true);
    this.event.emit('afterCameraChange', {});
  }

  dispose() {
    super.dispose();
    this._camera.dispose();
  }
}
