import { FSUtil, IFileStat, MemoryFS } from 'ah-memory-fs';
import { ITreeData, ITreeModelEvt, TreeModel } from '../../../common/component/LightTree';
import { PanelModel } from '../../ViewModel/Workbench/PanelModel';
import { getExt } from '../../../common/lib/getExt';
import { formatFileSize, getInternalRandomString } from '../../../common';
import { FileTypeRegistry, IFileTypeData } from '../../FileTypeRegistry';
import { collectFileFromDragEvent } from '../../../common/lib/collectFileFromDragEvent';
import _ from 'lodash';
import Path from 'path';
import { buildCommand } from '../../BuildCommand';

export type IDisplayType = 'List' | 'Grid';

export type IFileExplorerModelProps = {
  displayType?: IDisplayType;
  selectedIds?: string[];
  expandedIds?: string[];
};
export type IFileExplorerModelState = {
  displayType: IDisplayType;

  // 文件导入
  fileImporting?: { progress: number };
};
export type IFileExplorerModelEvent = {};

type IOutlinePayload = {
  path: string; // 文件路径
  basename: string; // 文件名
  dirname: string; // 文件夹路径

  ext?: string; // 文件扩展名
  stat: IFileStat; // 文件状态

  ft?: IFileTypeData;
};

function _genPayload(d: IOutlinePayload): IOutlinePayload {
  return d;
}

export class FileExplorerModel extends PanelModel<
  IFileExplorerModelProps,
  IFileExplorerModelState,
  IFileExplorerModelEvent
> {
  readonly outline = new TreeModel();

  _state: IFileExplorerModelState = { displayType: 'List' };

  private _disposeList: (() => any)[] = [];

  restore(props: IFileExplorerModelProps | undefined): void {
    if (props) {
      this.updateState(props);

      this.outline.resetSelect(props.selectedIds || []);
      this.outline.resetExpand(props.expandedIds || []);
    }

    // 建立监听
    this._disposeList.push(
      // mfs
      this.project.mfs.event.listen('CREATE', () => this.lazyReloadOutline()),
      this.project.mfs.event.listen('DELETE', () => this.lazyReloadOutline()),
      this.project.mfs.event.listen('MOVE', () => this.lazyReloadOutline()),
      this.project.mfs.event.listen('MODIFY', () => this.lazyReloadOutline()),
      // outline
      this.outline.event.listen('afterSelectChange', this._handleOutlineSelectChange),
      // this.outline.event.listen('afterNodeAction', this._handleOutlineNodeAction),
      this.outline.event.listen('onNodeContextMenu', this._handleOutlineNodeContextMenu),
      this.outline.event.listen('onNodeContextMenuExecute', this._handleOutlineNodeContextMenuExecute),
      this.outline.event.listen('onNodeRename', this._handleOutlineNodeRename),

      // panel
      this.event.listen('invoke', ev => this._handleInvoke(ev.method, ev.arg))
    );

    this.reloadOutline(); // 加载文件树
  }

  save(): IFileExplorerModelProps {
    return {
      displayType: this.state.displayType,
      selectedIds: this.outline.selectedIds,
      expandedIds: this.outline.expandedIds,
    };
  }

  get activeFile() {
    return this.outline.activeNode?.data.payload as IOutlinePayload | undefined;
  }

  async reloadOutline() {
    let list: ITreeData[] = [];

    const pathList = await this.project.mfs.glob('**/*', { includeDir: true });
    for (let i = 0; i < pathList.length; i++) {
      const path = pathList[i];

      const stat = await this.project.mfs.stats(path);
      if (!stat) continue;

      const ext = getExt(path);
      const ft = ext ? FileTypeRegistry.Default.get(ext) : undefined;

      let dirname = Path.dirname(path);
      if (dirname === '.') dirname = '';

      const basename = Path.basename(path);

      list.push({
        id: path,
        parentId: path.split('/').slice(0, -1).join('/'),
        data: {
          icon: stat.isDir ? 'outliner_collection' : ft?.icon || 'file_blank',
          content: basename,
          subContent: stat.isDir ? undefined : formatFileSize(stat.size),
          payload: _genPayload({ path, basename, dirname, stat, ext, ft }),
        },
      });
    }

    // 排序, 文件夹在前, 文件在后, 按字母排序
    list = _.sortBy(
      list,
      d => (d.data.payload.stat.isDir ? 0 : 1),
      d => d.data.content
    );

    this.outline.reloadAll(list);
  }

  changeDisplayType(type: IDisplayType) {
    this.updateState({ displayType: type });
    this.reloadOutline();
  }

  async handleFileDrop(ev: React.DragEvent<HTMLDivElement>) {
    ev.preventDefault();
    ev.stopPropagation();

    this.updateState({ fileImporting: { progress: 0 } });

    const activePayload = this.outline.activeNode?.data.payload as IOutlinePayload;
    const pathPrefix = activePayload ? (activePayload.stat.isDir ? activePayload.path : activePayload.dirname) : '';

    const mfs = await collectFileFromDragEvent(ev.nativeEvent, pathPrefix);
    const toSelectPath = (await mfs.glob('**/*'))[0];

    // 复制到项目文件系统
    await FSUtil.copyTo(mfs, this.project.mfs, undefined, pg => {
      this.updateState({ fileImporting: { progress: pg } });
    });

    this.updateState({ fileImporting: undefined });
    this.outline.resetSelect([toSelectPath]);
  }

  /** 面板方法调用 */
  private _handleInvoke(method: string, arg?: string) {
    const mfs = this.project.mfs;

    if (method === 'Remove') {
      const paths = JSON.parse(arg || '[]') as string[];
      Promise.all(paths.map(p => mfs.unlink(p))); // 删除文件
    }

    if (method === 'Rename' && arg) {
      this.outline.startRename(arg);
    }
  }

  private _handleOutlineSelectChange = (ev: ITreeModelEvt['afterSelectChange']) => {
    if (!this.scene) return;

    const activeItem = this.outline.activeId ? this.outline.getNodeInfo(this.outline.activeId) : undefined;
    if (!activeItem) return;

    const payload = activeItem.node.data.payload as IOutlinePayload;
    if (!payload) return;
  };

  /** 大纲右键菜单写这里 */
  private _handleOutlineNodeContextMenu = (ev: ITreeModelEvt['onNodeContextMenu']) => {
    const { node, menuItems } = ev;

    const nodeIds = _.uniq([node.id, ...this.outline.selectedIds]); // 需要去重

    menuItems.push(
      {
        title: '重命名',
        icon: 'greasepencil',
        ...buildCommand('InvokePanel', {
          ID: this.ID,
          method: 'Rename',
          arg: node.id, // id 即路径
        }),
      },
      {
        title: '下载',
        icon: 'antd:DeliveredProcedureOutlined',
        ...buildCommand('ExportFile', { filepaths: nodeIds }),
      },
      {
        title: '删除',
        icon: 'trash',
        ...buildCommand('InvokePanel', {
          ID: this.ID,
          method: 'Remove',
          arg: JSON.stringify(nodeIds), // id 即路径
        }),
      }
    );
  };

  /** 大纲右键菜单响应 */
  private _handleOutlineNodeContextMenuExecute = (ev: ITreeModelEvt['onNodeContextMenuExecute']) => {
    this.project.command.execute(ev.cmd as any, ev.arg, { skipIfDisabled: true });
  };

  // 大纲重命名
  private _handleOutlineNodeRename = (ev: ITreeModelEvt['onNodeRename']) => {
    const { node, newName } = ev;
    if (!newName) return;

    const payload = node.data.payload as IOutlinePayload;
    if (!payload) return;

    const newPath = MemoryFS.normalizePath(Path.join(payload.dirname, newName));

    this.project.mfs.move(payload.path, newPath);
    this.outline.resetSelect([newPath]);
  };

  lazyReloadOutline = _.debounce(() => this.reloadOutline(), 100);

  /** 添加文件夹 */
  async addDictionary() {
    let path = '文件夹_' + getInternalRandomString(true);
    if (this.activeFile) path = this.activeFile.dirname + '/' + path;

    path = MemoryFS.normalizePath(path);
    await this.project.mfs.mkdir(path);

    this.outline.resetSelect([path]);
  }

  dispose(): void {
    this._disposeList.forEach(d => d());
    this._disposeList = [];

    super.dispose();
  }
}
