import { IXREditorConfig, IXREditorPublishData } from '../IXREditorConfig';
import { BaseViewModel } from './BaseViewModel';
import { SceneModel } from './SceneModel';
import { IBuiltinWBKeyItem, WorkbenchModel } from './Workbench/WorkbenchModel';
import { FILE_INDEX_BLOCK_ID, FSUtil, MemoryAdapter, MemoryFS, getMimeByFilename } from 'ah-memory-fs';
import { getInternalRandomString } from '../../common/lib/getInternalRandomString';
import { BizLogger } from '../../common/lib/BizLogger';
import {
  Deferred,
  IXRRuntimeConfig,
  XRLinterRegistry,
  createEngine,
  IXRLintMsgItem,
  XRStageRegistry,
  IEngine,
} from 'xr-core';
import { ProgressHelper } from '../../common/lib/ProgressHelper';
import { collectReferFilePathsInDeep } from '../../common/lib/collectReferFilePathsInDeep';
import { quickXhrDownload } from '../../common/lib/quickXhrDownload';
import { md5 } from 'ah-pure-md5';
import nj from 'nunjucks';
import { DefaultPublishTpl } from '../DefaultPublishTpl';
import _ from 'lodash';
import { GetEventBusDelegateMeta } from '../TypeUtil';
import { ConfigPreset } from '../ConfigPreset';
import { PBRComposerModel } from './PBRComposerModel';
import { compress as ZIPCompress, compress, decompress, formatFileSize, readBlob } from '../../common/lib';
import { ClipboardModel } from './ClipboardModel';
import { CommandSystem } from './CommandSystem';
import { ProjectPerfModel } from './ProjectPerfModel';
import { Engine } from 'xr-impl-bjs/dist/bjs';
import { UserLevelEnum } from '../IUserLevel';
import { browserDownload } from '../../common/lib/browserDownload';
import { WBUtil } from '../../common';

export type XRProjLintData = IXRLintMsgItem[];
export type IViewportConfig = {
  type: 'fixed-ratio' | 'fixed-size' | 'auto';
  fixedRatio?: { ratio: number };
  fixedSize?: { width: number; height: number };
};

export class XRProjectModel extends BaseViewModel<
  {
    beforeSave: Deferred<void>;
    afterSave: null;
    afterViewportChange: {};
    afterViewportResize: {};
    afterUserLevelChange: {};

    beforeReload: null;
    afterReload: null;

    afterLint: null;

    beforePublish: Deferred<IXREditorPublishData>;
    afterPublish: {};
    afterExport: { file: File };

    afterActiveSceneChange: null;
    afterMetaInfoChange: { changed: ('title' | 'poster')[] };

    afterPauseChange: {};

    afterPbrComposerAdd: PBRComposerModel;
  } & GetEventBusDelegateMeta<SceneModel['event'], 'scene:'> &
    GetEventBusDelegateMeta<PBRComposerModel['event'], 'PbrComposer:'> &
    GetEventBusDelegateMeta<ProjectPerfModel['event'], 'performance:'>
> {
  readonly logger = new BizLogger('XR');
  readonly engine = createEngine(this.mfs) as any as Engine & IEngine;

  readonly command = new CommandSystem(this);
  readonly workbench = new WorkbenchModel(this);
  readonly clipboard = new ClipboardModel(this);
  readonly performance = new ProjectPerfModel(this);

  readonly scenes: SceneModel[] = [];
  readonly pbrComposers: PBRComposerModel[] = [];

  projName = '';
  projTitle = '';
  projPoster?: string;

  saving = false;
  reloading = false;
  exporting = false;

  latestLintData?: XRProjLintData;
  latestPublishData?: IXREditorPublishData;

  /* 视口配置 */
  viewport: IViewportConfig = { type: 'auto' };

  /* 用户级别 */
  userLevel = UserLevelEnum.Anonymous;

  private _disposeList: (() => any)[] = [];

  constructor(
    readonly mfs: MemoryFS,
    private runtimeJsURL: string,
    readonly uploadDist: (data: Blob, path: string) => Promise<string>,
    private onRequestUserLevel?: (level: UserLevelEnum) => Promise<any>
  ) {
    super();

    const ob1 = this.engine.onResizeObservable.add(() => {
      this.event.emit('afterViewportResize', {});
    });
    this._disposeList.push(() => {
      if (ob1) ob1.unregisterOnNextCall = true;
    });
  }

  get activeSceneLintErrorCnt() {
    if (!this.activeScene) return 0;
    if (!this.latestLintData) return 0;

    return this.latestLintData.filter(d => d.level === 'error').length;
  }

  get activeSceneID(): string | undefined {
    return this.engine.activeSceneID;
  }

  /** 切换激活场景唯一入口 */
  set activeSceneID(ID: string | undefined) {
    if (this.engine.activeSceneID === ID) return;

    const lastScene = this.activeScene;
    if (lastScene) lastScene.close();

    const toActiveScene = this.scenes.find(s => s.ID === ID && !s.isActive);
    if (!toActiveScene) return;

    toActiveScene.active();

    this.engine.activeSceneID = ID;
    this.event.emit('afterActiveSceneChange', null);
  }

  get activeScene() {
    return this.scenes.find(s => s.ID === this.activeSceneID && s.isActive);
  }

  get pause() {
    return !!this.engine.pause;
  }

  set pause(p: boolean) {
    if (this.pause === p) return;
    this.engine.pause = p;

    this.event.emit('afterPauseChange', {});
  }

  async isEmpty() {
    const configExist = await this.mfs.exists('editor.json');
    return !configExist;
  }

  setMetaInfo(p: { title?: string; poster?: string }) {
    const changed: ('title' | 'poster')[] = [];

    if (typeof p.title !== 'undefined') {
      this.projTitle = p.title;
      changed.push('title');
    }
    if (typeof p.poster !== 'undefined') {
      this.projPoster = p.poster;
      changed.push('poster');
    }

    this.event.emit('afterMetaInfoChange', { changed });
  }

  createScene = Deferred.wrapAsyncFn<[string], SceneModel>(async (ctx, ID: string = getInternalRandomString(true)) => {
    // 从内置项目模板初始化新场景
    const rt = ConfigPreset('default').scene.list[0];
    rt.ID = ID;
    rt.title = '新场景_' + ID;

    const scene = new SceneModel(this, { rt, ed: {} });
    this.activeSceneID = scene.ID;

    return scene;
  });

  removeScene = Deferred.wrapAsyncFn<[string], void>(async (ctx, ID: string) => {
    const sm = this.scenes.find(s => s.ID === ID);
    if (!sm) return;

    sm.dispose();

    // 切换到第一个场景
    const nextScene = this.scenes.find(s => s.ID !== ID);
    if (nextScene) this.activeSceneID = nextScene.ID;
  });

  cloneScene = Deferred.wrapAsyncFn<[ID: string, newID: string | undefined], SceneModel>(
    async (ctx, ID: string, newID = getInternalRandomString()) => {
      const sm = this.scenes.find(s => s.ID === ID);
      if (!sm) throw new Error('scene not found: ' + ID);

      sm.doStashIfNeeded();
      const newStore = _.cloneDeep(sm.store);

      newStore.rt.ID = newID;
      newStore.rt.title += '_复制';

      const scene = new SceneModel(this, newStore);
      this.activeSceneID = scene.ID;

      return scene;
    }
  );

  import = Deferred.wrapAsyncFn<[blob: Blob], void>(async (defer, blob) => {
    const ph = ProgressHelper.create(defer.setProgress, 'decompress', 'write');

    const files = await decompress(blob, ph.decompress);
    const list = await Promise.all(files.map(async f => ({ data: await readBlob(f, 'ArrayBuffer'), path: f.name })));

    await FSUtil.quickWriteFiles(this.mfs, list, ph.write);
    await this.reload();

    defer.resolve();
  });

  export = Deferred.wrapAsyncFn<[], File>(async defer => {
    const allPaths = await this.mfs.glob('**/*');
    const files: File[] = [];

    const ph = ProgressHelper.create(defer.setProgress, 'read', 'compress');

    for (let i = 0; i < allPaths.length; i++) {
      const path = allPaths[i];
      const buf = await this.mfs.readFile(path);
      const file = new File([buf], path);
      files.push(file);

      ph.read((i + 1) / allPaths.length);
    }

    const zipFile = await compress(files, `${this.projTitle}_${getInternalRandomString(true)}.zip`, ph.compress);
    this.event.emit('afterExport', { file: zipFile });

    return zipFile;
  });

  save = Deferred.wrapAsyncFn<[], void>(async defer => {
    this.event.emit('beforeSave', defer);
    this.saving = true;

    const activeScene = this.activeScene;

    // 截图到 snapshot.png
    if (activeScene) {
      const _snap = await activeScene.takeSnapshotExtra();
      const _snapBuf = await _snap.imgBlob.arrayBuffer();
      await this.mfs.writeFile('snapshot.png', _snapBuf);

      // 同时保存到场景的 poster
      const _scenePoster = `file://snapshot_${activeScene.title || activeScene.ID}.png`;
      activeScene.poster = _scenePoster;
      await this.mfs.writeFile(_scenePoster, _snapBuf);
    }

    const config: IXREditorConfig = {
      name: this.projName,
      title: this.projTitle,
      poster: this.projPoster,
      scene: { list: [] },
      editor: { workbench: {}, scene: {} },
    };

    // 序列化 editor
    this.workbench.flushPanelModel();
    config.editor.workbench.wbConfigList = this.workbench.wbConfigList;
    config.editor.workbench.wbConfigIdx = this.workbench.wbConfigIdx;

    config.editor.activeSceneID = this.activeSceneID;
    config.editor.latestPublishData = this.latestPublishData;

    for (const s of this.scenes) {
      s.doStashIfNeeded();

      config.scene.list.push(s.store.rt);
      config.editor.scene[s.ID] = s.store.ed;
    }

    // pbr composer
    config.editor.pbrComposers = this.pbrComposers.map(c => c.save());

    // viewport
    config.editor.viewport = this.viewport;

    console.log('@@@', 'project save ->', config);

    await this.mfs.writeFile('editor.json', JSON.stringify(config), 'utf-8');

    this.saving = false;
    this.event.emit('afterSave', null);
  });

  async reload(config?: IXREditorConfig) {
    this.event.emit('beforeReload', null);
    this.reloading = true;

    if (!config) {
      if (await this.mfs.exists('editor.json')) {
        config = await this.mfs.readFileAsJSON<IXREditorConfig>('editor.json');
      } else {
        config = ConfigPreset('default');
      }
    }

    if (!config) throw new Error('missing config');

    console.log('@@@', 'reload ->', config);

    // restore editor
    this.projName = config.name;
    this.projTitle = config.title || '新项目';
    this.projPoster = config.poster;

    this.latestPublishData = config.editor.latestPublishData;

    // viewport
    if (config.editor.viewport) this.viewport = config.editor.viewport;

    if (config.editor.workbench.wbConfigList) {
      this.workbench.wbConfigList = config.editor.workbench.wbConfigList;
      this.workbench.wbConfigIdx = config.editor.workbench.wbConfigIdx || 0;
    } else if (config.editor.workbench.wbConfig) {
      this.workbench.wbConfigList = [config.editor.workbench.wbConfig];
      this.workbench.wbConfigIdx = 0;
    }

    // patch 模型设计 的工作区
    for (const wbConfig of this.workbench.wbConfigList) {
      if (!wbConfig.sidePanel) {
        wbConfig.sidePanel = {
          width: 400,
          activeIdx: -1,
          list: [
            { layout: WBUtil.createComponent('FileExplorer') },
            { layout: WBUtil.createComponent('PerformanceAnalyzer') },
          ],
        };
      }

      const wKey = wbConfig.key as IBuiltinWBKeyItem;
      if (wKey === 'ModelDesign' || wKey === 'AnimationDesign' || wKey === 'LogicDesign' || wKey === 'Export') {
        wbConfig.hideHeaderWhenSingleComponent = true;
        wbConfig.hideHeaderWidget = true;
      }
    }

    // pbr compose
    if (config.editor.pbrComposers) {
      for (const _pc of config.editor.pbrComposers) {
        const composer = new PBRComposerModel(this);
        await composer.restore(_pc);
        this.pbrComposers.push(composer);
      }
    }

    const activeSceneID = config.editor.activeSceneID || config.scene.entryID;

    // restore scene
    for (const sceneItem of config.scene.list) {
      const sm = new SceneModel(this, { rt: sceneItem, ed: config.editor.scene[sceneItem.ID] });

      // patch
      sm.store.rt.flowNodes.forEach(nodeDesc => {
        if (nodeDesc.inputValues?.__edittimeData?.stashedEnabledValue) {
          nodeDesc.enabled = true;
        }
      });
    }

    // set activeSceneID 有副作用，要放到 restore scene 完成后
    this.activeSceneID = activeSceneID;

    this.reloading = false;
    this.event.emit('afterReload', null);

    // do background lint
    this.lint();
  }

  lint = Deferred.wrapAsyncFn<[], XRProjLintData>(async _defer => {
    const types = XRLinterRegistry.Default.getAllTypes();
    const ret: XRProjLintData = [];

    const scene = this.activeScene;
    if (!scene || !scene.rootFlowHost) throw new Error('no active scene');

    for (const type of types) {
      const linter = XRLinterRegistry.Default.get(type);
      if (!linter) continue;

      this.logger.info('lint: %s.%s', scene.title || scene.ID, type);
      const data = await linter(scene.rootFlowHost).ret;

      this.logger.info(
        'lint: %s => %s errors, %s warnings',
        scene.title || scene.ID,
        data.filter(d => d.level === 'error').length,
        data.filter(d => d.level === 'warning').length
      );

      ret.push(...data);
    }

    this.latestLintData = ret;
    this.event.emit('afterLint', null);

    return ret;
  });

  lazyLint = _.debounce(() => this.lint(), 1000);

  /** 获取发布用的数据 */
  getPublishData = Deferred.wrapAsyncFn<[], { rtConfig: IXRRuntimeConfig; mfs: MemoryFS }>(async defer => {
    const _logger = this.logger.extend('ComposePublishData');
    const _pgh = new ProgressHelper(defer.setProgress).splitAvg('copy', 'beforePublishStage');

    const entryScene = this.activeScene;
    if (!entryScene) throw new Error('no active scene');

    // 开始 lint
    const lintData = await this.lint().ret;
    const hasLintError = lintData.some(d => d.level === 'error');
    if (hasLintError) throw new Error('发布校验失败');

    // 构造临时 mfs, 用于存放发布用的文件
    const mfs = await MemoryFS.create(() => MemoryAdapter.empty());

    // 构造 rtConfig
    const rtConfig: IXRRuntimeConfig = { name: this.projName, scene: { list: [] } };

    rtConfig.scene.entryID = entryScene.ID || this.scenes[0].ID;
    rtConfig.title = entryScene.title || this.projTitle;

    rtConfig.poster = entryScene.poster || this.projPoster;

    for (const scene of this.scenes) {
      scene.doStashIfNeeded();
      rtConfig.scene.list.push({ ...scene.store.rt });
    }

    // 收集所有引用的文件
    const relPaths = await collectReferFilePathsInDeep(this.mfs, { type: 'json', data: rtConfig });
    _logger.info('get relative paths: [%s]', relPaths.join(';'));

    // 写入新 mfs
    await mfs.writeFileAsJSON('runtime.json', rtConfig);
    await FSUtil.copyTo(this.mfs, mfs, relPaths, _pgh.copy);

    // 执行 xr stage
    const stageItems = XRStageRegistry.Default.getAll().filter(d => d.stage === 'beforePublish');
    for (let i = 0; i < stageItems.length; i++) {
      const item = stageItems[i];
      _logger.info('call stage: %s.%s', item.stage, item.platform);

      await item.cb(mfs).ret;
      _pgh.beforePublishStage((i + 1) / stageItems.length);
    }

    return { rtConfig, mfs };
  });

  publish = Deferred.wrapAsyncFn<[extraTplData?: any], IXREditorPublishData>(async (defer, extraTplData) => {
    const _pgh = new ProgressHelper(defer.setProgress).splitAvg('save', 'treeShaking', 'upload');

    this.event.emit('beforePublish', defer);

    // 先保存一下
    await this.save().ret;
    _pgh.save(1);

    const { rtConfig, mfs } = await this.getPublishData().ret;

    // 上传 CDN
    const uploadedUrls: string[] = [];
    const pathsToDump = await mfs.glob('**/*');

    const dumpInfo = await FSUtil.dumpAndReduceDriverBlocks(mfs, pathsToDump, _pgh.treeShaking);
    let mfsInfo: { url: string; indexKey: string } | undefined;
    let posterURL: string = rtConfig.poster || '';

    for (const chunk of _.chunk(dumpInfo.blocks, 6)) {
      await Promise.all(
        chunk.map(async block => {
          let mine = 'application/bin';

          // 从 sourcemap 中找到对应的 mime
          for (const sm of dumpInfo.sourcemap) {
            if (sm.blockKey === block.key) {
              const _mine = getMimeByFilename(sm.path);
              if (_mine) {
                mine = _mine;
                break;
              }
            }
          }

          const blob = new Blob([block.data], { type: mine });
          const _u = await this.uploadDist(blob, block.key);

          const sourcePaths = dumpInfo.sourcemap.filter(s => s.blockKey === block.key).map(s => s.path);
          this.logger.info(
            '[publish] upload: <%s> %s %s => %s',
            block.key,
            formatFileSize(block.size),
            sourcePaths.length ? sourcePaths.join(',') : 'NO_SOURCE',
            _u
          );

          uploadedUrls.push(_u);
          _pgh.upload(uploadedUrls.length / pathsToDump.length);

          // 记录 indexKey
          if (dumpInfo.fileIndexKey === block.key) {
            mfsInfo = {
              url: _u.split('/').slice(0, -1).join('/'),
              indexKey: block.key,
            };
          }

          // 记录 Poster
          if (sourcePaths.some(p => p === rtConfig.poster || 'file://' + p === rtConfig.poster)) posterURL = _u;
        })
      );
    }

    if (!mfsInfo) throw new Error('missing mfsInfo');

    // 构造入口 html
    const entryInfo = await buildPublishEntryIndexHTML(
      this.runtimeJsURL,
      mfsInfo.url,
      mfsInfo.indexKey,
      rtConfig.title || this.projTitle,
      posterURL || '',
      extraTplData
    );

    // 把 entryInfo 的 mfs 上传 CDN
    let indexEntryURL: string = '';

    for (const path of await entryInfo.mfs.glob('**/*')) {
      const buf = await entryInfo.mfs.readFile(path);
      const blob = new Blob([buf], { type: getMimeByFilename(path) });

      const _u = await this.uploadDist(blob, path);
      if (path === entryInfo.entryPath) indexEntryURL = _u;
    }

    if (!indexEntryURL) throw new Error('missing indexEntryURL');

    this.latestPublishData = {
      timestamp: new Date().valueOf(),
      indexEntryURL,
      rtConfig,
      mfs: mfsInfo,
    };

    this.event.emit('afterPublish', {});

    return this.latestPublishData!;
  });

  // 发布到本地, 生成 zip
  publishToLocal = Deferred.wrapAsyncFn<[extraTplData?: any], any>(async (defer, extraTplData) => {
    const _pgh = new ProgressHelper(defer.setProgress).splitAvg('save', 'treeShaking', 'compress');

    // 先保存一下
    await this.save().ret;
    _pgh.save(1);

    const { mfs, rtConfig } = await this.getPublishData().ret;

    const paths = await mfs.glob('**/*');
    const files: File[] = [];

    const dumpInfo = await FSUtil.dumpAndReduceDriverBlocks(mfs, paths, _pgh.treeShaking);

    // 记录文件块
    for (const block of dumpInfo.blocks) {
      files.push(new File([block.data], block.key));
    }

    // 从 sourcemap 中找到 poster 对应的 blockKey，作为相对路径
    const poster = rtConfig.poster
      ? dumpInfo.sourcemap.find(s => 'file://' + s.path === rtConfig.poster)?.blockKey || rtConfig.poster
      : undefined;

    // 构造入口 html
    const entryInfo = await buildPublishEntryIndexHTML(
      this.runtimeJsURL,
      '',
      dumpInfo.fileIndexKey,
      rtConfig.title || this.projTitle,
      poster || '',
      extraTplData
    );

    // 记录入口文件
    for (const path of await entryInfo.mfs.glob('**/*')) {
      const buf = await entryInfo.mfs.readFile(path);
      files.push(new File([buf], path));

      // 重写 index.html
      if (path === entryInfo.entryPath) files.push(new File([buf], 'index.html'));
    }

    const zipFile = await compress(files, `${this.projTitle}_${getInternalRandomString(true)}.zip`, _pgh.compress);
    browserDownload(zipFile);
  });

  exportFile = Deferred.wrapAsyncFn<[string[]], void>(async (ctx, filepaths) => {
    const firstStats = await this.mfs.stats(filepaths[0]);
    if (!firstStats) throw new Error('没有文件: ' + filepaths[0]);

    let toDownloadFile: File;

    const isSingleFile = filepaths.length === 1 && !firstStats.isDir;

    //单个下载
    if (isSingleFile) {
      const buf = await this.mfs.readFile(filepaths[0]);
      toDownloadFile = new File([buf], filepaths[0], { type: getMimeByFilename(filepaths[0]) });
    } else {
      const allPathList: string[] = [];

      for (const _filepath of filepaths) {
        const stats = await this.mfs.stats(_filepath);
        if (!stats) continue;

        if (stats.isDir) {
          const _subPaths = await this.mfs.glob(`${_filepath}/**/*`);
          allPathList.push(..._subPaths);
        } else {
          allPathList.push(_filepath);
        }
      }

      const bufFile: File[] = [];
      for (const _path of allPathList) {
        const buf = await this.mfs.readFile(_path);
        bufFile.push(new File([buf], _path, { type: getMimeByFilename(_path) }));
      }
      toDownloadFile = await ZIPCompress(bufFile, 'download.zip');
    }

    browserDownload(toDownloadFile);
  });

  createPbrComposer() {
    const c = new PBRComposerModel(this);
    c.addSlot(getInternalRandomString(true)); // 默认添加一个槽

    this.pbrComposers.push(c);
    this.event.emit('afterPbrComposerAdd', c);
  }

  setViewport(vp: Partial<IViewportConfig>) {
    this.viewport = { ...this.viewport, ...vp };
    this.event.emit('afterViewportChange', {});
  }

  // 评估视口, 返回实际的渲染尺寸
  evaluateViewport(clientWidth: number, clientHeight: number): { width: number; height: number } {
    const _sLevel = this.engine.getHardwareScalingLevel();

    if (this.viewport.type === 'fixed-size') {
      // 只有固定尺寸情况下，不需要应用缩放
      return {
        width: this.viewport.fixedSize?.width || clientWidth,
        height: this.viewport.fixedSize?.height || clientHeight,
      };
    }
    //
    else if (this.viewport.type === 'fixed-ratio') {
      const ratio = this.viewport.fixedRatio?.ratio || 1;
      const width = clientWidth;
      const height = clientWidth / ratio;

      // 宽度不变, 高度不超过
      if (height <= clientHeight) return { width: width / _sLevel, height: height / _sLevel };

      return { width: (clientHeight * ratio) / _sLevel, height: clientHeight / _sLevel };
    }

    return { width: clientWidth / _sLevel, height: clientHeight / _sLevel };
  }

  // 获取渲染画布的尺寸
  getRenderingCanvasSize() {
    const canvasEle = this.engine.getRenderingCanvas();
    if (!canvasEle) throw new Error('missing canvas');

    const width = canvasEle.width;
    const height = canvasEle.height;

    const scalingLevel = this.engine.getHardwareScalingLevel();
    const clientWidth = width * scalingLevel;
    const clientHeight = height * scalingLevel;

    return { clientHeight, clientWidth, width, height };
  }

  /** 设置用户级别 */
  setUserLevel(level: UserLevelEnum) {
    if (this.userLevel === level) return;

    this.userLevel = level;
    this.event.emit('afterUserLevelChange', {});
  }

  /** 请求用户级别 */
  async requestUserLevel(level: UserLevelEnum) {
    if (this.userLevel >= level || !this.onRequestUserLevel) return;

    try {
      this.logger.info('Request user level: %s', level);

      await this.onRequestUserLevel(level);
      this.setUserLevel(level);
    } catch (err) {
      console.error(err);
      this.logger.error('requestUserLevel error: %s', (err as any).message);
    }
  }

  dispose() {
    super.dispose();

    this._disposeList.forEach(d => d());
    this._disposeList = [];

    this.pbrComposers.forEach(pc => pc.dispose());
    this.scenes.forEach(s => s.dispose());
    this.engine.dispose();
    this.performance.dispose();
  }
}

async function buildPublishEntryIndexHTML(
  runtimeJsURL: string,
  mfsURL: string,
  mfsFileIndexKey: string,
  title: string,
  poster: string,
  extraTplData: any
) {
  const mfs = await MemoryFS.create(() => MemoryAdapter.empty());

  // 构造 js 入口
  let entryJsURL: string;

  if (runtimeJsURL.startsWith('https://')) {
    entryJsURL = runtimeJsURL;
  } else {
    // 保存 js
    const jsString = await quickXhrDownload<string>(runtimeJsURL, 'text');
    const jsMd5 = md5(jsString);
    entryJsURL = `app.${jsMd5}.js`;
    await mfs.writeFile(entryJsURL, jsString, 'utf-8');
  }

  // 构造 html 入口
  const entryHTML = nj.renderString(DefaultPublishTpl, {
    ctx: {
      mfsURL,
      mfsFileIndexKey,
      entryJsURL,
      title: title || '真的科技想象力宇宙',
      poster: poster || '',
      publishTimestamp: new Date().valueOf(),
      ...extraTplData,
    },
  });

  const entryPath = md5(entryHTML) + '.html';
  await mfs.writeFile(entryPath, entryHTML, 'utf-8');

  return { mfs, entryPath };
}
