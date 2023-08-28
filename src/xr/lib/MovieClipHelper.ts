import { IFlowNode, Util } from 'ah-flow-node';
import { SceneModel, XRProjectModel } from '../ViewModel';
import { isEdittimeNode } from '../IFlowNodeEdittimeData';
import { AnimationGroup } from 'xr-impl-bjs/dist/bjs';
import { IMovieClipConfig, IMovieClipTrackItem } from 'xr-core';
import { getInternalRandomString } from '../../common';
import _ from 'lodash';
import { EventBus } from 'ah-event-bus';

export class MovieClipHelper {
  readonly event = new EventBus<{
    afterTrackChange: { add?: IMovieClipTrackItem[]; remove?: IMovieClipTrackItem[]; update?: IMovieClipTrackItem[] };
    afterActiveKeysChange: {};
    afterPlayStateChange: {};
    afterFrameChange: {};
    afterRangeChange: {};
    afterClipConfigChange: {};
    afterAnimatorsChange: {};
  }>();

  private _clipNode!: IFlowNode<'MovieClipNode'>;
  private _timerNode!: IFlowNode<'FrameTimerNode'>;
  private _disposeList: (() => void)[] = [];

  scene!: SceneModel;
  project!: XRProjectModel;

  bind(movieClipNode: IFlowNode<'MovieClipNode'>) {
    if (!isEdittimeNode(movieClipNode)) throw new Error('not edittime node: ' + movieClipNode.ID);

    this._clipNode = movieClipNode;
    this.scene = movieClipNode.host._edittime.sceneModel;
    this.project = this.scene.project;

    // 根据 edge 找到 timer node
    const edge = movieClipNode.host.flowEdgeManager.all.find(
      e =>
        Util.isFlowNode('FrameTimerNode', e.from.node) &&
        e.from.ioKey === 'frame' &&
        e.to.node.ID === movieClipNode.ID &&
        e.to.ioKey === 'frame'
    );
    if (!edge) throw new Error('not found edge: ' + movieClipNode.ID + ' ' + 'frame');
    this._timerNode = edge.from.node as any;

    // bind node event
    this._disposeList.push(
      // timer
      this._timerNode.event.listen('output:change:frame', () => this.event.emit('afterFrameChange', {})),
      this._timerNode.event.listen('input:change:run', () => this.event.emit('afterPlayStateChange', {})),
      this._timerNode.event.listen('input:change:range', () => this.event.emit('afterRangeChange', {})),
      // clip
      this._clipNode.event.listen('input:change:config', () => this.event.emit('afterClipConfigChange', {})),
      this._clipNode.event.listen('input:change:animators', () => this.event.emit('afterAnimatorsChange', {})),
      this._clipNode.event.listen('input:change:activeKeys', () => this.event.emit('afterActiveKeysChange', {}))
    );
  }

  unbind() {
    this.event.clear();
  }

  get clipNode() {
    return this._clipNode;
  }

  get timerNode() {
    return this._timerNode;
  }

  get frame(): number {
    return this._timerNode?.input.frame || 0;
  }

  setFrame(frame: number) {
    if (!this._timerNode) return;
    this._timerNode.setInput('frame', frame);
  }

  get range(): [number, number] {
    if (!this._timerNode) return [0, 0];
    return (this._timerNode.input.range?.asArray() as any) || [0, 0];
  }

  setRange(range: [number, number]) {
    if (!this._timerNode) return;

    // 用 command 来修改，以便撤销
    this.project.command.execute(
      'Scene_UpdateFlowNode',
      { IDs: [this._timerNode.ID], propPath: 'input.range', value: { x: range[0], y: range[1] } },
      { skipIfDisabled: true }
    );
  }

  /** 激活的轨道 key */
  get activeKeys() {
    return this._clipNode.input.activeKeys || [];
  }

  setActiveKeys(keys: string[]) {
    // 用 command 来修改，以便撤销
    this.project.command.execute(
      'Scene_UpdateFlowNode',
      { IDs: [this._clipNode.ID], propPath: 'input.activeKeys', value: keys },
      { skipIfDisabled: true }
    );
  }

  get animators(): AnimationGroup[] {
    return this._clipNode.input.animators || [];
  }

  get clipConfig(): IMovieClipConfig {
    return this._clipNode.input.config || {};
  }

  setClipConfig(config: IMovieClipConfig, isStash?: boolean): void {
    if (isStash) {
      this._clipNode.setInput('config', config);
      return;
    }

    // 用 command 来修改，以便撤销
    this.project.command.execute(
      'Scene_UpdateFlowNode',
      { IDs: [this._clipNode.ID], propPath: 'input.config', value: { ...config } },
      { skipIfDisabled: true }
    );
  }

  /** 添加轨道 */
  addTrack(modelNodeID: string, aniName: string): void {
    const ani = this.animators.find(v => v.name === aniName && v.__flowNodeID === modelNodeID);
    if (!ani) throw new Error('not found animator: ' + modelNodeID + ' ' + aniName);

    const config = _.cloneDeep(this.clipConfig);

    const group = config.groups![0];
    const track: IMovieClipTrackItem = {
      key: getInternalRandomString(),
      animator: { ID: modelNodeID, name: aniName },
      startTime: ani.from,
      duration: ani.to,
    };
    group.tracks.unshift(track);

    this.setClipConfig(config);
    this.setActiveKeys([...this.activeKeys, track.key]);

    this.event.emit('afterTrackChange', { add: [track] });
  }

  /** 移除轨道 */
  removeTrack(trackKey: string): void {
    const config = _.cloneDeep(this.clipConfig);

    const group = config.groups![0];
    const toRemoveTracks = group.tracks.filter(v => v.key === trackKey);
    group.tracks = group.tracks.filter(v => v.key !== trackKey);

    this.setClipConfig(config);
    this.setActiveKeys(this.activeKeys.filter(v => v !== trackKey));

    this.event.emit('afterTrackChange', { remove: toRemoveTracks });
  }

  // 切换轨道激活状态
  toggleTrackActive(trackKey: string): void {
    const activeKeys = this.activeKeys;
    const index = activeKeys.indexOf(trackKey);

    if (index >= 0) activeKeys.splice(index, 1);
    else activeKeys.push(trackKey);

    this.setActiveKeys(activeKeys);
  }

  // 切换轨道组激活状态
  toggleGroupActive(groupKey: string, active: boolean): void {
    const group = this.clipConfig.groups.find(v => v.key === groupKey);
    if (!group) return;

    const trackKeys = group.tracks.map(t => t.key);
    const activeKeys = active ? _.union(this.activeKeys, trackKeys) : _.difference(this.activeKeys, trackKeys);

    this.setActiveKeys(activeKeys);
  }

  // 获取轨道激活状态
  getGroupActiveState(groupKey: string): 'all' | 'none' | 'some' {
    const group = this.clipConfig.groups.find(v => v.key === groupKey);
    if (!group) return 'none';

    const trackKeys = group.tracks.map(t => t.key);
    const activeKeys = this.activeKeys;

    if (trackKeys.every(v => activeKeys.includes(v))) return 'all';
    if (trackKeys.some(v => activeKeys.includes(v))) return 'some';

    return 'none';
  }

  // 更新轨道
  updateTrack(key: string, data: Partial<IMovieClipTrackItem>, isStash?: boolean) {
    const config = this.clipConfig;
    const group = config.groups![0];

    const track = group.tracks.find(v => v.key === key);
    if (!track) return;

    Object.assign(track, data);

    this.setClipConfig(config, isStash);
    this.event.emit('afterTrackChange', { update: [track] });
  }

  get isPlaying(): boolean {
    return !!this._timerNode?.output.isRunning;
  }

  // 播放
  togglePlay(play?: boolean) {
    if (!this._timerNode) return;

    const nextPlay = play === undefined ? !this._timerNode.input.run : play;
    this._timerNode.setInput('run', nextPlay);
  }

  // 清理错误的轨道, 比如动画已经被删除了
  cleanupErrorTrack() {
    const scene = this.project.activeScene;
    if (!scene) return;

    const host = scene.rootFlowHost;
    if (!host) return;

    const config = _.cloneDeep(this.clipConfig);

    const group = config.groups![0];
    group.tracks = group.tracks.filter(track => {
      const hasModel = host.flowNodeManager.get(track.animator.ID);
      return hasModel;
    });

    this.setClipConfig(config);
  }

  addGroup(title = '新分组') {
    const config = _.cloneDeep(this.clipConfig);

    const group = { key: getInternalRandomString(), title, tracks: [] };
    if (!config.groups) config.groups = [];
    config.groups.unshift(group);

    this.setClipConfig(config);
  }

  removeGroup(groupKey: string) {
    const config = _.cloneDeep(this.clipConfig);

    config.groups = config.groups.filter(v => v.key !== groupKey);
    this.setClipConfig(config);
  }
}
