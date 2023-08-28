import { Edge, Graph, Node } from '@antv/x6';
import { IBizMenuItem } from '../../../common';
import { CommandSystem } from '../../ViewModel/CommandSystem';
import { MenuUtil } from '../../MenuUtil';
import { PanelModel } from '../../ViewModel/Workbench/PanelModel';
import ThemeToken from '../../../ThemeToken.json';
import { isEdittimeNode } from '../../IFlowNodeEdittimeData';
import { IDefaultFlowEdge, IDefaultFlowNode } from 'ah-flow-node';
import { FlowDataTypeStyle } from '../../FlowDataTypeStyle';
import { IPasteAssets } from '../../ViewModel/ClipboardModel';
import _ from 'lodash';
import { BizFlowNodeUtil } from '../../lib';
import './ShapeDefine';

export type IFlowEditorModelProps = {
  translate?: { tx: number; ty: number };
  scale?: { sx: number; sy: number };

  /** @deprecated */
  activeGroupID?: string;
  propertyPanelSize?: number;
};

export type IFlowEditorModelState = {
  translate?: { tx: number; ty: number };
  scale?: { sx: number; sy: number };
  contextMenuData?: { items: IBizMenuItem[]; cursor: { x: number; y: number } };

  propertyPanelSize: number;

  /** @deprecated */
  activeGroupID?: string;
};

const BoundaryToolData = {
  name: 'boundary',
  args: {
    padding: 6,
    attrs: { strokeWidth: 2, strokeDasharray: '5, 3', pointerEvent: 'none', stroke: ThemeToken.colorPrimary },
  },
};

export class FlowEditorModel extends PanelModel<
  IFlowEditorModelProps,
  IFlowEditorModelState,
  {
    afterFlowNodeSelectChange: {};
  }
> {
  private _disposeList: Function[] = [];

  _state: IFlowEditorModelState = { propertyPanelSize: 300 };

  mousePos?: { x: number; y: number };
  container: HTMLDivElement | null = null;
  graph?: Graph;

  private _isDisposing = false;

  restore(props: IFlowEditorModelProps): void {
    this.updateState({ ...props });
    this.updateMenuBar();

    const proj = this.workbench.project;

    this._disposeList.push(
      proj.event.listen('afterActiveSceneChange', () => this.resetGraph()),
      proj.event.listen('scene:afterActiveFlowHocGroupIDChange', () => this.resetGraph()),

      proj.event.listen('scene:host:afterNodeAdd', ({ node }) => this.handleFlowNodeAdd(node)),
      proj.event.listen('scene:host:afterNodeRemove', ({ node }) => this.handleFlowNodeRemove(node)),
      proj.event.listen('scene:host:afterEdgeAdd', ({ edge }) => this.handleFlowEdgeAdd(edge)),
      proj.event.listen('scene:host:afterEdgeRemove', ({ edge }) => this.handleFlowEdgeRemove(edge)),

      proj.event.listen('scene:host:node:define:change', ev => this.handleForceUpdateFlowNode(ev.source)),
      proj.event.listen('scene:host:node:props:change', ev => this.handleForceUpdateFlowNode(ev.source)),
      proj.event.listen('scene:host:node:input:change', ev => this.handleFlowNodeInputChange(ev)),
      proj.clipboard.event.listen('afterPaste', ev => this.handleAfterPaste(ev)),

      this.event.listen('invoke', ev => this.handleInvoke(ev.method, ev.arg))
    );
  }

  save(): IFlowEditorModelProps {
    return {
      scale: this.state.scale,
      translate: this.state.translate,
      activeGroupID: this.state.activeGroupID,
      propertyPanelSize: this.state.propertyPanelSize,
    };
  }

  get rootHost() {
    const scene = this.project.activeScene;
    if (!scene) return;
    return scene.rootFlowHost;
  }

  get selectedNodes() {
    const scene = this.workbench.project.activeScene;
    if (!scene || !scene.rootFlowHost) return [];

    const nodes = scene.rootFlowHost.flowNodeManager.all.filter(n => n.input.__edittimeData?.selected);
    return nodes;
  }

  get activeNode() {
    return this.selectedNodes[0];
  }

  private handleInvoke(method: string, arg?: string) {
    const scene = this.project.activeScene;

    if (method === 'refresh') this.resetGraph();

    if (method === 'copy') {
      const scene = this.project.activeScene;
      if (!scene || !this.selectedNodes || !scene.rootFlowHost) return;

      this.workbench.project.clipboard.copy({
        type: 'FlowNode',
        ...BizFlowNodeUtil.calcNodeCloneDataWitGroup(scene.rootFlowHost, this.selectedNodes),
      });
    }

    if (method === 'PopupFlowNodeAddContextMenu' && scene && this.mousePos) {
      this.updateState({
        contextMenuData: {
          cursor: this.mousePos,
          items: MenuUtil.flowNodeAddItem(scene, this.state.activeGroupID, scene.activeFlowHocGroupID),
        },
      });
    }

    if (method === 'NavToNode' && arg) {
      this.navToNode(arg);
    }
  }

  updateMenuBar() {
    const scene = this.workbench.project.activeScene;

    if (!scene) {
      this.menuBar = [];
      return;
    }

    const nodes = this.selectedNodes;

    this.menuBar = [
      {
        title: '视图',
        items: [{ title: '刷新', ...CommandSystem.build('InvokePanel', { ID: this.ID, method: 'refresh' }) }],
      },
      {
        title: '编辑',
        items: [
          { title: '粘贴', disabled: !this.workbench.project.clipboard.hasData, ...CommandSystem.build('Paste', {}) },
          ...(nodes && nodes.length > 0 ? MenuUtil.flowNodeItem(this.workbench.project, nodes) : []),
        ],
      },
      {
        title: '添加',
        items: scene ? MenuUtil.flowNodeAddItem(scene, this.state.activeGroupID, scene.activeFlowHocGroupID) : [],
      },
    ];
  }

  openNodeContextMenu() {
    if (!this.mousePos || !this.selectedNodes) return;

    this.updateState({
      contextMenuData: {
        cursor: this.mousePos,
        items: MenuUtil.flowNodeItem(this.workbench.project, this.selectedNodes),
      },
    });
  }

  openBlankContextMenu() {
    if (!this.mousePos || !this.selectedNodes || !this.scene) return;

    this.updateState({
      contextMenuData: {
        cursor: this.mousePos,
        items: [
          {
            title: '添加',
            children: MenuUtil.flowNodeAddItem(this.scene, this.state.activeGroupID, this.scene.activeFlowHocGroupID),
          },
          { title: '粘贴', disabled: !this.workbench.project.clipboard.hasData, ...CommandSystem.build('Paste', {}) },
        ],
      },
    });
  }

  launch(container: HTMLDivElement | null) {
    if (this.container) return; // 只设置一次

    this.container = container;
    this.resetGraph();
  }

  private resetGraph() {
    if (!this.container) throw new Error('missing container');

    this.logger.info('reset graph');

    if (this.graph) {
      this.graph.off(); // 先卸载监听器，避免 `edge:removed` 触发删除
      this.graph.dispose();
      this.graph = undefined;
    }

    const graph = new Graph({
      container: this.container,
      autoResize: true,
      grid: { size: 10, visible: true, args: { color: ThemeToken.colorTextQuaternary, thickness: 1 } },
      connecting: {
        allowNode: false,
        allowLoop: false,
        allowBlank: false,
        allowEdge: false,
        allowMulti: 'withPort',
        snap: { radius: 16 },
        createEdge(args) {
          return this.createEdge({ shape: 'FlowEdge' });
        },
      },
      highlighting: {
        // 连接桩可以被连接时在连接桩外围围渲染一个包围框
        magnetAvailable: {
          name: 'stroke',
          args: {
            attrs: { fill: '#fff', stroke: '#A4DEB1', strokeWidth: 4 },
          },
        },
        // 连接桩吸附连线时在连接桩外围围渲染一个包围框
        magnetAdsorbed: {
          name: 'stroke',
          args: {
            attrs: { fill: '#fff', stroke: '#31d0c6', strokeWidth: 4 },
          },
        },
      },
      panning: true,
      mousewheel: true,
      magnetThreshold: 8,
    });
    this.graph = graph;

    if (this.state.translate) graph.translate(this.state.translate.tx, this.state.translate.ty);
    if (this.state.scale) graph.scale(this.state.scale.sx, this.state.scale.sy);

    const proj = this.workbench.project;

    //#region node event
    graph
      .on('node:change:position', ev => {
        const node = this.rootHost?.flowNodeManager.get(ev.node.id);
        if (node && isEdittimeNode(node)) {
          const flowPos = ev.node.getPosition();
          node.input.__edittimeData = { ...node.input.__edittimeData, flowPos };
        }
      })
      // mousedown 就要触发选中
      .on('node:mousedown', ev => {
        const activeScene = proj.activeScene;
        if (!activeScene || !activeScene.rootFlowHost) return;

        const isMultiSelect = ev.e.metaKey || ev.e.ctrlKey;
        const node = activeScene.rootFlowHost.flowNodeManager.get(ev.node.id);

        // 多选
        if (isMultiSelect) {
          node.setInput('__edittimeData', {
            ...node.input.__edittimeData,
            selected: !node.input.__edittimeData?.selected,
          });
        }

        // 单选
        else {
          const nodes = activeScene.rootFlowHost.flowNodeManager.all;

          for (const node of nodes) {
            const _curSelected = node.input.__edittimeData?.selected;

            if (_curSelected && node.ID !== ev.node.id) {
              node.setInput('__edittimeData', { ...node.input.__edittimeData, selected: false });
            } else if (!_curSelected && node.ID === ev.node.id) {
              node.setInput('__edittimeData', { ...node.input.__edittimeData, selected: true });
            }
          }
        }

        this.reloadGraphTools();
        this.event.emit('afterFlowNodeSelectChange', {});
      })
      .on('blank:click', ev => {
        const activeScene = proj.activeScene;
        if (!activeScene || !activeScene.rootFlowHost) return;

        const nodes = activeScene.rootFlowHost.flowNodeManager.all;

        // 全部取消选中
        for (const node of nodes) {
          const _curSelected = node.input.__edittimeData?.selected;
          if (_curSelected) {
            node.setInput('__edittimeData', { ...node.input.__edittimeData, selected: false });
          }
        }

        this.event.emit('afterFlowNodeSelectChange', {});
        this.reloadGraphTools();
      });
    //#endregion

    //#region edge event
    graph
      .on('edge:mouseenter', ev => {
        ev.cell.addTools([
          { name: 'button-remove', args: { distance: 24 } },
          { name: 'button-remove', args: { distance: -24 } },
        ]);
      })
      .on('edge:mouseleave', ev => {
        ev.cell.removeTools();
      })
      .on('edge:connected', ev => {
        const activeScene = proj.activeScene;
        if (!activeScene) return;

        const fromNodeID = ev.edge.getSourceCellId();
        let fromIoKey = ev.edge.getSourcePortId();
        if (!fromIoKey) return;

        fromIoKey = fromIoKey.replace(/^output_/, '');

        const toNodeID = ev.edge.getTargetCellId();
        let toIoKey = ev.edge.getTargetPortId();
        if (!toIoKey) return;

        toIoKey = toIoKey.replace(/^input_/, '');

        const fromNode = activeScene.hierarchyFindNode(fromNodeID);
        if (!fromNode) return;

        const toNode = activeScene.hierarchyFindNode(toNodeID);
        if (!toNode) return;

        const edge = activeScene.addFlowEdge(
          { node: fromNode as any, ioKey: fromIoKey },
          { node: toNode as any, ioKey: toIoKey }
        );
        ev.edge.setData({ ID: edge.ID });
      })
      .on('edge:removed', ev => {
        if (this._isDisposing) return; // graph.dispose() 会触发 edge:removed。这个时候要避免走到下面导致 edge 被清空

        const activeScene = proj.activeScene;
        if (!activeScene || !ev.edge.data) return;

        activeScene.removeFlowEdge(ev.edge.data.ID);
      });
    //#endregion

    // ui
    graph
      .on('translate', () => this.updateState({ translate: graph.translate() }, { silence: true }))
      .on('scale', () => this.updateState({ scale: graph.scale() }, { silence: true }))
      .on('node:contextmenu', () => this.openNodeContextMenu())
      .on('blank:contextmenu', () => this.openBlankContextMenu());

    if (this.rootHost) {
      const nodes = this.rootHost.flowNodeManager.all;
      const edges = this.rootHost.flowEdgeManager.all;

      graph.addNodes(nodes.map(getAddNodeArg));
      graph.addEdges(edges.map(getAddEdgeArg));
    }

    // 设置选中高亮
    this.reloadGraphTools();
  }

  private handleFlowNodeAdd(node: IDefaultFlowNode) {
    if (this.graph && this.container && node.host === this.rootHost) {
      if (isEdittimeNode(node) && this.container && !node.input.__edittimeData) {
        // 开始移到画布中心

        const rect = this.container.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;

        const flowPos = this.graph.clientToLocal({ x, y });
        node.input.__edittimeData = { flowPos };
      }

      this.graph.addNode(getAddNodeArg(node));
    }
  }

  private reloadNodeGraphTool(node: IDefaultFlowNode) {
    if (!this.graph) return;

    const gNode = this.graph.getCellById(node.ID);
    if (!gNode) return; // 场景切换事件时序 or 分页会导致这里的 cell 取不到

    if (this.graph.isNode(gNode)) {
      const _hasTool = gNode.hasTool(BoundaryToolData.name);
      const _isSelected = node.input.__edittimeData?.selected;

      if (_isSelected && !_hasTool) gNode.addTools([BoundaryToolData]);
      else if (!_isSelected && _hasTool) gNode.removeTool(BoundaryToolData.name);
    }
  }

  private reloadGraphTools() {
    const activeScene = this.workbench.project.activeScene;
    if (!this.graph || !activeScene || !activeScene.rootFlowHost) return;

    const nodes = activeScene.rootFlowHost.flowNodeManager.all;

    // 设置高亮
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      this.reloadNodeGraphTool(node);
    }
  }

  private handleFlowNodeRemove(node: IDefaultFlowNode) {
    if (this.graph) {
      this.graph.removeNode(node.ID);
    }
  }

  private handleFlowEdgeAdd(edge: IDefaultFlowEdge) {
    if (!this.graph) return;

    const arg = getAddEdgeArg(edge);
    this.graph.addEdge(arg);
  }

  private handleFlowEdgeRemove(edge: IDefaultFlowEdge) {
    if (!this.graph) return;

    const _edge = this.graph.getEdges().find(d => d.data.ID === edge.ID);
    if (_edge) this.graph.removeEdge(_edge.id);
  }

  private handleForceUpdateFlowNode(flowNode: IDefaultFlowNode): void {
    const scene = this.workbench.project.activeScene;
    if (!this.graph || !scene) return;

    const cell = this.graph.getCellById(flowNode.ID);
    if (!cell) return; // 场景切换事件时序问题会导致这里的 cell 取不到

    const arg = getAddNodeArg(flowNode);

    // port 要单独处理
    const portArg = arg.ports as { items: { id: string }[] };
    delete arg.ports;

    // 先处理普通属性
    cell.prop(arg as any);

    // 再处理 ports
    if (this.graph.isNode(cell)) {
      const existPortIds = cell.getPorts().map(d => d.id!);
      const portArgIds = portArg.items.map(d => d.id);
      const toRemoveIds = _.difference(existPortIds, portArgIds);
      const toAddIds = _.difference(portArgIds, existPortIds);
      const toUpdateIds = _.intersection(existPortIds, portArgIds);

      toRemoveIds.forEach(id => cell.removePort(id));
      cell.addPorts(portArg.items.filter(d => toAddIds.includes(d.id)));

      toUpdateIds.forEach(id => cell.setPortProp(id, portArg.items.find(d => d.id === id)!));
    }
  }

  private handleAfterPaste(ev: IPasteAssets) {
    if (this.workbench.wbScope.ID !== this.ID) return; // 要确保只处理当前面板

    if (
      this.graph &&
      this.mousePos &&
      ev.flowNodes &&
      ev.flowNodes.length > 0 &&
      ev.flowNodes.every(node => isEdittimeNode(node) && node.input.__edittimeData?.flowPos)
    ) {
      // 把粘贴的节点移到鼠标位置
      let minX: number = 999999;
      let minY: number = 999999;

      // 先求左上角坐标
      for (const node of ev.flowNodes) {
        if (isEdittimeNode(node) && node.input.__edittimeData?.flowPos) {
          const x = node.input.__edittimeData.flowPos.x;
          const y = node.input.__edittimeData.flowPos.y;
          if (x < minX) minX = x;
          if (y < minY) minY = y;
        }
      }

      const firstFlowPos = this.graph.clientToLocal(this.mousePos);
      const deltaX = firstFlowPos.x - minX;
      const deltaY = firstFlowPos.y - minY;

      // 全部加上偏移量;
      for (const node of ev.flowNodes) {
        if (isEdittimeNode(node) && node.input.__edittimeData?.flowPos) {
          const x = node.input.__edittimeData.flowPos.x + deltaX;
          const y = node.input.__edittimeData.flowPos.y + deltaY;

          node.input.__edittimeData = { ...node.input.__edittimeData, flowPos: { x, y } };
        }
      }
    }
  }

  private handleFlowNodeInputChange(ev: { key: string; value: any; source: IDefaultFlowNode }) {
    if (isEdittimeNode(ev.source) && ev.key === '__edittimeData') {
      this.handleForceUpdateFlowNode(ev.source);
    }
  }

  navToNode(ID: string) {
    const scene = this.workbench.project.activeScene;
    if (!this.graph || !scene) return;

    if (this.graph) {
      const cell = this.graph.getCellById(ID);
      if (cell) this.graph.centerCell(cell);
    }
  }

  dispose(): void {
    this._isDisposing = true;
    super.dispose();

    if (this.graph) {
      this.graph.dispose();
      this.graph = undefined;
    }

    this._disposeList.forEach(fn => fn());
    this._disposeList.length = 0;

    this.container = null;
    this._isDisposing = false;
  }
}

const getAddNodeArg = (node: IDefaultFlowNode) => {
  if (!isEdittimeNode(node)) throw new Error('is not EdittimeNode: ' + node._define.className);

  const ed = node.input.__edittimeData;
  const ioDefs = [
    ...Object.entries(node._define.input).map(([ioKey, ioDef]) => ({ ioKey, ioDef, group: 'input' as const })),
    ...Object.entries(node._define.output).map(([ioKey, ioDef]) => ({ ioKey, ioDef, group: 'output' as const })),
  ].filter(d => !(d.ioDef as any).hiddenInGraph);

  const visibleIoCnt = Math.max(
    ioDefs.filter(d => d.group === 'input').length,
    ioDefs.filter(d => d.group === 'output').length
  );

  let label = node.name;

  const data: Node.Metadata = {
    id: node.ID,
    shape: 'FlowNode',
    x: ed?.flowPos?.x,
    y: ed?.flowPos?.y,
    width: 200,
    height: visibleIoCnt * 16,
    label,
    attrs: {
      label: { fill: node.enabled ? ThemeToken.colorText : ThemeToken.colorTextQuaternary },
      rect: { stroke: node.enabled ? ThemeToken.colorText : ThemeToken.colorTextQuaternary },
    },
    ports: {
      items: ioDefs.map(d => {
        return {
          id: d.group + '_' + d.ioKey,
          group: d.group,
          attrs: {
            text: {
              text: (d.ioDef as any).title || d.ioKey,
              fill: node.enabled ? ThemeToken.colorText : ThemeToken.colorTextQuaternary,
            },
            circle: { fill: FlowDataTypeStyle[(d.ioDef as any).dataType]?.color },
          },
        };
      }),
    },
  };

  return data;
};

const getAddEdgeArg = (edge: IDefaultFlowEdge) => {
  const data: Edge.Metadata = {
    shape: 'FlowEdge',
    sourceCell: (edge.from.node as any as IDefaultFlowNode).ID,
    sourcePort: 'output_' + edge.from.ioKey,
    targetCell: (edge.to.node as any as IDefaultFlowNode).ID,
    targetPort: 'input_' + edge.to.ioKey,
    // edge 只能把 ID 放 data 字段，因为在 edge:connected 的时候，是先创建 v6 edge 再创建 flowEdge 的
    data: { ID: edge.ID },
  };

  return data;
};
