import { createScene, Deferred, IXRRuntimeSceneItem } from 'xr-core';
import { getInternalRandomString } from '../../common/lib/getInternalRandomString';
import { BaseViewModel } from './BaseViewModel';
import { XRProjectModel } from './XRProjectModel';
import {
  IFlowHost,
  FlowNodeSerializer,
  FlowEdgeSerializer,
  IFlowNode,
  createFlowEdge,
  IFlowNodeClassNames,
  FlowNodeTypeRegistry,
  Util,
  IDefaultFlowNode,
} from 'ah-flow-node';
import { BRCUtil, dataUrl2Blob, Vector3 as BjsVector3 } from 'xr-impl-bjs/dist/bjs';
import { AbstractMesh, Camera, PointerEventTypes, PointerInfo, Vector3 } from 'xr-impl-bjs/dist/bjs';
import { CameraModule } from './Scene/CameraModule';
import { GetEventBusDelegateMeta } from '../TypeUtil';
import { WorldModule } from './Scene/WorldModule';
import { FSUtil, MemoryFS } from 'ah-memory-fs';
import Path from 'path';
import { GizmoModule } from './Scene/GizmoModule';
import { Logger } from 'ah-logger';
import _ from 'lodash';
import { IXREditorSceneConfig } from '../IXREditorConfig';
import { BizFlowNodeUtil, SceneConfigHelper } from '../lib';
import { isEdittimeNode } from '../IFlowNodeEdittimeData';
import { ModelDesignModel } from './Scene/ModelDesignModel';
import { collectFileFromDragEvent } from '../../common/lib/collectFileFromDragEvent';

export type ISceneGizmoState = {
  gizmoVisible?: boolean; // 所有 gizmo
  gizmoVisible_transformGizmo?: boolean; // 变换
  gizmoVisible_meshHighlight?: boolean; // 网格高亮
  gizmoVisible_lightIndicator?: boolean; // 灯光指示器
  gizmoVisible_lightFrustum?: boolean; // 灯光锥体
  gizmoVisible_cameraIndicator?: boolean; // 相机指示器
  gizmoVisible_ground?: boolean; // 地面
  gizmoVisible_cursor?: boolean; // 游标
  gizmoVisible_relationLine?: boolean; // 关系线
  gizmoVisible_volume?: boolean; // 实体体积
  gizmoVisible_locationIndicator?: boolean; // 其他位置指示器
};

export type IFileDropInfo = {
  mfs: MemoryFS;
  statsList: { path: string; stats: any }[];
};

export class SceneModel extends BaseViewModel<
  {
    afterMetaChange: {};
    afterActiveCameraChange: null;
    afterActiveFlowHocGroupIDChange: {};
    afterPickedMeshInfoChange: {};
    afterGizmoStateChange: { changed: Partial<ISceneGizmoState> };
    afterFileDrop: IFileDropInfo;
  } & GetEventBusDelegateMeta<IFlowHost['event'], 'host:'> &
    GetEventBusDelegateMeta<CameraModule['event'], 'camera:'> &
    GetEventBusDelegateMeta<WorldModule['event'], 'world:'> &
    GetEventBusDelegateMeta<GizmoModule['event'], 'gizmo:'> &
    GetEventBusDelegateMeta<ModelDesignModel['event'], 'modelDesign:'> &
    GetEventBusDelegateMeta<SceneConfigHelper['event'], 'sceneConfigHelper:'>
> {
  private _title?: string | undefined;
  private _poster?: string | undefined;

  ID!: string;

  /** @private */
  _scene?: IFlowHost;

  edittimeCamera?: CameraModule;
  world?: WorldModule;
  gizmo?: GizmoModule;
  modelDesign?: ModelDesignModel;

  store!: { rt: IXRRuntimeSceneItem; ed: IXREditorSceneConfig };

  /** 被点选的网格 */
  pickedMeshInfo?: { mesh: AbstractMesh; flowNodeID?: string };

  /** @deprecated 当前激活的 flow node group ID */
  activeFlowHocGroupID?: string;

  /** 叠加层状态 */
  gizmoState: ISceneGizmoState = {
    gizmoVisible: true,
    gizmoVisible_meshHighlight: true,
    gizmoVisible_transformGizmo: true,
    gizmoVisible_lightIndicator: true,
    gizmoVisible_lightFrustum: true,
    gizmoVisible_cameraIndicator: true,
    gizmoVisible_ground: true,
    gizmoVisible_cursor: true,
    gizmoVisible_relationLine: true,
    gizmoVisible_volume: true,
    gizmoVisible_locationIndicator: true,
  };

  // 一些工具类
  readonly sceneConfigHelper = new SceneConfigHelper(this);

  private _isActive: boolean = false;
  private logger!: Logger;

  constructor(
    readonly project: XRProjectModel,
    store?: { rt: IXRRuntimeSceneItem; ed: IXREditorSceneConfig }
  ) {
    super();

    this.project.scenes.push(this);
    this.event.delegate(this.project.event.delegateReceiver('scene:'));

    // 初始化 store
    this.store = store || {
      rt: {
        ID: getInternalRandomString(), // 设一个随机的
        flowNodes: [],
        flowEdges: [],
        flowComponents: [],
      },
      ed: {},
    };

    // 恢复元信息
    this.ID = this.store.rt.ID;
    this.title = this.store.rt.title;
    this.poster = this.store.rt.poster;

    this.logger = this.project.logger.extend(this.title || this.ID);
  }

  get title(): string | undefined {
    return this._title;
  }
  set title(value: string | undefined) {
    if (value === this._title) return;
    this._title = value;
    this.event.emit('afterMetaChange', {});
  }
  get poster(): string | undefined {
    return this._poster;
  }
  set poster(value: string | undefined) {
    if (value === this._poster) return;
    this._poster = value;
    this.event.emit('afterMetaChange', {});
  }

  active() {
    if (this._isActive) return;

    if (this.project.scenes.some(s => s.isActive && s.ID !== this.ID)) {
      throw new Error('只能激活一个场景');
    }

    this.logger.info('active');

    this._scene = createScene(this.project.engine);
    this._scene._edittime = { sceneModel: this }; // 编辑态注入 model 属性
    this._scene.ID = this.store.rt.ID;
    this._scene.componentDefs = [];
    this._scene.logger = this.logger.extend('host');

    this._scene.onActiveCameraChanged.add(() => {
      this.event.emit('afterActiveCameraChange', null);
    });

    this._scene.event.delegate(this.event.delegateReceiver('host:'));

    this._scene.onPointerObservable.add(this._handleScenePointerEvent);

    // 恢复 edittime 配置
    this.edittimeCamera = new CameraModule(this, this._scene);

    if (this.store.ed.edittimeTargetCamera) {
      this.edittimeCamera.alpha = this.store.ed.edittimeTargetCamera.alpha;
      this.edittimeCamera.beta = this.store.ed.edittimeTargetCamera.beta;
      this.edittimeCamera.radius = this.store.ed.edittimeTargetCamera.radius;
      this.edittimeCamera.target = Vector3.FromArray(this.store.ed.edittimeTargetCamera.target);
    }

    // 恢复 gizmo state
    if (this.store.ed.gizState) this.setGizmoState(this.store.ed.gizState);

    this.world = new WorldModule(this, this._scene);

    if (this.store.ed.cursor) {
      this.world.cursorEnabled = this.store.ed.cursor.enabled;
      this.world.cursorPosition = this.store.ed.cursor.position
        ? {
            x: this.store.ed.cursor.position[0],
            y: this.store.ed.cursor.position[1],
            z: this.store.ed.cursor.position[2],
          }
        : { x: 0, y: 0, z: 0 };
    }

    this.gizmo = new GizmoModule(this, this._scene);
    if (this.store.ed.gizmo) this.gizmo.restore(this.store.ed.gizmo);

    this.modelDesign = new ModelDesignModel(this);
    this.modelDesign.restore(this.store.ed.modelDesign);

    // 恢复 flow nodes
    this._scene.componentDefs = this.store.rt.flowComponents;
    for (const desc of this.store.rt.flowNodes) {
      FlowNodeSerializer.restore(this._scene, desc);
    }
    for (const desc of this.store.rt.flowEdges) {
      FlowEdgeSerializer.restore(this._scene, desc);
    }

    // 这个在恢复 flow nodes 之后执行
    if (this.store.ed.activeFlowHocGroupID) this.setActiveFlowHocGroupID(this.store.ed.activeFlowHocGroupID);

    // 切换相机
    BRCUtil.switchActiveCamera(this.edittimeCamera._camera);

    // 工具类
    this.sceneConfigHelper.bind();

    this._isActive = true;
  }

  get rootFlowHost() {
    return this._scene;
  }

  get activeCamera() {
    return this._scene?.activeCamera;
  }

  get isActive() {
    return this._isActive;
  }

  /** @deprecated use this.rootFlowHost */
  get activeFlowHost() {
    return this.rootFlowHost;
  }

  setPickedMeshInfo(mesh: AbstractMesh, flowNodeID?: string) {
    this.pickedMeshInfo = { mesh, flowNodeID };

    // 网格高亮
    if (this.gizmo) this.gizmo.resetHighlightMesh([mesh]);

    this.event.emit('afterPickedMeshInfoChange', {});
  }

  private _handleScenePointerEvent = (ev: PointerInfo) => {
    if (ev.type === PointerEventTypes.POINTERPICK && ev.pickInfo) {
      if (ev.pickInfo.pickedMesh) this.setPickedMeshInfo(ev.pickInfo.pickedMesh, ev.pickInfo.pickedMesh.__flowNodeID);

      // 游标点选
      if (ev.event.ctrlKey || ev.event.metaKey) {
        if (this.world && ev.pickInfo.pickedPoint) this.world.cursorPosition = ev.pickInfo.pickedPoint;
      }
    }
  };

  setActiveFlowHocGroupID(hID: string | undefined) {
    if (this.activeFlowHocGroupID === hID) return;
    this.activeFlowHocGroupID = hID;
    this.event.emit('afterActiveFlowHocGroupIDChange', {});
  }

  getCameraByName(name: string) {
    return this._scene?.getCameraByName(name);
  }

  switchActiveCamera(camera: Camera) {
    BRCUtil.switchActiveCamera(camera);
  }

  /** @deprecated */
  hierarchyFindNode(ID: string) {
    return this.rootFlowHost ? this.rootFlowHost.flowNodeManager.get(ID) : undefined;
  }

  addFlowNode<T extends IFlowNodeClassNames>(
    className: T,
    initName?: string,
    initInputs?: IFlowNode<T>['input'],
    initEnabled?: boolean,
    ID = getInternalRandomString(),
    targetHost = this.activeFlowHost
  ) {
    if (!targetHost) throw new Error('scene is not active');

    const factory = FlowNodeTypeRegistry.Default.factory(className);
    const node = factory(targetHost, ID, initName, initInputs, initEnabled) as IFlowNode<T>;
    return node;
  }

  removeFlowNode(ID: string, targetHost = this.activeFlowHost) {
    if (!targetHost) throw new Error('scene is not active');

    const node = targetHost.flowNodeManager.get(ID);
    if (!node) return;

    node.dispose();
  }

  addFlowEdge(from: { readonly node: any; readonly ioKey: any }, to: { readonly node: any; readonly ioKey: any }) {
    const edge = createFlowEdge<any, any, any, any>(this.rootFlowHost!, from, to, getInternalRandomString());
    return edge;
  }

  removeFlowEdge(ID: string, targetHost = this.activeFlowHost) {
    if (!targetHost) throw new Error('scene is not active');

    const toRemoveEdge = targetHost.flowEdgeManager.get(ID);
    if (!toRemoveEdge) return;

    toRemoveEdge.dispose();
  }

  /** 为指定的 flow node 应用模板, 返回新添加的 flow node */
  applyFlowNodeTpl(ID: string, tpl: 'ModelMovieClip'): IDefaultFlowNode[] {
    if (!this.rootFlowHost) throw new Error('scene is not active');

    const node = this.rootFlowHost.flowNodeManager.get(ID);
    if (!node) return [];

    if (Util.isFlowNode('AssetContainerNode', node)) {
      if (tpl === 'ModelMovieClip') {
        BizFlowNodeUtil.applyModelMovieClip(node);
        return [];
      }
    }

    return [];
  }

  /** 返回 dataURL */
  takeSnapshot = Deferred.wrapAsyncFn(async () => {
    if (!this.rootFlowHost) throw new Error('scene is not active');

    return this.rootFlowHost.capture({ type: 'image/png' });
  });

  takeSnapshotAndSave = Deferred.wrapAsyncFn<[{ filepath?: string }], string>(async (ctx, opt = {}) => {
    const dataURL = await this.takeSnapshot().ret;
    const blob = dataUrl2Blob(dataURL);

    let filepath = opt.filepath || `snapshots/${getInternalRandomString()}.png`;
    filepath = 'file://' + MemoryFS.normalizePath(filepath);

    await FSUtil.ensureDir(this.project.mfs, Path.dirname(filepath));
    await this.project.mfs.writeFile(filepath, await blob.arrayBuffer());

    return filepath;
  });

  /** 截图 */
  async takeSnapshotExtra(opt: { hideGizmo?: boolean } = {}) {
    let _lastGizmoVisible: boolean | undefined;

    // 先关闭叠加层
    if (opt.hideGizmo) {
      _lastGizmoVisible = !!this.gizmoState.gizmoVisible;
      this.setGizmoState({ gizmoVisible: false });
    }

    // 截图
    const dataURL = await this.takeSnapshot().ret;
    const imgBlob = dataUrl2Blob(dataURL);

    // 恢复叠加层
    if (opt.hideGizmo && _lastGizmoVisible !== undefined) {
      this.setGizmoState({ gizmoVisible: _lastGizmoVisible });
    }

    const previewURL = URL.createObjectURL(imgBlob);

    return { previewURL, imgBlob };
  }

  // 保存状态
  private _doStashOnlyActive() {
    if (!this.rootFlowHost || !this.edittimeCamera || !this.gizmo || !this.world || !this.modelDesign)
      throw new Error('scene is not active');

    this.store.rt = {
      ID: this.ID,
      title: this.title,
      poster: this.poster,
      flowNodes: this.rootFlowHost.flowNodeManager.all.map(node => FlowNodeSerializer.save(node)),
      flowEdges: this.rootFlowHost.flowEdgeManager.all.map(edge => FlowEdgeSerializer.save(edge)),
      flowComponents: this._scene?.componentDefs || [],
    };

    this.store.ed = {
      edittimeTargetCamera: {
        alpha: this.edittimeCamera.alpha,
        beta: this.edittimeCamera.beta,
        radius: this.edittimeCamera.radius,
        target: this.edittimeCamera.target.asArray(),
      },
      gizmo: this.gizmo.save(),
      cursor: {
        enabled: this.world.cursorEnabled,
        position: [this.world.cursorPosition.x, this.world.cursorPosition.y, this.world.cursorPosition.z],
      },
      activeFlowHocGroupID: this.activeFlowHocGroupID,
      gizState: this.gizmoState,
      modelDesign: this.modelDesign.save(),
    };
  }

  doStashIfNeeded() {
    if (this.isActive) this._doStashOnlyActive();
  }

  close() {
    if (!this._isActive) return;

    this.logger.info('close');

    this._doStashOnlyActive();

    this.edittimeCamera?.dispose();
    this.world?.dispose();
    this.gizmo?.dispose();
    this.modelDesign?.dispose();
    this._scene?.dispose();

    this.sceneConfigHelper.unbind();

    this.edittimeCamera = undefined;
    this.world = undefined;
    this.gizmo = undefined;
    this.modelDesign = undefined;

    this._scene = undefined;

    this._isActive = false;
  }

  setGizmoState(st: Partial<ISceneGizmoState>) {
    this.gizmoState = { ...this.gizmoState, ...st };

    // 重设网格高亮
    if (
      (typeof st.gizmoVisible !== 'undefined' || typeof st.gizmoVisible_meshHighlight !== 'undefined') &&
      this.gizmo &&
      this.pickedMeshInfo
    ) {
      this.gizmo.resetHighlightMesh([this.pickedMeshInfo.mesh]);
    }

    this.event.emit('afterGizmoStateChange', { changed: st });
  }

  /** 从文件系统中导入文件 */
  async processFileDrop(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault();
    ev.stopPropagation();

    const mfs = await collectFileFromDragEvent(ev.nativeEvent);
    const statsList = await mfs
      .glob('**/*')
      .then(ps => Promise.all(ps.map(async p => ({ path: p, stats: (await mfs.stats(p))! }))));

    this.event.emit('afterFileDrop', { mfs, statsList });
  }

  /** 添加一个模型 */
  addModel(url: string, name: string = '新模型') {
    const host = this.rootFlowHost;
    if (!host) throw new Error('scene is not active');

    const ID = getInternalRandomString();

    // 防止重名
    let _suffixNo = 1;
    let newName = name;

    while (host.flowNodeManager.all.some(n => n.name === newName)) {
      _suffixNo += 1;
      newName = `${name}_${_suffixNo}`;
    }

    const defer = new Deferred<string>();

    // 用 command 添加, 以便撤销
    this.project.command
      .execute('Scene_AddFlowNode', { className: 'AssetContainerNode', ID, inputValues: { url }, name: newName })
      .transferTo(defer, () => ID);

    // FIXME: 如果在 模型设计 工作区下，要应用一下
    if (this.project.workbench.wbConfig.key === 'ModelDesign') {
      defer.ret.then(() => {
        this.modelDesign?.processModel(ID);
      });
    }

    return defer;
  }

  /** 从 gltf 文件中导入模型 */
  async importGLTF(mfs: MemoryFS, path: string) {
    if (mfs !== this.project.mfs) {
      await FSUtil.copyTo(mfs, this.project.mfs);
    }
    if (!path.startsWith('file://')) path = 'file://' + path;

    return this.addModel(path, Path.basename(path)).ret;
  }

  /** 聚焦到选中的网格 */
  zoomOn(mode: 'picked' | 'world-center' = 'picked') {
    if (!this.rootFlowHost || !this.edittimeCamera) return;

    const pickedMeshInfo = this.pickedMeshInfo;

    if (mode === 'picked' && pickedMeshInfo) {
      this.edittimeCamera.zoomOn([pickedMeshInfo.mesh]);
    }
    //
    else if (mode === 'world-center') {
      this.edittimeCamera.target = BjsVector3.Zero();
    }
  }

  /** 将编辑态相机同步到预览 */
  syncEDCameraToPreview(opt: { allowControl?: boolean; allowMove?: boolean } = {}) {
    const host = this.rootFlowHost;
    if (!host) throw new Error('scene is not active');

    const edCamera = this.edittimeCamera;
    if (!edCamera) return;

    const previewCamera = host.flowNodeManager.lookup('默认轨道相机', 'ArcRotateCameraNode');
    if (!previewCamera) return;

    previewCamera.input.alpha = edCamera.alpha;
    previewCamera.input.beta = edCamera.beta;
    previewCamera.input.radius = edCamera.radius;
    previewCamera.input.target = { x: edCamera.target.x, y: edCamera.target.y, z: edCamera.target.z } as any;

    if (typeof opt.allowControl !== 'undefined') previewCamera.input.allowControl = opt.allowControl;
    if (typeof opt.allowMove !== 'undefined') previewCamera.input.allowMove = opt.allowMove;
  }

  dispose() {
    super.dispose();

    this.close();

    const idx = this.project.scenes.findIndex(s => s.ID === this.ID);
    if (idx >= 0) this.project.scenes.splice(idx, 1);
  }
}
