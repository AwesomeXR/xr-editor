import { IVector3Like, getInternalRandomString } from 'xr-core';
import {
  MeshBuilder,
  Vector3,
  Tools,
  Color3,
  Mesh,
  GridMaterial,
  UtilityLayerRenderer,
  TransformNode,
  PositionGizmo,
  RotationGizmo,
} from 'xr-impl-bjs/dist/bjs';
import { BaseViewModel } from '../BaseViewModel';
import { SceneModel } from '../SceneModel';
import { IFlowHost } from 'ah-flow-node';

export class WorldModule extends BaseViewModel<{
  afterGroundChange: null;
  afterCursorChange: {};
}> {
  private _cursorLayer = new UtilityLayerRenderer(this.flowHost);

  /** @private */
  _ground?: { plane: Mesh; planeMat: GridMaterial; lineX: Mesh; lineZ: Mesh };

  private _groundVisible: boolean = true;

  private _cursorRt = {
    gizNode: new TransformNode('cursor_' + this.scene.ID, this._cursorLayer.utilityLayerScene),
    posGiz: new PositionGizmo(this._cursorLayer, 1),
  };

  private _removeGizStateChangeListen: Function | undefined;

  constructor(
    readonly scene: SceneModel,
    private flowHost: IFlowHost
  ) {
    super();

    this.event.delegate(this.scene.event.delegateReceiver('world:'));

    // init ground
    //#region
    const gdPlaneMat = new GridMaterial('groundMaterial', this.flowHost);
    gdPlaneMat.majorUnitFrequency = 10;
    gdPlaneMat.minorUnitVisibility = 0.45;
    gdPlaneMat.gridRatio = 1;
    gdPlaneMat.backFaceCulling = false;
    gdPlaneMat.mainColor = new Color3(1, 1, 1);
    gdPlaneMat.lineColor = new Color3(1, 1, 1);
    gdPlaneMat.opacity = 0.98;
    gdPlaneMat.useMaxLine = true;

    const gdSize = 9999;

    const gdPlan = MeshBuilder.CreatePlane('ground', { size: gdSize }, this.flowHost);
    gdPlan.isPickable = false;
    gdPlan.rotation.x = Tools.ToRadians(90);
    gdPlan.material = gdPlaneMat;

    const lineX = MeshBuilder.CreateLines(
      'ground-line-x',
      {
        points: [new Vector3(-gdSize, 0, 0), new Vector3(gdSize, 0, 0)],
        colors: new Array(2).fill(Color3.Red()),
      },
      this.flowHost
    );
    lineX.isPickable = false;

    const lineZ = MeshBuilder.CreateLines(
      'ground-line-z',
      {
        points: [new Vector3(0, 0, -gdSize), new Vector3(0, 0, gdSize)],
        colors: new Array(2).fill(Color3.Blue()),
      },
      this.flowHost
    );
    lineZ.isPickable = false;

    this._ground = { plane: gdPlan, planeMat: gdPlaneMat, lineX, lineZ };
    //#endregion

    this.cursorEnabled = true;

    this._bindEventListen();
  }

  set cursorEnabled(enabled: boolean) {
    if (enabled === this.cursorEnabled) return;

    if (enabled) {
      this._cursorRt.posGiz.attachedNode = this._cursorRt.gizNode;
      this._cursorRt.posGiz.onDragEndObservable.add(() => this.event.emit('afterCursorChange', {}));
    }
    //
    else {
      this._cursorRt.posGiz.attachedNode = null;
      this._cursorRt.posGiz.onDragEndObservable.clear();
    }

    this.event.emit('afterCursorChange', {});
  }

  get cursorEnabled() {
    return !!(this._cursorRt.posGiz.attachedNode && this._cursorRt.posGiz.attachedNode);
  }

  set cursorPosition(pos: IVector3Like) {
    this._cursorRt.gizNode.position.set(pos.x, pos.y, pos.z);
    this.event.emit('afterCursorChange', {});
  }

  get cursorPosition(): IVector3Like {
    return this._cursorRt.gizNode.position.clone();
  }

  get cursorPositionAsArray(): number[] {
    return this._cursorRt.gizNode.position.asArray();
  }

  get groundVisible(): boolean {
    return this._groundVisible;
  }

  set groundVisible(visible: boolean) {
    if (visible === this.groundVisible) return;
    if (!this._ground) throw new Error('ground is not ready');

    this._ground.plane.setEnabled(visible);
    this._ground.lineX.setEnabled(visible);
    this._ground.lineZ.setEnabled(visible);

    this._groundVisible = visible;
    this.event.emit('afterGroundChange', null);
  }

  private _flushGizmoState() {
    const { gizmoVisible, gizmoVisible_ground, gizmoVisible_cursor } = this.scene.gizmoState;

    this._cursorLayer.shouldRender = !!(gizmoVisible && gizmoVisible_cursor);

    if (this._ground) {
      const groundVisible = !!(gizmoVisible && gizmoVisible_ground);
      this._ground.plane.isVisible = groundVisible;
      this._ground.lineX.isVisible = groundVisible;
      this._ground.lineZ.isVisible = groundVisible;
    }
  }

  private _bindEventListen() {
    this._removeGizStateChangeListen = this.scene.event.listen('afterGizmoStateChange', () => {
      this._flushGizmoState();
    });
    this._flushGizmoState();
  }

  dispose() {
    super.dispose();

    this._removeGizStateChangeListen?.();

    if (this._ground) {
      this._ground.plane.dispose(false, true);
      this._ground.lineX.dispose(false, true);
      this._ground = undefined;
    }
  }
}
