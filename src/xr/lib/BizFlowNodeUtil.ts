import {
  IComponentDef,
  IDefaultFlowEdge,
  IDefaultFlowNode,
  IFlowEdgeSerializerData,
  IFlowHost,
  IFlowNode,
  IFlowNodeClassNames,
  IFlowNodeSerializerData,
  Util,
} from 'ah-flow-node';
import { getInternalRandomString } from '../../common';
import { isEdittimeNode } from '../IFlowNodeEdittimeData';
import { AnimationGroup, AssetContainer } from 'xr-impl-bjs/dist/bjs';
import { IMovieClipConfig, Vector2 } from 'xr-core';

export const BizFlowNodeUtil = {
  ...Util,

  calcNodeCloneDataWitGroup(host: IFlowHost, nodes: IDefaultFlowNode[]) {
    // 考虑 group 嵌套结构，收集所有需要复制的节点
    const toCopyNodes: IDefaultFlowNode[] = [];

    const _walk = (node: IDefaultFlowNode) => {
      toCopyNodes.push(node as IDefaultFlowNode);
    };

    nodes.forEach(_walk);

    const data = Util.calcNodeCloneData(host, toCopyNodes);
    return data;
  },

  resetSerializerDataIDWithGroup(
    nodes: IFlowNodeSerializerData<IFlowNodeClassNames>[],
    edges: IFlowEdgeSerializerData<IFlowNodeClassNames, IFlowNodeClassNames>[]
  ) {
    const transformMap = Util.resetSerializerDataID(nodes, edges);

    // 考虑 group 结构，需要重设 group id
    for (const node of nodes) {
      if (!node.inputValues) continue;

      const oldGroupID = node.inputValues?._groupID;
      if (!oldGroupID) continue;

      const newGroupID = transformMap.get(oldGroupID);
      if (!newGroupID) continue;

      node.inputValues._groupID = newGroupID;
    }

    return transformMap;
  },

  /** 提取成组件 */
  bizExtractAsComponent(
    nodes: IDefaultFlowNode[],
    edges: IDefaultFlowEdge[],
    ID = getInternalRandomString(),
    name = '组件_' + ID
  ): IComponentDef {
    nodes = nodes.filter(n => {
      // 排除一些组件
      if (this.isFlowNode('SceneNode', n) || this.isFlowNode('HDRNode', n)) return false;
      return true;
    });

    return this.extractAsComponent(nodes, edges, ID, name);
  },

  // 从一个节点开始，收集所有的子节点
  collectVirtualChildrenNodes(node: IDefaultFlowNode) {
    const list: IDefaultFlowNode[] = [];

    const _walk = (_cur: IDefaultFlowNode) => {
      list.push(_cur);

      const _childrenList = _cur.host.flowNodeManager.all.filter(
        n => isEdittimeNode(n) && n.input.__edittimeData?.__parentID === _cur.ID
      );
      _childrenList.forEach(_walk);
    };

    _walk(node);

    // 从 list 中去掉传入的 node
    list.splice(list.indexOf(node), 1);

    return list;
  },

  setVirtualParentID(node: IDefaultFlowNode, parentID: string) {
    if (!isEdittimeNode(node)) throw new Error('Not a edittime node');
    if (!node.input.__edittimeData) node.input.__edittimeData = {};
    node.input.__edittimeData.__parentID = parentID;
  },

  applyModelMovieClip(modelNode: IFlowNode<'AssetContainerNode'>) {
    const host = modelNode.host;
    const scene = host._edittime.sceneModel;

    const animatorsFromModel: AnimationGroup[] = modelNode.output.animators || [];

    // 创建 timer 节点
    const timerNodeName = '默认回放';
    const timerNode =
      host.flowNodeManager.lookup(timerNodeName, 'FrameTimerNode') ||
      scene.addFlowNode('FrameTimerNode', timerNodeName, {
        loop: true,
        range: (Vector2 as any).FromArray([0, 1]),
        shouldContinue: true,
      });

    // 求动画范围
    const rangeMin = 0;
    const rangeMax = Math.max(
      ...animatorsFromModel.map(ani => ani.to),
      timerNode.input.range?.y || -Number.MAX_SAFE_INTEGER
    );

    timerNode.input.range = (Vector2 as any).FromArray([rangeMin, rangeMax]);

    // 创建动画剪辑节点
    const clipNodeName = '默认动画剪辑';
    const clipNode =
      host.flowNodeManager.lookup(clipNodeName, 'MovieClipNode') ||
      scene.addFlowNode('MovieClipNode', clipNodeName, {
        config: { groups: [] } as IMovieClipConfig,
      });

    // 给模型生成默认的动画剪辑 group, 并设置 active
    if (animatorsFromModel.length > 0) {
      let _config = clipNode.input.config as IMovieClipConfig;
      if (!_config) _config = { groups: [] };

      const tracks = animatorsFromModel.map(ag => ({
        key: getInternalRandomString(),
        title: ag.name,
        animator: { ID: modelNode.ID, name: ag.name },
        startTime: ag.from,
        duration: ag.to - ag.from,
      }));
      _config.groups.push({ key: getInternalRandomString(), title: modelNode.name, tracks });

      clipNode.input.config = { ..._config };

      // 设置 activeKeys
      const newActiveKeys = tracks.map(t => t.key);
      clipNode.input.activeKeys = clipNode.input.activeKeys
        ? clipNode.input.activeKeys.concat(newActiveKeys)
        : newActiveKeys;
    }

    // 创建已加载合并节点
    const runAndNodeName = '默认回放/已加载合并';
    const runAndNode =
      host.flowNodeManager.lookup(runAndNodeName, 'ArrayConcatNode') ||
      scene.addFlowNode('ArrayConcatNode', runAndNodeName);

    // 创建动画合并节点
    const mergeNodeName = clipNodeName + '/轨道合并';
    const mergeNode =
      host.flowNodeManager.lookup(mergeNodeName, 'ArrayConcatNode') ||
      scene.addFlowNode('ArrayConcatNode', mergeNodeName);

    // 合并节点 -> 剪辑节点
    if (!host.flowEdgeManager.get(mergeNode.ID, 'value', clipNode.ID, 'animators')) {
      scene.addFlowEdge({ node: mergeNode, ioKey: 'value' }, { node: clipNode, ioKey: 'animators' });
    }

    // timer -> 剪辑节点
    if (!host.flowEdgeManager.get(timerNode.ID, 'frame', clipNode.ID, 'frame')) {
      scene.addFlowEdge({ node: timerNode, ioKey: 'frame' }, { node: clipNode, ioKey: 'frame' });
    }

    // 已加载合并节点 -> 回放节点
    if (!host.flowEdgeManager.get(runAndNode.ID, 'value', timerNode.ID, 'runs')) {
      scene.addFlowEdge({ node: runAndNode, ioKey: 'value' }, { node: timerNode, ioKey: 'runs' });
    }

    // AssetContainerNode -> 动画合并节点
    const mergeNodeInputKey = `item_${mergeNode.input._argLength ? mergeNode.input._argLength - 1 : 0}`;
    if (!host.flowEdgeManager.get(modelNode.ID, 'animators', mergeNode.ID, mergeNodeInputKey)) {
      scene.addFlowEdge({ node: modelNode, ioKey: 'animators' }, { node: mergeNode, ioKey: mergeNodeInputKey });
      mergeNode.input._argLength = (mergeNode.input._argLength || 0) + 1;
    }

    // assetContainerNode -> 已加载合并节点
    const runAndNodeInputKey = `item_${runAndNode.input._argLength ? runAndNode.input._argLength - 1 : 0}`;
    if (!host.flowEdgeManager.get(modelNode.ID, 'loaded', runAndNode.ID, runAndNodeInputKey)) {
      scene.addFlowEdge({ node: modelNode, ioKey: 'loaded' }, { node: runAndNode, ioKey: runAndNodeInputKey });
      runAndNode.input._argLength = (runAndNode.input._argLength || 0) + 1;
    }
  },
};
