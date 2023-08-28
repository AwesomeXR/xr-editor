import {
  IFlowNodeSerializerData,
  IFlowNodeClassNames,
  IFlowEdgeSerializerData,
  FlowNodeSerializer,
  Util,
  FlowEdgeSerializer,
  IDefaultFlowNode,
  IDefaultFlowEdge,
} from 'ah-flow-node';
import { BaseViewModel } from './BaseViewModel';
import { XRProjectModel } from './XRProjectModel';
import { BizFlowNodeUtil } from '../lib';

export type IXRClipboardData = {
  type: 'FlowNode';
  nodes: IFlowNodeSerializerData<IFlowNodeClassNames>[];
  edges: IFlowEdgeSerializerData<IFlowNodeClassNames, IFlowNodeClassNames>[];
};

export type IPasteAssets = {
  flowNodes?: IDefaultFlowNode[];
  flowEdges?: IDefaultFlowEdge[];
};

export class ClipboardModel extends BaseViewModel<{
  afterPaste: IPasteAssets;
}> {
  static build(data: IXRClipboardData) {
    return JSON.stringify(data);
  }

  private _data: IXRClipboardData | null = null;
  private logger = this.project.logger.extend('clipboard');

  constructor(readonly project: XRProjectModel) {
    super();
  }

  get hasData() {
    return !!this._data;
  }

  copy(data: IXRClipboardData) {
    this._data = data;
  }

  paste() {
    if (!this._data) return;
    if (!this.project.activeScene) return;

    const data = this._data;
    const scene = this.project.activeScene;

    this.logger.info('paste %s', data.type);

    const assets: IPasteAssets = {};

    // 粘贴节点
    if (data.type === 'FlowNode' && scene.rootFlowHost) {
      const flowNodes: IDefaultFlowNode[] = [];
      const flowEdges: IDefaultFlowEdge[] = [];

      // 这里要重设节点 ID
      const _nData: IXRClipboardData = JSON.parse(JSON.stringify(data));
      BizFlowNodeUtil.resetSerializerDataIDWithGroup(_nData.nodes, _nData.edges);

      for (const node of _nData.nodes) {
        const _ins = FlowNodeSerializer.restore(scene.rootFlowHost, node);
        if (_ins) flowNodes.push(_ins as any);
      }

      for (const edge of _nData.edges) {
        const _ins = FlowEdgeSerializer.restore(scene.rootFlowHost, edge);
        if (_ins) flowEdges.push(_ins as any);
      }

      assets.flowNodes = flowNodes;
      assets.flowEdges = flowEdges;
    }

    this.event.emit('afterPaste', assets);
    return assets;
  }
}
