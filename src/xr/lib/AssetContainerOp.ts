import {
  IAssetContainerInitConfig,
  IAssetContainerInitConfig_MaterialModify,
  IAssetContainerInitConfig_TextureModify,
} from 'xr-core';
import { AssetContainer, PBRMaterial, Texture, updateMaterial, updateTexture } from 'xr-impl-bjs/dist/bjs';
import { IFlowNode } from 'ah-flow-node';

export type AssetContainerOpAction =
  | { type: 'TextureAdd'; textureName: string }
  | { type: 'TextureRemove'; textureName: string }
  | {
      type: 'TextureUpdate';
      textureName: string;
      data: IAssetContainerInitConfig_TextureModify;
    }
  // for material
  | { type: 'MaterialAdd'; materialName: string }
  | { type: 'MaterialRemove'; materialName: string }
  | {
      type: 'MaterialUpdate';
      materialName: string;
      data: IAssetContainerInitConfig_MaterialModify;
    };

export function doAssetContainerOp(node: IFlowNode<'AssetContainerNode'>, action: AssetContainerOpAction) {
  if (!node.output.container) throw new Error('missing node.output.container');

  const _initConfig: IAssetContainerInitConfig = node.input._initConfig || {};
  const container = node.output.container as AssetContainer;

  if (!_initConfig.add) _initConfig.add = {};
  if (!_initConfig.modify) _initConfig.modify = {};

  if (action.type === 'TextureAdd') {
    const tex = new Texture('x', container.scene);
    tex.name = action.textureName;
    container.textures.push(tex);
    container.scene.addTexture(tex);

    if (!_initConfig.add.textures) _initConfig.add.textures = [];
    _initConfig.add.textures.push(action.textureName);
  }
  //
  else if (action.type === 'TextureRemove') {
    const tex = container.textures.find(t => t.name === action.textureName);
    if (!tex) throw new Error('missing texture');

    tex.dispose();
    container.textures.splice(container.textures.indexOf(tex), 1);

    if (_initConfig.add?.textures) {
      _initConfig.add.textures.splice(_initConfig.add.textures.indexOf(action.textureName), 1);
    }
  }
  //
  else if (action.type === 'TextureUpdate') {
    const tex = container.textures.find(t => t.name === action.textureName);
    if (!tex || !(tex instanceof Texture)) throw new Error('missing texture');

    updateTexture(node.host, container, tex, action.data);

    if (!_initConfig.modify.texture) _initConfig.modify.texture = {};
    _initConfig.modify.texture[action.textureName] = {
      ..._initConfig.modify.texture[action.textureName],
      ...action.data,
    };
  }
  //
  else if (action.type === 'MaterialAdd') {
    const mat = new PBRMaterial(action.materialName, container.scene);
    container.materials.push(mat);
    container.scene.addMaterial(mat);

    if (!_initConfig.add.materials) _initConfig.add.materials = [];
    _initConfig.add.materials.push(action.materialName);
  }
  //
  else if (action.type === 'MaterialRemove') {
    const mat = container.materials.find(t => t.name === action.materialName);
    if (!mat) throw new Error('missing material');

    mat.dispose();
    container.materials.splice(container.materials.indexOf(mat), 1);

    if (_initConfig.add?.materials) {
      _initConfig.add.materials.splice(_initConfig.add.materials.indexOf(action.materialName), 1);
    }
  }
  //
  else if (action.type === 'MaterialUpdate') {
    const _mat = container.materials.find(t => t.name === action.materialName);
    if (!_mat || !(_mat instanceof PBRMaterial)) throw new Error('missing material');

    const _matCfg = action.data;
    updateMaterial(container, _mat, _matCfg);

    if (!_initConfig.modify.material) _initConfig.modify.material = {};
    _initConfig.modify.material[action.materialName] = {
      ..._initConfig.modify.material[action.materialName],
      ...action.data,
    };
  }

  node.setInput('_initConfig', _initConfig);
}
