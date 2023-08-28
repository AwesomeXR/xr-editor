import { EventBus } from 'ah-event-bus';
import { FlatTreeHelper } from 'ah-tree-helper';
import { IBizIconName } from '../BizIcon';
import _ from 'lodash';
import { IBizMenuItem } from '../BizMenu';

export type ITreeNodeDataAction = {
  key: string;
  icon: IBizIconName;
  img?: string;
  title?: string;
};

export type ITreeNodeData = {
  icon: IBizIconName;
  content: string;
  subContent?: string;

  actions?: ITreeNodeDataAction[];
  stableActions?: ITreeNodeDataAction[];

  disabled?: boolean;
  payload?: any;
};
export type ITreeNodeRTInfo = {
  node: ITreeData;
  selected: boolean;
  expended: boolean;
  level: number;
  isLeaf: boolean;
  children: ITreeData[];
};

export type ITreeData = { id: string; parentId?: string; data: ITreeNodeData };

export type ITreeModelEvtSource = HTMLElement | 'API';

export type ITreeModelEvt = {
  afterAllChange: {};
  afterNodeChange: { id: string; source: ITreeModelEvtSource };
  afterSelectChange: { ids: string[]; source: ITreeModelEvtSource };
  afterExpandChange: { ids: string[]; source: ITreeModelEvtSource };
  afterNodeAction: { node: ITreeData; key: string; source: ITreeModelEvtSource };

  /** 节点右键菜单事件 */
  onNodeContextMenu: { node: ITreeData; menuItems: IBizMenuItem[] };
  onNodeContextMenuExecute: { node: ITreeData; cmd: string; arg?: string };

  onNodeRename: { node: ITreeData; newName: string };

  // 用于通知 ui 的内部事件
  __nodesForRenderChange: {};
  __scrollIntoView: { id: string; source: ITreeModelEvtSource };
  __openContextMenu: {
    id: string;
    source: ITreeModelEvtSource;
    menuItems: IBizMenuItem[];
    cursor?: { x: number; y: number };
  };
  __startRename: { id: string };
};

export class TreeModel {
  readonly event = new EventBus<ITreeModelEvt>();

  private _disableDropOverSelect = false;
  private _selectedIds: string[] = [];
  private _expandedIds: string[] = [];
  private _tree = new FlatTreeHelper<ITreeData>([]);

  private _nodesForRender: ITreeNodeRTInfo[] = [];

  /** 是否禁止拖拽时选中 */
  get disableDropOverSelect() {
    return this._disableDropOverSelect;
  }

  set disableDropOverSelect(value) {
    this._disableDropOverSelect = value;
  }

  get selectedIds() {
    return this._selectedIds;
  }

  get selectedNodes() {
    return _.compact(this._selectedIds.map(id => this._tree.getById(id)));
  }

  get expandedIds() {
    return this._expandedIds;
  }

  get activeId(): string | undefined {
    return this._selectedIds[0];
  }

  get activeNode() {
    return this.activeId ? this._tree.getById(this.activeId) : undefined;
  }

  get allNodes() {
    return this._tree.list;
  }

  get nodesForRender() {
    return this._nodesForRender;
  }

  // 构建渲染树
  private _buildNodesForRender() {
    const infos: ITreeNodeRTInfo[] = [];

    const walk = (_ids: string[]) => {
      for (let i = 0; i < _ids.length; i++) {
        const _id = _ids[i];
        const _info = this.getNodeInfo(_id)!;
        infos.push(_info);

        // 深度递归
        if (_info.expended) walk(_info.children.map(n => n.id));
      }
    };
    walk(this.getRootNodes().map(n => n.id));

    this._nodesForRender = infos;
    this.event.emit('__nodesForRenderChange', {});
  }

  /** 清除不需要的 selectedIds */
  _clearExpiredIds() {
    const idSet = new Set(this._tree.list.map(d => d.id));

    this._selectedIds = [...new Set(this._selectedIds.filter(id => idSet.has(id)))];
    this._expandedIds = [...new Set(this._expandedIds.filter(id => idSet.has(id)))];
  }

  resetSelect(ids: string[], source: ITreeModelEvtSource = 'API') {
    const effectedIds = _.difference(_.union(this._selectedIds, ids), _.intersection(this._selectedIds, ids));
    this._selectedIds = ids;

    this.event.emit('afterSelectChange', { ids: effectedIds, source });
  }

  resetExpand(ids: string[], source: ITreeModelEvtSource = 'API') {
    this._expandedIds = ids;
    this._buildNodesForRender();
    this.event.emit('afterExpandChange', { ids, source });
  }

  select(id: string, select?: boolean, source: ITreeModelEvtSource = 'API') {
    const idx = this._selectedIds.indexOf(id);

    if (select && idx < 0) this._selectedIds.unshift(id);
    if (!select && idx >= 0) this._selectedIds.splice(idx, 1);

    this.event.emit('afterSelectChange', { ids: [id], source });
  }

  expand(id: string, expand?: boolean, source: ITreeModelEvtSource = 'API') {
    const idx = this._expandedIds.indexOf(id);

    if (expand && idx < 0) this._expandedIds.unshift(id);
    if (!expand && idx >= 0) this._expandedIds.splice(idx, 1);

    this._buildNodesForRender();
    this.event.emit('afterExpandChange', { ids: [id], source });
  }

  updateNode(
    id: string,
    data: ITreeNodeData,
    parentId?: string,
    source: ITreeModelEvtSource = 'API',
    opt: { silence?: boolean } = {}
  ) {
    const node = this._tree.getById(id);

    if (node) {
      node.data = data;
    } else {
      this._tree.add([{ id, parentId, data: data }]);
    }

    if (!opt.silence) this.event.emit('afterNodeChange', { id, source });
  }

  getNodeInfo(id: string): ITreeNodeRTInfo | undefined {
    const node = this._tree.getById(id);
    if (!node) return;

    return {
      node,
      selected: this._selectedIds.includes(id),
      expended: this._expandedIds.includes(id),
      level: this._tree.findAllParent(id).length,
      isLeaf: this._tree.isLeaf(id),
      children: this._tree.getFlatChildren(id),
    };
  }

  navTo(id: string) {
    const allParent = this._tree.findAllParent(id);
    this.resetExpand([...allParent.map(p => p.id), ...this._expandedIds]);
    this.resetSelect([id]);

    setTimeout(() => this.event.emit('__scrollIntoView', { id, source: 'API' }), 0);
  }

  /** 通知 ui 重命名 */
  startRename(id: string) {
    this.event.emit('__startRename', { id });
  }

  getRootNodes() {
    return this._tree.findAllRoot();
  }

  reloadAll(list: ITreeData[]) {
    this._tree = new FlatTreeHelper<ITreeData>(list);
    this._buildNodesForRender();

    this.event.emit('afterAllChange', {});
  }

  openContextMenu(id: string, cursor?: { x: number; y: number } | HTMLElement, menuItems?: IBizMenuItem[]) {
    const node = this._tree.getById(id);
    if (!node) return;

    // 通知外部添加菜单
    if (!menuItems) {
      menuItems = [];
      this.event.emit('onNodeContextMenu', { node, menuItems });
    }

    let _cursor: { x: number; y: number } | undefined;

    if (cursor instanceof HTMLElement) {
      const _box = cursor.getBoundingClientRect();
      _cursor = { x: _box.x + _box.width + 8, y: _box.y };
    } else {
      _cursor = cursor;
    }

    // 通知 ui 展示菜单
    this.event.emit('__openContextMenu', { id, source: 'API', menuItems, cursor: _cursor });
  }

  getVisibleNodesInLayout() {}
}
