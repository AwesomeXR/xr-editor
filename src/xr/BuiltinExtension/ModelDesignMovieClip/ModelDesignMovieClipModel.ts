import { IDefaultFlowNode, IFlowHost, IFlowNode, Util } from 'ah-flow-node';
import { PanelModel } from '../../ViewModel/Workbench/PanelModel';
import { IMovieClipConfig, IMovieClipTrackItem } from 'xr-core';
import { AnimationGroup } from 'xr-impl-bjs/dist/bjs';
import { ITreeData, ITreeModelEvt, TreeModel } from '../../../common/component/LightTree';
import _ from 'lodash';
import { IBizMenuItem, getInternalRandomString } from '../../../common';
import { buildCommand } from '../../BuildCommand';
import { MovieClipHelper } from '../../lib/MovieClipHelper';

export type IModelDesignMovieClipModelProps = {
  selectedIds?: string[];
  expendedIds?: string[];
  timelineScale?: number;
  timelineOffset?: number;
};
export type IModelDesignMovieClipModelState = {
  timelineScale: number;
  timelineOffset: number;
};
export type IModelDesignMovieClipModelEvent = {};

export type IOutlinePayload =
  | {
      type: 'GroupRoot';
      group: IMovieClipConfig['groups'][0];
    }
  | {
      type: 'TrackRoot';
      group: IMovieClipConfig['groups'][0];
      track: IMovieClipTrackItem;
    };

function _genPayload(d: IOutlinePayload): IOutlinePayload {
  return d;
}

export class ModelDesignMovieClipModel extends PanelModel<
  IModelDesignMovieClipModelProps,
  IModelDesignMovieClipModelState,
  IModelDesignMovieClipModelEvent
> {
  private _disposeList: (() => void)[] = [];

  outline = new TreeModel();
  movieClip = new MovieClipHelper();

  get clipNode() {
    return this.movieClip.clipNode;
  }

  get timerNode() {
    return this.movieClip.timerNode;
  }

  restore(props: IModelDesignMovieClipModelProps | undefined): void {
    this.updateState({
      timelineOffset: props?.timelineOffset || 0,
      timelineScale: props?.timelineScale || 1,
    });

    if (props?.selectedIds) this.outline.resetSelect(props.selectedIds);
    if (props?.expendedIds) this.outline.resetExpand(props.expendedIds);

    this._disposeList.push(
      // movieClip
      this.movieClip.event.listen('afterTrackChange', ev => {
        if (ev.add && ev.add.length) {
          const outlineIDs = ev.add.map(track => track.key);
          this.outline.resetSelect(outlineIDs);
          this.outline.navTo(outlineIDs[0]);
        }
      }),
      this.movieClip.event.listen('afterActiveKeysChange', ev => this.reloadOutline()),
      this.movieClip.event.listen('afterClipConfigChange', ev => this.reloadOutline()),
      // 监听 assetContainerNode 的 animators 变化
      this.project.event.listen('scene:host:node:output:change', ev => {
        if (Util.isFlowNode('AssetContainerNode', ev.source) && ev.key === 'animators') {
          this.reloadOutline();
        }
      }),
      // assetContainerNode 删除
      this.project.event.listen('scene:host:afterNodeRemove', ev => {
        if (Util.isFlowNode('AssetContainerNode', ev.node)) {
          this.cleanupErrorTrack();
        }
      }),
      // 大纲
      this.outline.event.listen('afterNodeAction', this._handleOutlineNodeAction),
      this.outline.event.listen('onNodeContextMenu', this._handleOutlineNodeContextMenu),
      this.outline.event.listen('onNodeContextMenuExecute', this._handleOutlineNodeContextMenuExecute),
      // invoke panel
      this.event.listen('invoke', ev => this._handleInvoke(ev.method, ev.arg)),
      // scene
      this.project.event.listen('afterActiveSceneChange', () => this.rebindMovieClip())
    );

    this.rebindMovieClip();
  }

  save(): IModelDesignMovieClipModelProps {
    this.outline._clearExpiredIds();

    return {
      selectedIds: this.outline.selectedIds,
      expendedIds: this.outline.expandedIds,
      timelineScale: this.state.timelineScale,
      timelineOffset: this.state.timelineOffset,
    };
  }

  private rebindMovieClip() {
    const _clipNode = this.scene?.rootFlowHost?.flowNodeManager.lookup('默认动画剪辑', 'MovieClipNode');

    if (_clipNode) {
      this.movieClip.bind(_clipNode);
      this.reloadOutline();
    }
  }

  private _handleOutlineNodeAction = (ev: ITreeModelEvt['afterNodeAction']) => {
    const payload = ev.node.data.payload as IOutlinePayload;

    if (ev.key === 'AddTrack' && this.clipNode) {
      this.outline.openContextMenu(
        ev.node.id,
        ev.source instanceof HTMLElement ? ev.source : undefined,
        calcTrackAddMenuItems(this.clipNode)
      );
    }
    if (ev.key === 'ToggleTrackActive' && payload.type === 'TrackRoot') {
      this.toggleTrackActive(payload.track.key);
    }
  };

  /** 面板方法调用 */
  private _handleInvoke(method: string, arg?: string) {
    if (method === 'ReloadOutline') this.reloadOutline();
    if (method === 'OutlineResetSelect') {
      const ids: string[] = arg ? JSON.parse(arg) : [];
      this.outline.resetSelect(ids);
    }
    if (method === 'AddTrack') {
      const { nodeID, aniName } = JSON.parse(arg || '{}');
      setTimeout(() => this.addTrack(nodeID, aniName), 0); // 延迟执行，避免 command 与 invoke 互相影响
    }
    if (method === 'RemoveTrack') {
      const trackKey = arg!;
      setTimeout(() => this.removeTrack(trackKey), 0); // 延迟执行，避免 command 与 invoke 互相影响
    }
    if (method === 'TogglePlay') {
      this.togglePlay();
    }
    if (method === 'RemoveGroup') {
      const groupKey = arg!;
      setTimeout(() => this.removeGroup(groupKey), 0); // 延迟执行，避免 command 与 invoke 互相影响
    }
    if (method === 'ToggleGroupActive') {
      const { groupKey, active } = JSON.parse(arg || '{}');
      this.movieClip.toggleGroupActive(groupKey, active);
    }
  }

  /** 大纲右键菜单响应 */
  private _handleOutlineNodeContextMenuExecute = (ev: ITreeModelEvt['onNodeContextMenuExecute']) => {
    this.project.command.execute(ev.cmd as any, ev.arg, { skipIfDisabled: true });
  };

  /** 大纲右键菜单写这里 */
  private _handleOutlineNodeContextMenu = (ev: ITreeModelEvt['onNodeContextMenu']) => {
    const { node, menuItems } = ev;

    // 公共菜单
    menuItems.push({
      title: '选中',
      icon: 'restrict_select_off',
      ...buildCommand('InvokePanel', { ID: this.ID, method: 'OutlineResetSelect', arg: JSON.stringify([node.id]) }),
    });

    const payload = node.data.payload as IOutlinePayload | undefined;
    if (!payload) return;

    if (payload.type === 'GroupRoot' && this.clipNode) {
      menuItems.push(
        {
          title: '移除分组',
          icon: 'trash',
          ...buildCommand('InvokePanel', { ID: this.ID, method: 'RemoveGroup', arg: payload.group.key }),
        },
        {
          title: '轨道',
          icon: 'anim_data',
          children: [
            {
              title: '启用',
              icon: 'layer_active',
              ...buildCommand('InvokePanel', {
                ID: this.ID,
                method: 'ToggleGroupActive',
                arg: JSON.stringify({ groupKey: payload.group.key, active: true }),
              }),
            },
            {
              title: '禁用',
              icon: 'layer_active',
              ...buildCommand('InvokePanel', {
                ID: this.ID,
                method: 'ToggleGroupActive',
                arg: JSON.stringify({ groupKey: payload.group.key, active: false }),
              }),
            },
          ],
        },

        {
          title: '添加轨道',
          icon: 'anim_data',
          children: calcTrackAddMenuItems(this.clipNode),
        }
      );
    }

    if (payload.type === 'TrackRoot') {
      menuItems.push({
        title: '移除轨道',
        icon: 'trash',
        ...buildCommand('InvokePanel', { ID: this.ID, method: 'RemoveTrack', arg: payload.track.key }),
      });
    }
  };

  /** @deprecated */
  get frame(): number {
    return this.movieClip.frame || 0;
  }

  /** @deprecated */
  setFrame(frame: number) {
    this.movieClip.setFrame(frame);
  }

  /** @deprecated */
  get range(): [number, number] {
    return this.movieClip.range || [0, 0];
  }

  /** @deprecated */
  setRange(range: [number, number]) {
    this.movieClip.setRange(range);
  }

  /** @deprecated */
  get activeKeys() {
    return this.clipNode?.input.activeKeys || [];
  }

  /** @deprecated */
  setActiveKeys(keys: string[]) {
    this.movieClip.setActiveKeys(keys);
  }

  /** @deprecated */
  get animators(): AnimationGroup[] {
    return this.movieClip.animators;
  }

  /** @deprecated */
  get clipConfig(): IMovieClipConfig {
    return this.movieClip.clipConfig;
  }

  /** @deprecated */
  setClipConfig(config: IMovieClipConfig, isStash?: boolean): void {
    this.movieClip.setClipConfig(config, isStash);
  }

  /** 计算大纲节点: 轨道 */
  private _calcOutline_Track(group: IMovieClipConfig['groups'][0], track: IMovieClipTrackItem): ITreeData {
    const host = this.scene?.rootFlowHost;
    if (!host) throw new Error('not found host');

    const _modelNode = host.flowNodeManager.get(track.animator.ID, 'AssetContainerNode');
    const isActive = this.activeKeys.includes(track.key);

    return {
      id: track.key,
      parentId: group.key,
      data: {
        content: `${_modelNode?.name || '-'} / ${track.animator.name}`,
        icon: 'anim_data',
        payload: _genPayload({ type: 'TrackRoot', track, group }),
        stableActions: [
          { key: 'ToggleTrackActive', title: '切换激活', icon: isActive ? 'checkbox_hlt' : 'checkbox_dehlt' },
        ],
      },
    };
  }

  reloadOutline(): void {
    const host = this.scene?.rootFlowHost;
    if (!host) return;

    const list: ITreeData[] = [];

    // 第一层: group
    this.clipConfig.groups.forEach(gItem => {
      list.push({
        id: gItem.key,
        data: {
          content: gItem.title,
          icon: 'collection_new',
          payload: _genPayload({ type: 'GroupRoot', group: gItem }),
          stableActions: [{ key: 'AddTrack', title: '添加轨道', icon: 'antd:PlusSquareOutlined' }],
        },
      });

      // 第二层: track
      gItem.tracks.forEach(track => list.push(this._calcOutline_Track(gItem, track)));
    });

    this.outline.reloadAll(list);
  }

  // 重新加载指定的 outline 节点
  reloadOutlineByID(id: string): void {
    const infoData = this.outline.getNodeInfo(id);
    if (!infoData) return;

    const payload = infoData.node.data.payload as IOutlinePayload | undefined;
    if (!payload) return;

    let newTreeData: ITreeData | undefined;

    // update texture
    if (payload.type === 'TrackRoot') {
      const { group, track } = payload;
      newTreeData = this._calcOutline_Track(group, track);
    }

    if (!newTreeData) return;

    this.outline.updateNode(newTreeData.id, newTreeData.data, newTreeData.parentId);
  }

  /** @deprecated */
  addTrack(modelNodeID: string, aniName: string): void {
    this.movieClip.addTrack(modelNodeID, aniName);
  }

  /** @deprecated */
  removeTrack(trackKey: string): void {
    this.movieClip.removeTrack(trackKey);
  }

  /** @deprecated */
  toggleTrackActive(trackKey: string): void {
    this.movieClip.toggleTrackActive(trackKey);
  }

  /** @deprecated */
  updateTrack(key: string, data: Partial<IMovieClipTrackItem>, isStash?: boolean) {
    this.movieClip.updateTrack(key, data, isStash);
  }

  /** @deprecated */
  get isPlaying(): boolean {
    return this.movieClip.isPlaying;
  }

  /** @deprecated */
  togglePlay(play?: boolean) {
    this.movieClip.togglePlay(play);
  }

  /** @deprecated */
  cleanupErrorTrack() {
    this.movieClip.cleanupErrorTrack();
  }

  /** @deprecated */
  addGroup(title = '新分组') {
    this.movieClip.addGroup(title);
  }

  /** @deprecated */
  removeGroup(groupKey: string) {
    this.movieClip.removeGroup(groupKey);
  }

  dispose(): void {
    super.dispose();
    this.movieClip.unbind();
    this._disposeList.forEach(dispose => dispose());
    this._disposeList = [];
  }
}

function calcTrackAddMenuItems(movieClip: IFlowNode<'MovieClipNode'>): IBizMenuItem[] {
  const animators: AnimationGroup[] = movieClip.input.animators || [];

  const hasFlowNodeAnis = animators.filter(ani => !!ani.__flowNodeID);
  const aniNodeGroup = _.groupBy(hasFlowNodeAnis, ani => ani.__flowNodeID);

  return _.compact(
    Object.entries(aniNodeGroup).map(([nodeID, anis]) => {
      const modelNode = movieClip.host.flowNodeManager.get(nodeID, 'AssetContainerNode');
      if (!modelNode) return;

      return {
        title: modelNode.name,
        icon: 'file_3D',
        children: anis.map(ani => ({
          title: ani.name,
          icon: 'anim_data',
          ...buildCommand('InvokePanel', {
            method: 'AddTrack',
            arg: JSON.stringify({ nodeID, aniName: ani.name }),
          }),
        })),
      };
    })
  );
}
