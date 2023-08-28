import { IFlowNodeMeta, IFlowNodeTypeRegisterData } from 'ah-flow-node';
import { PBRComposerModel } from '../ViewModel/PBRComposerModel';
import { dataUrl2Blob } from 'xr-impl-bjs';

declare module 'ah-flow-node' {
  interface IFlowNodeMetaMap {
    EdittimePBRComposerConnectNode: IFlowNodeMeta<
      'EdittimePBRComposerConnectNode',
      {
        composer: 'String';
      },
      {
        configKey: 'String';
      }
    >;
  }
}

export const EdittimePBRComposerConnectNodeRegisterData: IFlowNodeTypeRegisterData<'EdittimePBRComposerConnectNode'> = {
  define: {
    className: 'EdittimePBRComposerConnectNode',
    cnName: '材质工程',
    input: { composer: { title: '合成器', dataType: 'String', hiddenInGraph: true } },
    output: { configKey: { title: '配置 ID', dataType: 'String' } },
  },
  setup(ctx) {
    let composer: PBRComposerModel | undefined;
    let removeListen_afterResultChange: any;

    const handleComposerResultChange = () => {
      if (!composer || !composer.latestResult) return;

      const baseColorBlob = dataUrl2Blob(composer.latestResult.baseColor.canvas.toDataURL('image/png'));
      const metallicBlob = dataUrl2Blob(composer.latestResult.metallic.canvas.toDataURL('image/png'));
      const roughnessBlob = dataUrl2Blob(composer.latestResult.roughness.canvas.toDataURL('image/png'));

      const baseColorTextureURL = URL.createObjectURL(baseColorBlob);
      const metallicTextureURL = URL.createObjectURL(metallicBlob);
      const roughnessTextureURL = URL.createObjectURL(roughnessBlob);

      const configData = { baseColorTextureURL, metallicTextureURL, roughnessTextureURL };
      ctx.output.configKey = URL.createObjectURL(new Blob([JSON.stringify(configData)], { type: 'application/json' }));
    };

    const flush = () => {
      if (!ctx.input.composer) return;

      const composerName = ctx.input.composer;
      composer = ctx.host._edittime.sceneModel.project.pbrComposers.find(p => p.name === composerName);
      if (!composer) return;

      if (removeListen_afterResultChange) removeListen_afterResultChange();
      removeListen_afterResultChange = composer.event.listen('afterCompose', handleComposerResultChange);

      handleComposerResultChange();
    };

    ctx.event.listen('input:change:composer', flush);

    flush();

    return () => {
      if (removeListen_afterResultChange) removeListen_afterResultChange();
    };
  },
};
