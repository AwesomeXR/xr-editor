import { EventBus } from 'ah-event-bus';
import { SceneModel } from '../ViewModel';
import { IFlowHost, IFlowNode } from 'ah-flow-node';
import { Color4 } from 'xr-core';

export type IBackgroundMode = 'color' | 'skybox';

export class SceneConfigHelper {
  readonly event = new EventBus<{ afterChange: {} }>();

  private _skyBoxNode!: IFlowNode<'SkyBoxNode'>;
  private _hdrNode!: IFlowNode<'HDRNode'>;
  private _sceneNode!: IFlowNode<'SceneNode'>;

  private _disposeList: (() => void)[] = [];

  constructor(readonly scene: SceneModel) {
    // delegate event
    this.event.delegate(this.scene.event.delegateReceiver('sceneConfigHelper:'));
  }

  get host() {
    if (!this.scene.rootFlowHost) throw new Error('SceneConfigHelper: scene.rootFlowHost is undefined');
    return this.scene.rootFlowHost;
  }

  bind() {
    // bind flow nodes
    this._skyBoxNode =
      (this.host.flowNodeManager.all.find(d => d._define.className === 'SkyBoxNode') as any) ||
      this.scene.addFlowNode('SkyBoxNode', '默认天空盒', undefined, false); // 初始化为不可见

    this._hdrNode =
      (this.host.flowNodeManager.all.find(d => d._define.className === 'HDRNode') as any) ||
      this.scene.addFlowNode('HDRNode', '默认HDR');

    this._sceneNode =
      (this.host.flowNodeManager.all.find(d => d._define.className === 'SceneNode') as any) ||
      this.scene.addFlowNode('SceneNode', '默认场景配置');

    this._disposeList.push(
      this._skyBoxNode.event.listen('props:change', () => this.event.emit('afterChange', {})),
      this._skyBoxNode.event.listen('input:change', () => this.event.emit('afterChange', {})),
      this._hdrNode.event.listen('input:change', () => this.event.emit('afterChange', {})),
      this._sceneNode.event.listen('input:change', () => this.event.emit('afterChange', {}))
    );
  }

  get project() {
    return this.scene.project;
  }

  get backgroundMode(): IBackgroundMode {
    return this._skyBoxNode.enabled ? 'skybox' : 'color';
  }

  setBackgroundMode(mode: IBackgroundMode) {
    this._skyBoxNode.enabled = mode === 'skybox';
  }

  get bgColor() {
    return this._sceneNode.input.clearColor?.toGammaSpace().asArray();
  }

  setBgColor(value: number[]) {
    this._sceneNode.input.clearColor = Color4.FromArray(value).toLinearSpace();
  }

  get skyBoxTexture() {
    return this._skyBoxNode.input.url;
  }

  setSkyBoxTexture(url: string) {
    this._skyBoxNode.input.url = url;
  }

  get skyBoxRotation() {
    return this._skyBoxNode.input.rotationY;
  }

  setSkyBoxRotation(value: number) {
    this._skyBoxNode.input.rotationY = value;
  }

  unbind() {
    this.event.clear();

    this._disposeList.forEach(d => d());
    this._disposeList = [];
  }
}
