import { PanelModel } from '../../ViewModel/Workbench/PanelModel';
import { Vector3 as BjsVector3 } from 'xr-impl-bjs/dist/bjs';
import { MovieClipHelper } from '../../lib';
import { ITreeData, ITreeModelEvt, TreeModel } from '../../../common/component/LightTree';
import { IMovieClipConfig, IMovieClipTrackItem } from 'xr-core';

export type ICanvasViewerModelProps = {};
export type ICanvasViewerModelState = { aniBar: {} };
export type ICanvasViewerModelEvent = {};

export class CanvasViewerModel extends PanelModel<
  ICanvasViewerModelProps,
  ICanvasViewerModelState,
  ICanvasViewerModelEvent
> {
  private _disposeList: Function[] = [];

  _state: ICanvasViewerModelState = { aniBar: {} };

  movieClip = new MovieClipHelper();
  aniBarOutline = new TreeModel();

  restore(props: ICanvasViewerModelProps): void {
    this._disposeList.push(
      this.event.listen('invoke', ev => this._handleInvoke(ev.method, ev.arg)),
      this.movieClip.event.listen('afterActiveKeysChange', () => this.reloadAniBarOutline()),
      this.movieClip.event.listen('afterClipConfigChange', () => this.reloadAniBarOutline()),
      this.aniBarOutline.event.listen('afterNodeAction', this._handleAniBarOutlineNodeAction),
      // scene
      this.project.event.listen('afterActiveSceneChange', () => this.rebindMovieClip())
    );

    this.rebindMovieClip();
  }

  save(): ICanvasViewerModelProps {
    this.aniBarOutline._clearExpiredIds();

    return {};
  }

  /** 面板方法调用 */
  private _handleInvoke(method: string, arg?: string) {}

  private _handleAniBarOutlineNodeAction = (ev: ITreeModelEvt['afterNodeAction']) => {
    const payload = ev.node.data.payload;

    if (ev.key === 'AniBar:ToggleGroupActive') {
      const _gas = this.movieClip.getGroupActiveState(payload.group.key);
      this.movieClip.toggleGroupActive(payload.group.key, _gas === 'all' ? false : true);
    }

    if (ev.key === 'AniBar:ToggleTrackActive') {
      this.movieClip.toggleTrackActive(payload.track.key);
    }
  };

  /** 计算大纲节点: 轨道 */
  private _calcAniBarOutline_Track(group: IMovieClipConfig['groups'][0], track: IMovieClipTrackItem): ITreeData {
    const host = this.scene?.rootFlowHost;
    if (!host) throw new Error('not found host');

    const _modelNode = host.flowNodeManager.get(track.animator.ID, 'AssetContainerNode');
    const isActive = this.movieClip.activeKeys.includes(track.key);

    return {
      id: track.key,
      parentId: group.key,
      data: {
        content: `${_modelNode?.name || '-'} / ${track.animator.name}`,
        icon: 'anim_data',
        payload: { type: 'TrackRoot', track, group },
        stableActions: [
          { key: 'AniBar:ToggleTrackActive', title: '切换激活', icon: isActive ? 'checkbox_hlt' : 'checkbox_dehlt' },
        ],
      },
    };
  }

  reloadAniBarOutline() {
    const host = this.scene?.rootFlowHost;
    if (!host) return;

    const list: ITreeData[] = [];

    // 第一层: group
    this.movieClip.clipConfig.groups.forEach(gItem => {
      const _gas = this.movieClip.getGroupActiveState(gItem.key);

      list.push({
        id: gItem.key,
        data: {
          content: gItem.title,
          icon: 'collection_new',
          payload: { type: 'GroupRoot', group: gItem },
          stableActions: [
            {
              key: 'AniBar:ToggleGroupActive',
              title: '切换激活',
              icon: _gas === 'all' ? 'checkbox_hlt' : 'checkbox_dehlt',
            },
          ],
        },
      });

      // 第二层: track
      gItem.tracks.forEach(track => list.push(this._calcAniBarOutline_Track(gItem, track)));
    });

    this.aniBarOutline.reloadAll(list);
  }

  rebindMovieClip() {
    const _clipNode = this.scene?.rootFlowHost?.flowNodeManager.lookup('默认动画剪辑', 'MovieClipNode');

    if (_clipNode) {
      this.movieClip.bind(_clipNode);
      this.reloadAniBarOutline();
    }
  }

  dispose(): void {
    super.dispose();

    this.movieClip.unbind();

    this._disposeList.forEach(fn => fn());
    this._disposeList.length = 0;
  }
}
