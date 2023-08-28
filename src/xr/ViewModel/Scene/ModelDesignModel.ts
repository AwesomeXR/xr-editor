import { IFileStat, MemoryFS } from 'ah-memory-fs';
import { ITreeData, ITreeModelEvt, ITreeNodeDataAction, TreeModel } from '../../../common/component/LightTree';
import { BaseViewModel } from '../BaseViewModel';
import { SceneModel } from '../SceneModel';
import { GetEventBusDelegateMeta, IDefaultFlowNode, IFlowDTKey, IFlowNode, Util } from 'ah-flow-node';
import { AbstractMesh, AnimationGroup, AssetContainer, BaseTexture, Material, Mesh, Node } from 'xr-impl-bjs/dist/bjs';
import { TextureHelper } from '../../lib';
import { buildCommand } from '../../BuildCommand';
import { isEdittimeNode } from '../../IFlowNodeEdittimeData';
import { IBizIconName } from '../../../common/component/BizIcon';
import _ from 'lodash';

export type IModelDesignModelProps = {
  selectedIds?: string[];
  expendedIds?: string[];
  fullscreen?: boolean;
};

export type IModelDesignModelState = {
  fullscreen?: boolean;
  showFileDropResult?: {
    mfs: MemoryFS;
    statsList: { path: string; stats: IFileStat }[];
  };
};

export type ITreeDataPayload = {
  flowNode?: IDefaultFlowNode;
  containerNode?: IFlowNode<'AssetContainerNode'>;
  node?: Node;
  material?: Material;
  texture?: BaseTexture;
  animationGroup?: AnimationGroup;

  isFlowNodeRoot?: boolean;
  isLightCollection?: boolean;
  isAnimationGroupCollection?: boolean;
};

function _genPayload(p: ITreeDataPayload): ITreeDataPayload {
  return p;
}

export class ModelDesignModel extends BaseViewModel<
  {
    afterStateChange: Partial<IModelDesignModelState>;
  } & GetEventBusDelegateMeta<TreeModel['event'], 'outline:'>
> {
  private _disposeList: Function[] = [];
  private _state: IModelDesignModelState = {};

  outline = new TreeModel();

  constructor(readonly scene: SceneModel) {
    super();
    this.outline.disableDropOverSelect = true;
  }

  get project() {
    return this.scene.project;
  }

  get state() {
    return this._state;
  }

  updateState(st: Partial<IModelDesignModelState>, opt: { silence?: boolean } = {}) {
    Object.assign(this._state, st);
    if (!opt.silence) this.event.emit('afterStateChange', st);
  }

  restore(props: IModelDesignModelProps | undefined): void {
    // delegate
    this._disposeList.push(
      this.outline.event.delegate(this.event.delegateReceiver('outline:')),
      this.event.delegate(this.scene.event.delegateReceiver('modelDesign:'))
    );

    // 先建立监听
    this._disposeList.push(
      this.scene.event.listen('host:node:output:change', ev => {
        if (Util.isFlowNode('AssetContainerNode', ev.source) && ev.key === 'container') {
          this.reloadOutline();
        }
      })
    );
    this._disposeList.push(
      this.scene.event.listen('host:afterNodeAdd', ev => this._handleHostNodeAdd(ev.node)),
      this.scene.event.listen('host:afterNodeRemove', ev => this._handleHostNodeRemove(ev.node))
    );

    this._disposeList.push(this.scene.event.listen('afterPickedMeshInfoChange', this._handlePickedMeshInfoChange));

    this._disposeList.push(this.outline.event.listen('afterAllChange', this._handleOutlineAllChange));
    this._disposeList.push(this.outline.event.listen('afterSelectChange', this._handleOutlineSelectChange));
    this._disposeList.push(this.outline.event.listen('afterNodeAction', this._handleOutlineNodeAction));
    this._disposeList.push(this.outline.event.listen('onNodeContextMenu', this._handleOutlineNodeContextMenu));
    this._disposeList.push(
      this.outline.event.listen('onNodeContextMenuExecute', this._handleOutlineNodeContextMenuExecute)
    );

    this.reloadOutline();

    if (props?.selectedIds) this.outline.resetSelect(props.selectedIds);
    if (props?.expendedIds) this.outline.resetExpand(props.expendedIds);
  }

  save(): IModelDesignModelProps {
    this.outline._clearExpiredIds();

    return {
      selectedIds: this.outline.selectedIds,
      expendedIds: this.outline.expandedIds,
      fullscreen: this.state.fullscreen,
    };
  }

  private _handleHostNodeAdd(node: IDefaultFlowNode) {
    this.reloadOutline();
  }

  private _handleHostNodeRemove(node: IDefaultFlowNode) {
    this.reloadOutline();
  }

  private _handleOutlineAllChange = () => {};

  private _handleOutlineSelectChange = (ev: ITreeModelEvt['afterSelectChange']) => {
    if (!this.scene) return;

    const activeItem = this.outline.activeId ? this.outline.getNodeInfo(this.outline.activeId) : undefined;

    if (activeItem) {
      const payload = activeItem.node.data.payload as ITreeDataPayload;

      if (payload) {
        if (payload.node) {
          // 高亮网格
          if (payload.node instanceof AbstractMesh && ev.source !== 'API') {
            const mesh = payload.node as AbstractMesh;
            this.scene.setPickedMeshInfo(mesh, mesh.__flowNodeID);
          }
        }

        if (payload.flowNode) {
          payload.flowNode.setInput('__edittimeData', { ...payload.flowNode.input.__edittimeData, selected: true });
        }
      }
    }
  };

  private _handlePickedMeshInfoChange = () => {
    if (!this.scene || !this.scene.pickedMeshInfo) return;

    const { mesh, flowNodeID } = this.scene.pickedMeshInfo;
    if (!flowNodeID) return;

    const outlineID = this.calcOutlineID('__AssetContainer', flowNodeID, 'Node', mesh.name);

    this.outline.resetSelect([outlineID]);
    this.outline.navTo(outlineID);
  };

  /** 响应大纲 action */
  private _handleOutlineNodeAction = (ev: ITreeModelEvt['afterNodeAction']) => {
    if (!this.scene) return;

    const payload = ev.node.data.payload as ITreeDataPayload;
    if (!payload) return;

    //模型visible
    if (ev.key === 'container' && payload.flowNode?.input && ev.node.data.stableActions) {
      payload.flowNode.input.visible = !payload.flowNode.input.visible;
      this.reloadOutlineById(ev.node.id);
    }

    // material 的指令
    if (payload!.containerNode && payload.node instanceof Mesh && payload.node.material && ev.key === 'material') {
      const outlineID = this.calcOutlineID(
        '__AssetContainer',
        payload!.containerNode.ID,
        'Material',
        payload.node.material.name
      );

      this.navTo(outlineID);
    }

    // animationGroup 的指令
    if (payload.animationGroup) {
      if (ev.key === 'play') payload.animationGroup.play(payload.animationGroup.loopAnimation);
      else if (ev.key === 'pause') payload.animationGroup.pause();
      else if (ev.key === 'stop') {
        payload.animationGroup.stop();
        payload.animationGroup.reset();
      }

      this.reloadOutlineById(ev.node.id);
    }
  };

  /** 大纲右键菜单写这里 */
  private _handleOutlineNodeContextMenu = (ev: ITreeModelEvt['onNodeContextMenu']) => {
    const { node, menuItems } = ev;

    // 公共菜单
    menuItems.push({
      title: '选中',
      icon: 'restrict_select_off',
      // ...buildCommand('InvokePanel', { ID: this.ID, method: 'OutlineResetSelect', arg: JSON.stringify([node.id]) }),
    });

    const payload = node.data.payload as ITreeDataPayload;
    if (!payload) return;

    // flowNode 节点
    if (payload.flowNode && payload.isFlowNodeRoot) {
      if (Util.isFlowNode('AssetContainerNode', payload.flowNode)) {
        // 删模型要特殊处理
        menuItems.push({
          title: '删除模型',
          icon: 'trash',
          ...buildCommand('Scene_RemoveFlowNode', { IDs: [payload.flowNode.ID], removeVirtualChildren: true }),
        });
      } else {
        menuItems.push({
          title: '删除节点',
          icon: 'trash',
          ...buildCommand('Scene_RemoveFlowNode', { IDs: [payload.flowNode.ID] }),
        });
      }
    }
  };

  /** 大纲右键菜单响应 */
  private _handleOutlineNodeContextMenuExecute = (ev: ITreeModelEvt['onNodeContextMenuExecute']) => {
    this.project.command.execute(ev.cmd as any, ev.arg, { skipIfDisabled: true });
  };

  processModel(ID: string) {
    const node = this.scene.rootFlowHost!.flowNodeManager.get(ID)!;

    const _doApply = () => {
      // 为新模型生成动画控制器
      const newNodes = [...this.scene.applyFlowNodeTpl(ID, 'ModelMovieClip')];

      // 给生成的节点打标 parentId
      newNodes.forEach(n => {
        if (isEdittimeNode(n)) {
          if (!n.input.__edittimeData) n.input.__edittimeData = {};
          n.input.__edittimeData.__parentID = ID;
        }
      });
    };

    if (node.output.container) {
      _doApply();
    } else {
      // 等待 container
      const _dispose = node.event.listen('output:change:container', ev => {
        _dispose();
        _doApply();
      });
    }
  }

  /** 获取纹理的预览图(从大纲里已有的预览图) */
  getOutlineTexturePreviewURL(nodeID: string, texName: string) {
    const outlineID = this.calcOutlineID('__AssetContainer', nodeID, 'Texture', texName);

    const rtInfo = this.outline.getNodeInfo(outlineID);
    if (!rtInfo) return;

    return rtInfo.node.data.stableActions?.find(s => s.key === 'preview')?.img;
  }

  calcOutlineID(...segs: string[]) {
    return segs.join('/');
  }

  private _calcTextureOutlineData(
    fNode: IDefaultFlowNode & IFlowNode<'AssetContainerNode'>,
    tex: BaseTexture
  ): ITreeData {
    const _stableActions: ITreeNodeDataAction[] = [];

    const data: ITreeData = {
      id: this.calcOutlineID('__AssetContainer', fNode.ID, 'Texture', tex.name),
      parentId: this.calcOutlineID('__AssetContainer', fNode.ID, 'Texture'),
      data: {
        icon: 'texture_data',
        content: tex.name,
        payload: _genPayload({ texture: tex, containerNode: fNode, flowNode: fNode }),
        stableActions: _stableActions,
      },
    };

    // FIXME: 副作用
    TextureHelper.GetTextureDataURLAsync(tex, 14, 14, 0, { R: true, G: true, B: true, A: true }, 0).then(url => {
      if (url) {
        this.outline.updateNode(
          data.id,
          { ...data.data, stableActions: [..._stableActions, { key: 'preview', icon: 'image_data', img: url }] },
          data.parentId
        );
      }
    });

    return data;
  }

  reloadOutline() {
    const host = this.scene?.rootFlowHost;
    if (!host) return;

    const list: ITreeData[] = [];

    // 灯光
    list.push({
      id: '__Light',
      data: {
        content: '灯光',
        icon: 'light_data',
        payload: _genPayload({ isLightCollection: true }),
      },
    });

    host.flowNodeManager.all.forEach(fNode => {
      if (Util.isFlowNode('DirectionalLightNode', fNode)) {
        list.push({
          id: this.calcOutlineID('__Light', fNode.ID),
          parentId: this.calcOutlineID('__Light'),
          data: {
            content: fNode.name,
            icon: 'light_sun',
            payload: _genPayload({ flowNode: fNode, isFlowNodeRoot: true }),
          },
        });
      }

      // AssetContainerNode
      if (Util.isFlowNode('AssetContainerNode', fNode)) {
        const _isLoaded = !!fNode.output.container;

        list.push({
          id: this.calcOutlineID('__AssetContainer', fNode.ID),
          data: {
            content: fNode.name,
            icon: 'file_3D',
            payload: _genPayload({ containerNode: fNode, flowNode: fNode, isFlowNodeRoot: true }),
            stableActions: _isLoaded ? [{ key: 'container', icon: 'hide_off' }] : undefined,
            subContent: _isLoaded ? undefined : '载入中...',
          },
        });

        if (fNode.enabled && fNode.output.container) {
          const container = fNode.output.container as AssetContainer;

          // 节点
          list.push({
            id: this.calcOutlineID('__AssetContainer', fNode.ID, 'Node'),
            parentId: this.calcOutlineID('__AssetContainer', fNode.ID),
            data: { content: '节点', icon: 'outliner_ob_group_instance' },
          });

          const _walkNode = (_cur: Node, _parent?: Node) => {
            let _icon: IBizIconName;
            const _nodeCls = _cur.getClassName();

            if (_nodeCls === 'Mesh') _icon = 'outliner_ob_mesh';
            else if (_nodeCls === 'TransformNode') _icon = 'outliner_ob_empty';
            else if (_nodeCls === 'Bone') _icon = 'bone_data';
            else _icon = 'outliner_ob_empty';

            const _stableActions: ITreeData['data']['stableActions'] = [];
            if (_cur instanceof AbstractMesh && _cur.material) {
              _stableActions.push({ key: 'material', icon: 'material_data' });
            }

            list.push({
              id: this.calcOutlineID('__AssetContainer', fNode.ID, 'Node', _cur.name),
              parentId: _parent
                ? this.calcOutlineID('__AssetContainer', fNode.ID, 'Node', _parent.name)
                : this.calcOutlineID('__AssetContainer', fNode.ID, 'Node'),
              data: {
                icon: _icon,
                content: _cur.name,
                payload: _genPayload({ node: _cur, containerNode: fNode, flowNode: fNode }),
                stableActions: _stableActions,
              },
            });

            // walk children
            _cur.getChildren(undefined, true).forEach(_child => _walkNode(_child, _cur));
          };

          const __root__Node = container.getNodes().find(n => n.name === '__root__');
          // 从 __root__ 开始显示
          if (__root__Node) __root__Node.getChildren(undefined, true).forEach(_cur => _walkNode(_cur));
          else container.rootNodes.forEach(_cur => _walkNode(_cur));

          // materials
          list.push({
            id: this.calcOutlineID('__AssetContainer', fNode.ID, 'Material'),
            parentId: this.calcOutlineID('__AssetContainer', fNode.ID),
            data: { content: '材质', icon: 'outliner_ob_group_instance' },
          });
          container.materials.forEach(m => {
            const _stableActions: ITreeData['data']['stableActions'] = [];
            if (m.getActiveTextures().length > 0) {
              _stableActions.push({ key: 'texture', icon: 'texture_data' });
            }

            list.push({
              id: this.calcOutlineID('__AssetContainer', fNode.ID, 'Material', m.name),
              parentId: this.calcOutlineID('__AssetContainer', fNode.ID, 'Material'),
              data: {
                icon: 'material_data',
                content: m.name,
                payload: _genPayload({ material: m, containerNode: fNode, flowNode: fNode }),
                stableActions: _stableActions,
              },
            });
          });

          // textures
          list.push({
            id: this.calcOutlineID('__AssetContainer', fNode.ID, 'Texture'),
            parentId: this.calcOutlineID('__AssetContainer', fNode.ID),
            data: { content: '纹理', icon: 'outliner_ob_group_instance' },
          });
          container.textures.forEach(tex => list.push(this._calcTextureOutlineData(fNode, tex)));
        }
      }
    });

    this.outline.reloadAll(list);
  }

  reloadOutlineById(id: string) {
    const infoData = this.outline.getNodeInfo(id);
    if (!infoData) return;

    const payload = infoData.node.data.payload as ITreeDataPayload;
    if (!payload) return;

    let newTreeData: ITreeData | undefined;
    //visible
    if (payload.containerNode && payload.isFlowNodeRoot) {
      const visibleIcon = infoData.node.data.stableActions?.find(s => s.key === 'container')!;
      visibleIcon.icon = payload.flowNode?.input.visible ? 'hide_off' : 'hide_on';
      newTreeData = infoData.node;
    }
    // update texture
    if (payload.containerNode && payload.texture) {
      newTreeData = this._calcTextureOutlineData(payload.containerNode as any, payload.texture);
    }

    if (!newTreeData) return;

    this.outline.updateNode(newTreeData.id, newTreeData.data, newTreeData.parentId);
  }

  navTo(outlineID: string) {
    this.outline.navTo(outlineID);
  }

  updateACNodeInputDefIfNeeded(
    node: IFlowNode<'AssetContainerNode'>,
    prop: string,
    title: string,
    dataType: IFlowDTKey,
    visible?: boolean
  ) {
    const existDefItem = node.input._inDefs?.find(d => d.key === prop);

    // 更新输入定义
    if (existDefItem) {
      existDefItem.def.title = title;
      existDefItem.def.dataType = dataType;
      existDefItem.def.hiddenInGraph = !visible;
      node.setInput('_inDefs', node.input._inDefs, { skipEqualCheck: true });
    } else {
      node.input._inDefs = [
        ...(node.input._inDefs || []),
        { key: prop, def: { title, dataType, hiddenInGraph: !visible } },
      ];
    }
  }

  bindTextureNode(node: IFlowNode<'AssetContainerNode'>, prop: string) {
    if (!this.scene || !this.scene.rootFlowHost) return;

    let texNode = this.getBindingTextureNode(node, prop);

    if (!texNode) {
      const newTexNode = this.scene.addFlowNode('TextureNode', undefined, {
        source: 'https://rshop.tech/gw/assets/upload/202307231637497.png',
      });
      this.scene.addFlowEdge({ node: newTexNode, ioKey: 'texture' }, { node, ioKey: prop as any });
    }
  }

  getBindingTextureNode(node: IFlowNode<'AssetContainerNode'>, prop: string): IFlowNode<'TextureNode'> | undefined {
    if (!this.scene || !this.scene.rootFlowHost) return;

    for (const edge of this.scene.rootFlowHost.flowEdgeManager.all) {
      if (
        Util.isFlowNode('TextureNode', edge.from.node) &&
        edge.from.ioKey === 'texture' &&
        edge.to.node.ID === node.ID &&
        edge.to.ioKey === prop
      ) {
        return edge.from.node;
      }
    }
  }

  dispose(): void {
    super.dispose();
    this._disposeList.forEach(d => d());
  }
}
