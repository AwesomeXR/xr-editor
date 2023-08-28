import { CameraGizmo, Observer, UtilityLayerRenderer, AbstractMesh } from 'xr-impl-bjs/dist/bjs';
import { BaseViewModel } from '../BaseViewModel';
import { SceneModel } from '../SceneModel';
import { IXREditorSceneConfig_gizmo } from '../../IXREditorConfig';
import { IFlowHost } from 'ah-flow-node';

export class GizmoModule extends BaseViewModel<{
  afterCameraGizmoAdd: { name: string };
  afterCameraGizmoRemove: { name: string };
}> {
  private _cameraGizmo = new Map<string, CameraGizmo>();
  private _uLayer = new UtilityLayerRenderer(this.flowHost);

  private _onCameraRemovedObservable: Observer<any> | null = null;

  constructor(
    readonly scene: SceneModel,
    private flowHost: IFlowHost
  ) {
    super();
    this.event.delegate(this.scene.event.delegateReceiver('gizmo:'));

    this._onCameraRemovedObservable = this.flowHost.onCameraRemovedObservable.add(ev => {
      if (this.camera.has(ev.name)) this.camera.remove(ev.name);
    });
  }

  readonly camera = {
    add: (name: string) => {
      if (this._cameraGizmo.has(name)) throw new Error('gizmo already exist: ' + name);

      const cam = this.flowHost.getCameraByName(name);
      if (!cam) throw new Error('camera not found: ' + name);

      const giz = new CameraGizmo(this._uLayer);
      this._cameraGizmo.set(name, giz);
      giz.camera = cam;
      giz.material.alpha = 0.5;

      this.event.emit('afterCameraGizmoAdd', { name });
    },
    remove: (name: string) => {
      const giz = this._cameraGizmo.get(name);
      if (!giz) return;

      giz.dispose();
      this._cameraGizmo.delete(name);

      this.event.emit('afterCameraGizmoRemove', { name });
    },
    has: (name: string) => this._cameraGizmo.has(name),
  };

  resetHighlightMesh(meshes: AbstractMesh[]) {
    if (!this.scene._scene) return;

    const { gizmoVisible, gizmoVisible_meshHighlight } = this.scene.gizmoState;

    for (let i = 0; i < this.scene._scene.meshes.length; i++) {
      const mesh = this.scene._scene.meshes[i];
      mesh.showBoundingBox = !!(gizmoVisible && gizmoVisible_meshHighlight && meshes.includes(mesh));
    }
  }

  save(): IXREditorSceneConfig_gizmo {
    const data: IXREditorSceneConfig_gizmo = {
      camera: {},
    };

    return data;
  }

  restore(data: IXREditorSceneConfig_gizmo) {}

  dispose(): void {
    for (const giz of this._cameraGizmo.values()) {
      giz.dispose();
    }
    this._cameraGizmo.clear();
    this._uLayer.dispose();

    if (this._onCameraRemovedObservable) {
      this._onCameraRemovedObservable.unregisterOnNextCall = true;
    }
  }
}
