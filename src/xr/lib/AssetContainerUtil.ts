import { AssetContainer } from 'xr-impl-bjs/dist/bjs';
import { IFlowDTKey, IFlowNode, IFlowNodeOutput } from 'ah-flow-node';
import { isEdittimeNode } from '../IFlowNodeEdittimeData';
import { Vector2 } from 'xr-core';

export class AssetContainerUtil {
  bindingInfo: {
    animation: Record<
      string,
      {
        animator: IFlowNode<'AnimatorNode'>;
        frameTimer: IFlowNode<'FrameTimerNode'>;
        loadedBreaker: IFlowNode<'BreakerNode'>;
      }
    >;
  } = { animation: {} };

  constructor(readonly node: IFlowNode<'AssetContainerNode'>) {}

  private get host() {
    return this.node.host;
  }

  private get typedNode() {
    if (!isEdittimeNode(this.node)) throw new Error('Not a edittime node');
    return this.node;
  }

  private get sceneModel() {
    return this.host._edittime.sceneModel;
  }

  private get container(): AssetContainer {
    const _container = this.node.output.container;
    if (!_container) throw new Error('No container found');
    return _container;
  }

  prepare() {
    const _doPrepare = () => {
      this.prepareAnimationNode();
    };

    if (this.node.output.container) {
      _doPrepare();
    } else {
      const removeListen = this.node.event.listen('output:change:container', () => {
        removeListen();
        _doPrepare();
      });
    }
  }

  prepareAnimationNode() {
    // 导出所有动画
    const toInsertOutDefs: { key: string; def: IFlowNodeOutput<IFlowDTKey> }[] = [];
    for (const ag of this.container.animationGroups) {
      const outKey = `animationGroup/${ag.name}`;

      if (!(this.node._define.output as any)[outKey]) {
        toInsertOutDefs.push({
          key: outKey,
          def: { dataType: 'Animator', title: `动画/${ag.name}` },
        });
      }
    }

    if (toInsertOutDefs.length) {
      this.node.setInput('_outDefs', toInsertOutDefs.concat(this.node.input._outDefs || []));
    }

    this.bindingInfo.animation = {}; // 清空绑定信息, 重新生成

    // 遍历 _define.output 中的动画输出
    for (const [outKey, outDef] of Object.entries(this.node._define.output)) {
      if (outKey.startsWith('animationGroup/') && (outDef as any).dataType === 'Animator') {
        const agName = outKey.split('/')[1];

        const ag = this.container.animationGroups.find(ag => ag.name === agName);
        if (!ag) continue;

        // 创建绑定
        let animatorNode: IFlowNode<'AnimatorNode'> | undefined;
        let frameTimerNode: IFlowNode<'FrameTimerNode'> | undefined;
        let loadedBreakerNode: IFlowNode<'BreakerNode'> | undefined;

        // 绑定 animator
        const animatorNodeName = `${this.node.name}/动画/${outDef.title!}`;
        const existAnimatorNode = this.host.flowNodeManager.lookup(animatorNodeName, 'AnimatorNode');

        if (existAnimatorNode) animatorNode = existAnimatorNode;
        else {
          animatorNode = this.sceneModel.addFlowNode('AnimatorNode', animatorNodeName);
          // 创建连接
          this.sceneModel.addFlowEdge(
            { node: this.node, ioKey: outKey as any },
            { node: animatorNode, ioKey: 'animator' }
          );
        }
        // 设置虚拟父ID
        if (isEdittimeNode(animatorNode)) {
          if (!animatorNode.input.__edittimeData) animatorNode.input.__edittimeData = {};
          animatorNode.input.__edittimeData.__parentID = this.node.ID;
        }

        // 绑定 frameTimer
        const frameTimerNodeName = `${this.node.name}/回放/${outDef.title!}`;
        const existFrameTimerNode = this.host.flowNodeManager.lookup(frameTimerNodeName, 'FrameTimerNode');
        if (existFrameTimerNode) frameTimerNode = existFrameTimerNode;
        else {
          frameTimerNode = this.sceneModel.addFlowNode('FrameTimerNode', frameTimerNodeName, {
            range: (Vector2 as any).FromArray([ag.from, ag.to]),
            loop: true,
          });
          // 创建连接
          this.sceneModel.addFlowEdge({ node: frameTimerNode, ioKey: 'frame' }, { node: animatorNode, ioKey: 'frame' });
        }
        // 设置虚拟父ID
        if (isEdittimeNode(frameTimerNode)) {
          if (!frameTimerNode.input.__edittimeData) frameTimerNode.input.__edittimeData = {};
          frameTimerNode.input.__edittimeData.__parentID = this.node.ID;
        }

        // 绑定 breaker
        const breakerNodeName = `${this.node.name}/断路器/${outDef.title!}`;
        const existBreakerNode = this.host.flowNodeManager.lookup(breakerNodeName, 'BreakerNode');
        if (existBreakerNode) loadedBreakerNode = existBreakerNode;
        else {
          loadedBreakerNode = this.sceneModel.addFlowNode('BreakerNode', breakerNodeName, { connected: false });
          // 创建连接
          // loadedBreakerNode.output.data -> animatorNode.input.run
          this.sceneModel.addFlowEdge(
            { node: loadedBreakerNode, ioKey: 'data' },
            { node: frameTimerNode, ioKey: 'run' }
          );
          // this.node.output.loaded -> loadedBreakerNode.input.data
          this.sceneModel.addFlowEdge({ node: this.node, ioKey: 'loaded' }, { node: loadedBreakerNode, ioKey: 'data' });
        }
        // 设置虚拟父ID
        if (isEdittimeNode(loadedBreakerNode)) {
          if (!loadedBreakerNode.input.__edittimeData) loadedBreakerNode.input.__edittimeData = {};
          loadedBreakerNode.input.__edittimeData.__parentID = this.node.ID;
        }

        this.bindingInfo.animation[agName] = {
          animator: animatorNode,
          frameTimer: frameTimerNode,
          loadedBreaker: loadedBreakerNode,
        };
      }
    }
  }
}
