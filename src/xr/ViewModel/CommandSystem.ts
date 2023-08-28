import { Deferred, getInternalRandomString } from 'xr-core';
import {
  FlowDTRegistry,
  FlowEdgeSerializer,
  FlowNodeSerializer,
  IDefaultFlowNode,
  IFlowDTRegisterData,
  IFlowHost,
  Util,
} from 'ah-flow-node';
import { ICommandSystemImpl, IXRCommand, ICommandSystemHandler } from '../IXRCommand';
import { EventBus } from 'ah-event-bus';
import _ from 'lodash';
import Path from 'path';
import { getMimeByFilename } from 'ah-memory-fs';
import { Vector3, getExt } from 'xr-impl-bjs/dist/bjs';
import { browserDownload } from '../../common/lib/browserDownload';
import { ProgressHelper, getImage, quickXhrDownload } from '../../common';
import { BasisuUtil } from '../../common/lib/BasisuUtil';
import { buildCommand } from '../BuildCommand';
import { ImageUtil } from '../../common/lib/ImageUtil';
import { dataUrl2Blob } from '../../common/lib/dataUrl2Blob';
import { GLTFUtil } from '../lib/GLTFUtil';
import { BizFlowNodeUtil } from '../lib';
import { XRProjectModel } from './XRProjectModel';
import { doAssetContainerOp } from '../lib/AssetContainerOp';

export type IHistoryItem = {
  key: string;
  t: number;
  next?: (defer: Deferred<void>) => any;
  back?: (defer: Deferred<void>) => any;
};

export type ICommandExecuteOption = {
  skipIfDisabled?: boolean;
  deferTitle?: string;
  deferName?: string;
};

/**
 * 命令系统
 *
 * 1. 如果有 outline 等变更副作用，最好放这里，不要放 ViewModel，因为要保持 redo/undo 逻辑清晰
 * 1. 成功后打开结果面板的操作放这里
 */
export class CommandSystem implements ICommandSystemImpl {
  /** @deprecated */
  static build = buildCommand;

  readonly event = new EventBus<{
    'execute:beforeInvoke': { defer: Deferred<void> };
    'execute:afterInvoke': { defer: Deferred<void> };
    'execute:afterError': { err: Error };
  }>();

  private _cmdId = 0;
  private _logger = this.project.logger.extend('CmdSys');
  private _pendingQueue: {
    cmdId: number;
    command: any;
    arg?: any;
    opt?: ICommandExecuteOption;
    defer: Deferred<void>;
  }[] = [];
  private _isSeqRunning = false; // 是否正连续执行中

  private _history: IHistoryItem[] = [];
  private _currentHistoryIdx = -1;

  constructor(private project: XRProjectModel) {
    // 构建初始 history
    this._history.push(this._genHisItem());
    this._currentHistoryIdx = 0;
  }

  _handle_Scene_ApplyFlowNodeTpl: ICommandSystemHandler<'Scene_ApplyFlowNodeTpl'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    const scene = this.project.activeScene;
    if (!scene || !scene.rootFlowHost) throw new Error('missing scene');

    if (!defer) return;

    const { ID, tpl } = arg;
    scene.applyFlowNodeTpl(ID, tpl as any);

    defer.resolve();
  };

  _handle_AssetContainer_Op: ICommandSystemHandler<'AssetContainer_Op'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');
    if (!defer) return;

    const scene = this.project.activeScene;
    if (!scene || !scene.rootFlowHost) throw new Error('missing scene');

    const { ID, action } = arg;

    const node = scene.rootFlowHost.flowNodeManager.get(ID, 'AssetContainerNode');
    if (!node) throw new Error('missing node');

    doAssetContainerOp(node, action);

    defer.resolve();
  };

  _handle_WB_Add: ICommandSystemHandler<'WB_Add'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');
    if (!defer) return;

    let { config } = arg;

    if (!config) {
      config = _.cloneDeep(this.project.workbench.wbConfig);
      config.key = getInternalRandomString(); // 随机生成一个 key, 避免重复
    }

    if (typeof config === 'string') {
      // TODO
    } else {
      this.project.workbench.addWbConfig(config);
    }

    defer.resolve();
  };

  _handle_WB_Remove: ICommandSystemHandler<'WB_Remove'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');
    if (!defer) return;

    const { index } = arg;
    this.project.workbench.removeWbConfig(index);

    defer.resolve();
  };

  _handle_WB_Switch: ICommandSystemHandler<'WB_Switch'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');
    if (!defer) return;

    const { index } = arg;
    this.project.workbench.switchWbConfig(index);

    defer.resolve();
  };

  _handle_WB_Update: ICommandSystemHandler<'WB_Update'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');
    if (!defer) return;

    const { index, title } = arg;

    const wbConfig = this.project.workbench.wbConfigList[index];
    if (title) wbConfig.title = title;

    this.project.workbench.event.emit('wbConfigMetaChange', {});

    defer.resolve();
  };

  _handle_Pause: ICommandSystemHandler<'Pause'> = (arg, defer) => {
    if (!defer) return;

    const pause = typeof arg?.pause !== 'undefined' ? arg.pause : !this.project.pause;
    this.project.pause = pause;

    defer.resolve();
  };

  _handle_Scene_UpdateGizmoState: ICommandSystemHandler<'Scene_UpdateGizmoState'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    const scene = arg.sceneID ? this.project.scenes.find(s => s.ID === arg.sceneID) : this.project.activeScene;
    if (!scene || !scene.gizmo) throw new Error('missing scene');

    if (!defer) return;

    scene.setGizmoState(arg.state);
    defer.resolve();
  };

  _handle_File_GLTF_Optimize: ICommandSystemHandler<'File_GLTF_Optimize'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    const { path } = arg;
    const ext = getExt(path);

    if (!ext || (ext !== '.glb' && ext !== '.gltf')) throw new Error('不是 gltf 文件');
    if (ext === '.glb') throw new Error('暂无法处理 glb');

    if (!defer) return;

    const _run = async () => {
      await GLTFUtil.decodeCnPath(this.project.mfs, path);
    };

    _run().then(defer.resolve).catch(defer.reject);
  };

  _handle_File_Image_ResizeSquare: ICommandSystemHandler<'File_Image_ResizeSquare'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    const { path, size } = arg;

    const ext = getExt(path);
    if (!ext) throw new Error('文件后缀为空');

    if (!defer) return;

    Deferred.wrapAsyncFn(
      async _defer => {
        const mime = getMimeByFilename(path);
        const buf = await this.project.mfs.readFile(path);
        const url = URL.createObjectURL(new Blob([buf], { type: mime }));
        const img = await getImage(url).ret;

        _defer.setProgress(0.5);

        const resizedDataURL = ImageUtil.quickResizeSquare(img, size, mime as any);
        const resizedBuf = await dataUrl2Blob(resizedDataURL).arrayBuffer();

        await this.project.mfs.writeFile(path, resizedBuf);
      },
      () => defer
    )();
  };

  _handle_File_Image_TextureCompress: ICommandSystemHandler<'File_Image_TextureCompress'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    const { path, ...ktxArgs } = arg;

    const ext = getExt(path);
    if (!ext) throw new Error('文件后缀为空');

    if (!defer) return;

    const _run = async () => {
      const buf = await this.project.mfs.readFile(path);
      defer.setProgress(0.2);

      const ktx2ImgData = await BasisuUtil.Instance.pack2KTX2(new Uint8Array(buf), ext, { ...ktxArgs });

      const newPath = path + '.ktx2';
      await this.project.mfs.writeFile(newPath, ktx2ImgData.buffer);
    };

    _run().then(defer.resolve).catch(defer.reject);
  };

  _handle_Import: ICommandSystemHandler<'Import'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');
    if (!defer) return;

    const { url } = arg;

    const ph = new ProgressHelper(defer.setProgress).splitAvg('download', 'import');

    quickXhrDownload<Blob>(url, 'blob', ph.download).then(blob => {
      const _importDefer = this.project.import(blob);

      _importDefer.event.listen('progressChange', ph.import);
      _importDefer.ret.then(defer.resolve);
      _importDefer.ret.catch(defer.reject);
    });
  };

  _handle_Export: ICommandSystemHandler<'Export'> = (arg, defer) => {
    if (!defer) return;

    const exportDefer = this.project.export();
    exportDefer.ret.then(browserDownload);

    exportDefer.transferTo(defer, () => {});
  };

  _handle_Scene_UpdateCursor: ICommandSystemHandler<'Scene_UpdateCursor'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');
    if (!defer) return;

    const scene = arg.sceneID ? this.project.scenes.find(s => s.ID === arg.sceneID) : this.project.activeScene;
    if (!scene || !scene.world) throw new Error('missing scene');

    if (typeof arg.enabled !== 'undefined') scene.world.cursorEnabled = arg.enabled;

    defer.resolve();
  };

  _handle_InvokePanel: ICommandSystemHandler<'InvokePanel'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    let panelID: string | undefined;

    if (arg.ID) panelID = arg.ID;
    else if (this.project.workbench.wbScope.comp !== '*') panelID = this.project.workbench.wbScope.ID;

    if (!panelID) throw new Error('panel not exist');
    if (!defer) return;

    const model = this.project.workbench.getPanelModel(panelID);
    (model.event as any).emit('invoke', { method: arg.method, arg: arg.arg });

    defer.resolve();
  };

  _handle_Copy: ICommandSystemHandler<'Copy'> = (arg, defer) => {
    if (!arg) throw new Error('没有数据');
    if (!defer) return;

    this.project.clipboard.copy(JSON.parse(arg.data));
    defer.resolve();
  };

  _handle_Paste: ICommandSystemHandler<'Paste'> = (arg, defer) => {
    const scene = this.project.activeScene;
    if (!scene) throw new Error('missing scene');

    if (!this.project.clipboard.hasData) throw new Error('没有数据');
    if (!defer) return;

    const assets = this.project.clipboard.paste();
    defer.resolve();

    const redoList: Function[] = [];

    return {
      undo: _defer => {
        if (assets && scene.rootFlowHost) {
          assets.flowNodes?.forEach(({ ID }) => {
            // 这里要用 ID 重新取实例 (redo/undo 兼容)
            const node = scene.hierarchyFindNode(ID);
            if (!node) return;

            const desc = FlowNodeSerializer.save(node);
            redoList.push(() => FlowNodeSerializer.restore(node.host, desc));
            node.dispose();
          });

          assets.flowEdges?.forEach(({ ID }) => {
            const edge = scene.rootFlowHost!.flowEdgeManager.get(ID);
            if (!edge) return;

            const desc = FlowEdgeSerializer.save(edge);
            redoList.push(() => FlowEdgeSerializer.restore(edge.host, desc));

            edge.dispose();
          });
        }

        _defer.resolve();
      },
      redo: _defer => {
        redoList.forEach(fn => fn());
        redoList.length = 0;
        _defer.resolve();
      },
    };
  };

  _handle_Scene_UpdateEDCamera: ICommandSystemHandler<'Scene_UpdateEDCamera'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');
    if (!defer) return;

    const scene = arg.sceneID ? this.project.scenes.find(s => s.ID === arg.sceneID) : this.project.activeScene;
    if (!scene || !scene.edittimeCamera || !scene.world) throw new Error('missing scene');

    if (typeof arg.mode !== 'undefined') scene.edittimeCamera.mode = arg.mode;
    if (typeof arg.target !== 'undefined') {
      if (arg.target === 'cursor') {
        scene.edittimeCamera.target = new Vector3(
          scene.world.cursorPosition.x,
          scene.world.cursorPosition.y,
          scene.world.cursorPosition.z
        );
      }
      //
      else if (arg.target === 'picked') {
        if (scene.pickedMeshInfo) scene.edittimeCamera.zoomOn([scene.pickedMeshInfo.mesh]);
      }
      //
      else {
        scene.edittimeCamera.target = Vector3.FromArray(arg.target);
      }
    }

    defer.resolve();
  };

  _handle_Lint: ICommandSystemHandler<'Lint'> = (arg, defer) => {
    if (!defer) return;

    this.project.lint().transferTo(defer, () => {});
  };

  _handle_Scene_CameraGizmo_Toggle: ICommandSystemHandler<'Scene_CameraGizmo_Toggle'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    const scene = this.project.scenes.find(s => s.ID === arg.sceneID);
    if (!scene || !scene.gizmo) throw new Error('missing scene: ' + arg.sceneID);

    if (!defer) return;

    if (scene.gizmo.camera.has(arg.name)) scene.gizmo.camera.remove(arg.name);
    else scene.gizmo.camera.add(arg.name);

    defer.resolve();
  };

  _handle_CloneScene: ICommandSystemHandler<'CloneScene'> = (arg, defer) => {
    const sourceID = arg?.ID || this.project.activeSceneID;
    if (!sourceID) throw new Error('missing sourceID');

    if (!defer) return;

    const newID = getInternalRandomString();
    this.project.cloneScene(sourceID, newID).transferTo(defer, v => {});

    return {
      undo: _defer => {
        this.project.removeScene(newID).transferTo(_defer, v => {});
      },
      redo: _defer => {
        this.project.cloneScene(sourceID, newID).transferTo(_defer, v => {});
      },
    };
  };

  _handle_MFS_Move: ICommandSystemHandler<'MFS_Move'> = (arg, defer) => {
    if (!arg?.fromPath || !arg?.toPath) return;
    if (!defer) return;

    const { fromPath, toPath } = arg;

    this.project.mfs.move(fromPath, toPath).then(defer.resolve).catch(defer.reject);

    return {
      redo: _defer => {
        this.project.mfs.move(fromPath, toPath).then(_defer.resolve).catch(_defer.reject);
      },
      undo: _defer => {
        this.project.mfs.move(toPath, fromPath).then(_defer.resolve).catch(_defer.reject);
      },
    };
  };

  _handle_UpdateSceneMeta: ICommandSystemHandler<'UpdateSceneMeta'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    const scene = this.project.scenes.find(s => s.ID === arg.ID);
    if (!scene) throw new Error('missing scene: ' + arg.ID);

    if (!defer) return;

    if (typeof arg.title !== 'undefined') scene.title = arg.title;
    if (typeof arg.poster !== 'undefined') scene.poster = arg.poster;

    defer.resolve();
  };

  _handle_PBRC_AddLayer: ICommandSystemHandler<'PBRC_AddLayer'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    const composer = this.project.pbrComposers.find(c => c.name === arg.composer);
    if (!composer) throw new Error('missing composer: ' + arg.composer);

    const slot = composer.slots[arg.slot];
    if (!slot) throw new Error('missing slot: ' + arg.slot);

    if (!defer) return;

    composer.addLayer(arg.slot);
    defer.resolve();
  };

  _handle_CreatePBRComposer: ICommandSystemHandler<'CreatePBRComposer'> = (arg, defer) => {
    if (!defer) return;

    this.project.createPbrComposer();
    defer.resolve();
  };

  _handle_MFS_Mkdir: ICommandSystemHandler<'MFS_Mkdir'> = (arg, defer) => {
    const activePath = arg?.activePath;
    const dirname = arg?.dirname || getInternalRandomString(true);

    if (!defer) return;

    Deferred.wrapAsyncFn(
      async () => {
        let toCreatePath: string;

        if (!activePath) toCreatePath = dirname;
        else {
          const stats = await this.project.mfs.stats(activePath);
          if (!stats) throw new Error('activePath is not exist: ' + activePath);

          if (!stats.isDir) {
            toCreatePath = Path.join(Path.dirname(activePath), dirname);
          } else {
            toCreatePath = Path.join(activePath, dirname);
          }
        }

        await this.project.mfs.mkdirp(toCreatePath);
      },
      () => defer
    )();
  };

  _handle_MFS_Unlink: ICommandSystemHandler<'MFS_Unlink'> = (arg, defer) => {
    const paths = arg?.paths;
    if (!paths || paths.length === 0) throw new Error('missing paths');

    const dirnameList = new Set(paths.map(p => Path.dirname(p)));
    if (dirnameList.size > 1) throw new Error('处于不同文件夹下');

    if (!defer) return;

    Promise.all(paths.map(p => this.project.mfs.unlink(p)))
      .then(() => defer.resolve())
      .catch(defer.reject);
  };

  _handle_ExportFile: ICommandSystemHandler<'ExportFile'> = (arg, defer) => {
    const filepaths = arg?.filepaths;
    if (!filepaths) throw new Error('missing filepath');
    if (filepaths.length === 0) throw new Error('未选中文件');

    if (!defer) return;

    this.project.exportFile(filepaths).transferTo(defer);
  };

  _handle_Scene_UpdateWorld: ICommandSystemHandler<'Scene_UpdateWorld'> = (arg, defer) => {
    if (!arg) throw new Error('missing arg');

    const activeScene = this.project.activeScene;
    if (!activeScene || !activeScene.world) throw new Error('没有激活场景');

    if (!defer) return;

    let lastGroundVisible: boolean;
    let groundVisible: boolean;

    if (typeof arg.groundVisible === 'boolean') {
      groundVisible = arg.groundVisible;
      lastGroundVisible = activeScene.world.groundVisible;
      activeScene.world.groundVisible = groundVisible;
    }

    defer.resolve();

    return {
      redo: defer => {
        if (typeof groundVisible === 'boolean' && activeScene.world) {
          activeScene.world.groundVisible = groundVisible;
        }
        defer.resolve();
      },
      undo: defer => {
        if (typeof lastGroundVisible === 'boolean' && activeScene.world) {
          activeScene.world.groundVisible = lastGroundVisible;
        }
        defer.resolve();
      },
    };
  };

  _handle_RemoveScene: ICommandSystemHandler<'RemoveScene'> = (arg, defer) => {
    const targetID = arg?.ID || this.project.activeSceneID;
    if (!targetID) throw new Error('没有目标场景');
    if (this.project.scenes.length === 1) throw new Error('至少保留一个场景');

    if (!defer) return;

    this.project.removeScene(targetID).transferTo(defer);

    return {
      undo: _defer => {
        this.project.createScene(targetID).transferTo(_defer, v => {});
      },
      redo: _defer => {
        this.project.removeScene(targetID).transferTo(_defer);
      },
    };
  };

  _handle_SwitchActiveScene: ICommandSystemHandler<'SwitchActiveScene'> = (arg, defer) => {
    const targetID = arg?.ID;
    if (!targetID) throw new Error('没有目标场景');
    if (targetID === this.project.activeSceneID) throw new Error('目标场景一致');

    if (!defer) return;

    const lastID = this.project.activeSceneID;
    this.project.activeSceneID = targetID;

    // do background lint
    this.project.lint();

    defer.resolve();

    return {
      undo: _defer => {
        this.project.activeSceneID = lastID;
        _defer.resolve();
      },
      redo: _defer => {
        this.project.activeSceneID = targetID;
        _defer.resolve();
      },
    };
  };

  _handle_CreateScene: ICommandSystemHandler<'CreateScene'> = (arg, defer) => {
    if (!defer) return;

    const ID = getInternalRandomString(true);
    this.project.createScene(ID).transferTo(defer, v => {});

    return {
      undo: _defer => {
        this.project.removeScene(ID).transferTo(_defer);
      },
      redo: _defer => {
        this.project.createScene(ID).transferTo(_defer, v => {});
      },
    };
  };

  _handle_Redo: ICommandSystemHandler<'Redo'> = (arg, defer) => {
    if (this._history.length === 0) throw new Error('history empty');
    if (this._currentHistoryIdx >= this._history.length - 1) throw new Error('is latest history item');

    const hisItem = this._history[this._currentHistoryIdx];
    if (!hisItem.next) throw new Error('no history.next');

    if (!defer) return;

    const hisDefer = new Deferred<void>();

    hisItem.next.call(this, hisDefer);
    this._currentHistoryIdx += 1;

    hisDefer.ret.then(defer.resolve).catch(defer.reject);

    // redo 操作不需要返回 his item
  };

  _handle_Undo: ICommandSystemHandler<'Undo'> = (arg, defer) => {
    if (this._history.length === 0) throw new Error('history empty');

    const hisItem = this._history[this._currentHistoryIdx];
    if (!hisItem.back) throw new Error('no history.back');

    if (!defer) return;

    const hisDefer = new Deferred<void>();

    hisItem.back.call(this, hisDefer);
    this._currentHistoryIdx -= 1;

    hisDefer.ret.then(defer.resolve).catch(defer.reject);

    // undo 操作不需要返回 his item
  };

  _handle_Publish: ICommandSystemHandler<'Publish'> = (arg, defer) => {
    if (this.project.activeSceneLintErrorCnt > 0) throw new Error('当前场景存在校验错误');
    if (!defer) return;

    const { syncEDCameraToPreview, extraTplData, toLocal } = arg || {};

    if (syncEDCameraToPreview) {
      const scene = this.project.activeScene;
      if (scene) {
        scene.syncEDCameraToPreview(syncEDCameraToPreview);
      }
    }

    if (toLocal) {
      this.project.publishToLocal(extraTplData).transferTo(defer, v => {});
    } else {
      this.project.publish(extraTplData).transferTo(defer, v => {});
    }
  };

  _handle_Save: ICommandSystemHandler<'Save'> = (arg, defer) => {
    if (!defer) return;
    this.project.save().transferTo(defer);
  };

  _handle_Scene_AddFlowNode: ICommandSystemHandler<'Scene_AddFlowNode'> = (arg, defer) => {
    const scene = this.project.activeScene;
    if (!scene || !scene.rootFlowHost) throw new Error('没有激活场景');

    if (!arg) throw new Error('没有提供 arg');
    if (!defer) return;

    const node = scene.addFlowNode<any>(arg.className, arg.name, arg.inputValues, arg.enabled, arg.ID);
    // 设置选中
    node.setInput('__edittimeData', { ...node.input.__edittimeData, selected: true });

    // do background lint
    this.project.lint();

    defer.resolve();

    return {
      undo: _defer => {
        scene.removeFlowNode(node.ID);
        _defer.resolve();
      },
      redo: _defer => {
        const _node = scene.addFlowNode<any>(arg.className, node.name, node.input, node.enabled, node.ID);
        _node.setInput('__edittimeData', { ...node.input.__edittimeData, selected: true });

        _defer.resolve();
      },
    };
  };

  _handle_Scene_RemoveFlowNode: ICommandSystemHandler<'Scene_RemoveFlowNode'> = (arg, defer) => {
    const scene = this.project.activeScene;
    if (!scene || !scene.rootFlowHost) throw new Error('没有激活场景');

    const toRemoveItems = arg?.IDs
      ? scene.rootFlowHost.flowNodeManager.all.filter(node => arg.IDs!.includes(node.ID))
      : scene.rootFlowHost.flowNodeManager.all.filter(node => node.input.__edittimeData.selected);

    if (!defer) {
      if (toRemoveItems.length === 0) throw new Error('没有选中节点');
      return;
    }

    const toRemoveNodes: IDefaultFlowNode[] = [];

    for (const n of toRemoveItems) {
      const node = scene.rootFlowHost.flowNodeManager.get(n.ID);
      toRemoveNodes.push(node);
    }

    if (arg?.removeVirtualChildren) {
      // 收集需要删除的节点, 包括子节点
      const _childrenList: IDefaultFlowNode[] = [];
      for (const node of toRemoveNodes) {
        _childrenList.push(...BizFlowNodeUtil.collectVirtualChildrenNodes(node));
      }
      toRemoveNodes.push(..._childrenList);
    }

    // 删除节点
    for (const node of toRemoveNodes) {
      node.dispose();
    }

    // do background lint
    this.project.lint();

    defer.resolve();

    return {
      undo: _defer => {
        for (const node of toRemoveNodes) {
          scene.addFlowNode(node._define.className, node.name, node.input, node.enabled, node.ID, node.host);
        }
        _defer.resolve();
      },
      redo: _defer => {
        if (!scene.rootFlowHost) return;
        for (const n of toRemoveItems) {
          const node = scene.rootFlowHost.flowNodeManager.get(n.ID);
          node.dispose();
        }

        _defer.resolve();
      },
    };
  };

  _handle_Scene_UpdateFlowNode: ICommandSystemHandler<'Scene_UpdateFlowNode'> = (arg, defer) => {
    const scene = this.project.activeScene;
    if (!scene || !scene.rootFlowHost) throw new Error('没有激活场景');

    if (!arg) throw new Error('missing arg');

    const nodes = _.compact(arg.IDs.map(ID => scene.rootFlowHost?.flowNodeManager.get(ID)));
    if (nodes.length === 0) throw new Error('missing nodes: ' + arg.IDs.join(','));

    const undoList: Function[] = [];
    const redoList: Function[] = [];

    if (arg.propPath === 'name') {
      if (!defer) return;
      for (const node of nodes) {
        const _lastValue = node.name;
        undoList.push(() => (node.name = _lastValue));

        const _curValue = arg.value + '';
        node.name = _curValue;

        redoList.push(() => (node.name = _curValue));
      }

      // do background lint
      this.project.lint();

      defer.resolve();
    }
    //
    else if (arg.propPath === 'enabled') {
      if (!defer) return;
      for (const node of nodes) {
        const _lastValue = node.enabled;
        undoList.push(() => (node.enabled = _lastValue));

        const _curValue = !!arg.value;
        node.enabled = _curValue;

        redoList.push(() => (node.enabled = _curValue));
      }

      // do background lint
      this.project.lint();

      defer.resolve();
    }
    //
    else if (arg.propPath.startsWith('input.')) {
      const [ioKey, ..._pathSegs] = arg.propPath.replace(/^input\./, '').split('.');
      const nodeDts: IFlowDTRegisterData[] = [];

      for (const node of nodes) {
        const def = node._define.input[ioKey];
        if (!def) throw new Error('missing type define: ' + ioKey);

        const dt = FlowDTRegistry.Default.get(def.dataType);
        if (!dt?.serializer) throw new Error('missing type serializer: ' + def.dataType);

        nodeDts.push(dt);
      }

      if (!defer) return;

      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const dt = nodeDts[i];
        const inputDef = node._define.input[ioKey];

        const _lastValue = Util.cloneByDataType(inputDef.dataType, node.input[ioKey]);
        undoList.push(() => node.setInput(ioKey, _lastValue));

        if (_pathSegs.length === 0) {
          const _curValue = dt.serializer === 'JSON' ? _.cloneDeep(arg.value) : dt.serializer!.restore(arg.value);
          node.setInput(ioKey, _curValue);
          redoList.push(() => node.setInput(ioKey, _curValue));
        } else {
          const _curValue = Util.cloneByDataType(inputDef.dataType, node.input[ioKey]);
          _.set(_curValue, _pathSegs, arg.value);

          node.setInput(ioKey, _curValue, { skipEqualCheck: true });
          redoList.push(() => node.setInput(ioKey, _curValue, { skipEqualCheck: true }));
        }
      }

      // do background lint
      this.project.lazyLint();

      defer.resolve();
    }

    return {
      undo: _defer => {
        undoList.forEach(fn => fn());
        _defer.resolve();
      },
      redo: _defer => {
        redoList.forEach(fn => fn());
        _defer.resolve();
      },
    };
  };

  _handle_Scene_SwitchActiveCamera: ICommandSystemHandler<'Scene_SwitchActiveCamera'> = (arg, defer) => {
    if (!this.project.activeScene) throw new Error('没有激活场景');

    const scene = this.project.activeScene;
    const camera = arg?.name && scene.getCameraByName(arg.name);

    if (!camera) throw new Error('target camera not found');
    if (scene.activeCamera?.name === camera.name) throw new Error('当前相机已经是活动相机');

    if (!defer) return;

    scene.switchActiveCamera(camera);
    defer.resolve();
  };

  get pendingDefer() {
    return this._pendingQueue[0];
  }

  execute = <C extends keyof IXRCommand>(
    command: C,
    arg?: string | IXRCommand[C],
    opt: ICommandExecuteOption = {}
  ): Deferred<void> => {
    this._cmdId += 1;

    const defer = new Deferred<void>(opt.deferName || `${command}_${this._cmdId}`);
    if (opt.deferTitle) defer.title = opt.deferTitle;

    // 如果 skipIfDisabled 为 true, 并且命令不可用, 则直接 resolve
    if (opt.skipIfDisabled && !this.isEnabled(command, arg)) {
      defer.resolve();
      return defer;
    }

    this._pendingQueue.push({ cmdId: this._cmdId, defer, command, arg, opt });

    // 如果当前没有执行中的命令, 则执行第一个: 启动队列
    if (!this._isSeqRunning) this._executePending();

    return defer;
  };

  private _executePending = () => {
    // 取出第一个并执行
    const item = this._pendingQueue.shift();
    if (!item) {
      this._isSeqRunning = false;
      return;
    }

    this._isSeqRunning = true; // 标记为执行中
    const { cmdId, defer, command, arg, opt = {} } = item;

    // 执行下一个, 用 requestAnimationFrame 避免堆栈溢出
    const _callNext = () => requestAnimationFrame(() => this._executePending());

    try {
      this.event.emit('execute:beforeInvoke', { defer });
      this._logger.info('[%s] invoke: %s -- %s', cmdId, command, typeof arg === 'string' ? arg : JSON.stringify(arg));

      defer.ret
        .then(() => {
          this.event.emit('execute:afterInvoke', { defer });
          _callNext();
        })
        .catch(err => {
          this._logger.error('[%s] AsyncError: %s', cmdId, err);
          this.event.emit('execute:afterError', { err: err as any });
          _callNext();
          throw err;
        });

      const handler = (this as any)[`_handle_${command}`];
      if (!handler) throw new Error('missing command: ' + command);

      const argData = arg ? (typeof arg === 'string' ? JSON.parse(arg) : arg) : undefined;
      const _his = handler(argData as any, defer);

      // 记录操作历史
      if (_his) {
        // 清空
        if (this._currentHistoryIdx < this._history.length - 1) {
          this._history = this._history.slice(0, this._currentHistoryIdx + 1);
        }

        // 当前状态的 .next 要指向当前命令提供的 redo
        this._history[this._currentHistoryIdx].next = _his.redo;
        this._history.push(this._genHisItem(_his.undo));

        // history 限制条数
        if (this._history.length > 50) this._history.length = 50;

        this._currentHistoryIdx = this._history.length - 1;
      }
    } catch (err) {
      this._logger.error('[%s] %s', this._cmdId, err);
      defer.reject(err);
      this.event.emit('execute:afterError', { err: err as any });

      _callNext();
    }
  };

  messageIfDisabled = <C extends keyof IXRCommand>(command: C, arg?: string | IXRCommand[C]): string | undefined => {
    try {
      const argData = arg ? (typeof arg === 'string' ? (JSON.parse(arg) as IXRCommand[C]) : arg) : undefined;

      const handler = this[`_handle_${command}`];
      if (!handler) throw new Error('missing command: ' + command);

      handler(argData as any);

      return undefined;
    } catch (err) {
      const msg = (err as any).message || err + '';
      this._logger.info('CheckEnable: %s is disabled => %s', command, msg);

      return msg;
    }
  };

  isEnabled = <C extends keyof IXRCommand>(command: C, arg?: string | IXRCommand[C]): boolean => {
    return !this.messageIfDisabled(command, arg);
  };

  private _genHisItem(back?: (defer: Deferred<void>) => any): IHistoryItem {
    return { key: getInternalRandomString(), t: new Date().valueOf(), back };
  }
}
