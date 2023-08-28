import { Deferred, IXRRuntimeConfig, IXRStageCB } from 'xr-core';
import { BRCUtil, EngineStore, Mesh, NullEngine } from 'xr-impl-bjs/dist/bjs';
import _ from 'lodash';
import { DefaultBizLogger, getInternalRandomString } from '../../common';

export const CommonPrePublishStageCB: IXRStageCB = Deferred.wrapAsyncFn<Parameters<IXRStageCB>, any>(
  async (defer, mfs) => {
    const logger = DefaultBizLogger.extend('CommonPrePublishStage');

    const rtConfig = await mfs.readFileAsJSON<IXRRuntimeConfig>('runtime.json');
    const entryID = rtConfig.scene.entryID || rtConfig.scene.list[0].ID;

    const sceneDesc = rtConfig.scene.list.find(s => s.ID === entryID);
    if (!sceneDesc) return;

    const engine = new NullEngine();
    engine.mfs = mfs;

    const engineID = getInternalRandomString();
    (engine as any).__ID = engineID;

    const scene = BRCUtil.createDefaultScene(engine);

    try {
      for (const nodeDesc of sceneDesc.flowNodes) {
        // 预处理模型
        if (nodeDesc.className === 'AssetContainerNode') {
          if (nodeDesc.inputValues?.url) {
            const modelURL = nodeDesc.inputValues.url;

            logger.info('parsing `%s` input.url: %s', nodeDesc.name, modelURL);

            // 把模型下载下来预解析信息
            const container = await BRCUtil.loadModel(scene, modelURL);

            const rootMesh = container.createRootMesh();
            const bounding = rootMesh.getHierarchyBoundingVectors(true);

            const meshMaterials: { node: string; primitive: number; material?: string }[] = [];
            for (const mesh of container.meshes) {
              if (mesh.name === rootMesh.name) continue;

              if (mesh instanceof Mesh) {
                let node: string;
                let primitive: number;

                if (mesh.name.match(/_primitive\d+$/)) {
                  node = mesh.name.replace(/_primitive\d+$/, '');
                  primitive = parseInt(mesh.name.match(/_primitive(\d+)$/)![1]);
                } else {
                  node = mesh.name;
                  primitive = 0;
                }

                meshMaterials.push({ node, primitive, material: mesh.material?.name });
              }
            }

            const info = {
              bounding: { min: bounding.min.asArray(), max: bounding.max.asArray() },
              meshMaterials,
            };

            nodeDesc.inputValues._meta = info;
          }
        }
      }

      // write back
      await mfs.writeFileAsJSON('runtime.json', rtConfig);
      //
    } catch (err) {
      logger.error('%s', err + '');
      throw err;
    } finally {
      scene.dispose();
      engine.dispose();

      // FIXME: NullEngine 会添加 Instances 两次
      EngineStore.Instances = EngineStore.Instances.filter(d => (d as any).__ID !== engineID);
    }
  }
);
