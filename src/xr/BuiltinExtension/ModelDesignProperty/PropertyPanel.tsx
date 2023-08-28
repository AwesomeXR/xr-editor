import React, { useEffect } from 'react';
import { AssetContainer, BaseTexture, Color3, Mesh, PBRMaterial, Texture } from 'xr-impl-bjs/dist/bjs';
import { Button, Collapse, Space, Typography } from 'antd';
import { InlineCell, getInternalRandomString, useForceUpdate, useListen } from '../../../common';
import { BizField } from '../../component/BizField';
import { IFlowNode, Util } from 'ah-flow-node';
import { TexturePreview } from '../../component/TexturePreview';
import { ITreeData } from '../../../common/component/LightTree';
import { IAssetContainerInitConfig_MaterialModify, IAssetContainerInitConfig_TextureModify } from 'xr-core';
import { AimOutlined, ApiOutlined, BarsOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { ModelDesignPropertyModel } from './ModelDesignPropertyModel';
import { ITreeDataPayload } from '../../ViewModel/Scene/ModelDesignModel';
import { AnimationTimelineViewer } from './AnimationTimelineViewer';
import { doAssetContainerOp } from '../../lib/AssetContainerOp';
import { HighlightPopover } from '../../../common/component/HighlightPopover';
import { BizList, IBizListItem } from '../../../common/component/BizList';

export interface IPropertyPanelProps {
  className?: string;
  style?: React.CSSProperties;

  model: ModelDesignPropertyModel;
  activeNode?: ITreeData;
}

export const PropertyPanel = ({ className, style, model, activeNode }: IPropertyPanelProps) => {
  if (!activeNode) return null;

  const renderInner = () => {
    const payload = activeNode.data.payload as ITreeDataPayload;
    if (!payload) return null;

    if (payload.isFlowNodeRoot && payload.flowNode && Util.isFlowNode('AssetContainerNode', payload.flowNode)) {
      return <PropertyPanel.Model activeNode={activeNode} model={model} flowNode={payload.flowNode} />;
    }

    if (payload.material instanceof PBRMaterial && payload.containerNode) {
      return (
        <PropertyPanel.PBRMaterial
          activeNode={activeNode}
          model={model}
          target={payload.material}
          containerNode={payload.containerNode}
        />
      );
    }

    if (payload.texture instanceof Texture && payload.containerNode) {
      return (
        <PropertyPanel.Texture
          activeNode={activeNode}
          model={model}
          target={payload.texture}
          containerNode={payload.containerNode}
        />
      );
    }

    if (payload.node instanceof Mesh && payload.containerNode) {
      return (
        <PropertyPanel.Mesh
          activeNode={activeNode}
          model={model}
          target={payload.node}
          containerNode={payload.containerNode}
        />
      );
    }

    if (payload.isAnimationGroupCollection && payload.containerNode) {
      return (
        <PropertyPanel.AnimationGroupCollection
          model={model}
          activeNode={activeNode}
          containerNode={payload.containerNode}
        />
      );
    }

    if (payload.flowNode && Util.isFlowNode('DirectionalLightNode', payload.flowNode)) {
      return <PropertyPanel.DirectionLight model={model} activeNode={activeNode} flowNode={payload.flowNode} />;
    }

    return null;
  };

  return (
    <div data-name='PropertyPanel' className={className} style={style} key={activeNode.id}>
      {renderInner()}
    </div>
  );
};

PropertyPanel.PBRMaterial = ({
  className,
  style,
  model,
  containerNode,
  target,
}: IPropertyPanelProps & { containerNode: IFlowNode<'AssetContainerNode'>; target: PBRMaterial }) => {
  const modelDesign = model.modelDesign;
  if (!modelDesign) return null;

  const updateProperty = (data: IAssetContainerInitConfig_MaterialModify, isStash?: boolean) => {
    if (isStash) {
      doAssetContainerOp(containerNode, { type: 'MaterialUpdate', materialName: target.name, data });
      return;
    }

    model.project.command.execute(
      'AssetContainer_Op',
      {
        ID: containerNode.ID,
        action: { type: 'MaterialUpdate', materialName: target.name, data },
      },
      { skipIfDisabled: true }
    );
  };

  const createAndBindTexture = (prop: string, label: string) => {
    const newTexName = `${label}_${getInternalRandomString(true)}`;
    model.project.command
      .execute(
        'AssetContainer_Op',
        {
          ID: containerNode.ID,
          action: { type: 'TextureAdd', textureName: newTexName },
        },
        { skipIfDisabled: true }
      )
      .ret.then(() => {
        updateProperty({ [prop]: newTexName });

        modelDesign.reloadOutline();
        modelDesign.navTo(modelDesign.calcOutlineID('__AssetContainer', containerNode.ID, 'Texture', newTexName));
      });
  };

  const renderTextureItem = (
    prop: keyof IAssetContainerInitConfig_MaterialModify,
    label: string,
    tex: BaseTexture | null
  ) => {
    if (!containerNode.output.container) return null;
    const _container = containerNode.output.container as AssetContainer;

    // 新建按钮
    const CreateEle = (
      <Button size='small' title='新建纹理' onClick={() => createAndBindTexture(prop, label)} icon={<PlusOutlined />} />
    );

    // 绑定按钮
    const BindEle = (
      <HighlightPopover
        icon={<BarsOutlined />}
        content={op => {
          return (
            <BizList
              items={_container.textures.map(t => {
                const _preview = model.modelDesign?.getOutlineTexturePreviewURL(containerNode.ID, t.name);

                return {
                  title: t.name,
                  active: tex?.name === t.name,
                  icon: _preview ? <img src={_preview} style={{ width: 16, height: 16 }} /> : undefined,
                  onConfirm: () => {
                    updateProperty({ [prop]: t.name });
                    modelDesign.reloadOutline();
                    op.close();
                  },
                } as IBizListItem;
              })}
            />
          );
        }}
      />
    );

    if (!tex) {
      return (
        <Space.Compact size='small' block>
          <Typography.Text type='secondary' ellipsis style={{ flex: 1, width: 1 }}>
            未指定
          </Typography.Text>
          {BindEle}
          {CreateEle}
        </Space.Compact>
      );
    }

    // 跳转按钮
    const JumpEle = (
      <Button
        size='small'
        icon={<AimOutlined />}
        onClick={() => {
          modelDesign.navTo(modelDesign.calcOutlineID('__AssetContainer', containerNode.ID, 'Texture', tex.name));
        }}
      />
    );

    // 解绑按钮
    const UnbindEle = (
      <Button
        size='small'
        icon={<ApiOutlined />}
        onClick={() => {
          updateProperty({ [prop]: null });
          modelDesign.reloadOutline();
        }}
      />
    );

    // 预览按钮
    const PreviewEle = (
      <HighlightPopover
        icon={<EyeOutlined />}
        content={() => <TexturePreview texture={tex} style={{ width: 150 }} />}
      />
    );

    return (
      <div style={{ display: 'flex' }}>
        <Typography.Text ellipsis style={{ flex: 1, width: 1 }} title={tex.name}>
          {tex.name}
        </Typography.Text>

        <Space.Compact size='small' style={{ marginLeft: 4 }}>
          {PreviewEle}
          {JumpEle}
          {UnbindEle}
          {BindEle}
          {CreateEle}
        </Space.Compact>
      </div>
    );
  };

  return (
    <Collapse
      className={className}
      style={style}
      destroyInactivePanel
      defaultActiveKey={[
        'info',
        'transparency',
        'channel',
        'LightingColors',
        'MetallicWorkflow',
        'Subsurface',
        'levels',
        'rendering',
        'ImageProcess',
        'advance',
        'clearCoat',
        'danger',
      ]}
      items={[
        {
          key: 'info',
          label: '基础信息',
          children: (
            <>
              <InlineCell label='名称'>
                <Typography.Text>{target.name}</Typography.Text>
              </InlineCell>
              <InlineCell label='背面剔除' labelAlign='grow'>
                <BizField.BooleanField
                  value={target.backFaceCulling}
                  onChange={v => updateProperty({ backFaceCulling: v })}
                />
              </InlineCell>
              <InlineCell label='忽略深度写入' labelAlign='grow'>
                <BizField.BooleanField
                  value={target.disableDepthWrite}
                  onChange={v => updateProperty({ disableDepthWrite: v })}
                />
              </InlineCell>
              <InlineCell label='线框模式' labelAlign='grow'>
                <BizField.BooleanField value={target.wireframe} onChange={v => updateProperty({ wireframe: v })} />
              </InlineCell>
            </>
          ),
        },
        {
          key: 'transparency',
          label: '透明',
          children: (
            <>
              <InlineCell label='Alpha'>
                <BizField.SliderField
                  value={target.alpha}
                  onChange={(v, complete) => updateProperty({ alpha: v }, !complete)}
                />
              </InlineCell>
              <InlineCell label='透明模式'>
                <BizField.SelectField
                  value={target.transparencyMode + ''}
                  onChange={v => updateProperty({ transparencyMode: +v })}
                  options={[
                    { label: '不透明', value: PBRMaterial.PBRMATERIAL_OPAQUE + '' },
                    { label: '测试', value: PBRMaterial.PBRMATERIAL_ALPHATEST + '' },
                    { label: '混合', value: PBRMaterial.PBRMATERIAL_ALPHABLEND + '' },
                    {
                      label: '混合+测试',
                      value: PBRMaterial.PBRMATERIAL_ALPHATESTANDBLEND + '',
                    },
                  ]}
                />
              </InlineCell>
              <InlineCell label='使用贴图透明通道' labelAlign='grow'>
                <BizField.BooleanField
                  value={target.useAlphaFromAlbedoTexture}
                  onChange={v => updateProperty({ useAlphaFromAlbedoTexture: v })}
                />
              </InlineCell>
              <InlineCell
                label='分离裁剪处理'
                labelAlign='grow'
                help='在计算机图形中，culling（舍弃）是一种通过排除不可见的物体或面片来提高渲染性能的技术。而 Separate culling pass（分离裁剪处理）是其中一种具体的实现方法。在分离裁剪处理中，图形引擎将渲染过程分为两个步骤：裁剪处理和渲染处理。首先，裁剪处理阶段通过计算摄像机视锥体（frustum）与场景中的物体或面片的相交关系，来决定哪些物体或面片是可见的。这个阶段通常在裁剪空间（Clipping Space）或裁剪后空间（Opengl设计的剔除裁剪部分）中进行。根据裁剪处理的结果，渲染处理阶段只处理可见的物体或面片。这个阶段通常在世界空间（World Space）或相机空间（Camera Space）中进行。在这个阶段，图形引擎会进行各种光照、纹理映射、深度测试等计算，最终生成最终的图像。通过将裁剪处理和渲染处理分离，分离裁剪处理可以减少不必要的渲染计算和内存访问，从而提高渲染性能。这种方法适用于具有大量几何体或面片的场景，特别是在传统的渲染管线中。然而，在现代的图形 API（如DirectX 12和Vulkan）中，分离裁剪处理的优势已经大大减少，因为这些 API 允许更大程度上的并行处理和自定义渲染流水线。'
              >
                <BizField.BooleanField
                  value={target.separateCullingPass}
                  onChange={v => updateProperty({ separateCullingPass: v })}
                />
              </InlineCell>
            </>
          ),
        },
        {
          key: 'channel',
          label: '纹理通道',
          children: (
            <>
              <InlineCell label='漫射'>
                {renderTextureItem('baseColorTexture', '漫射', target.albedoTexture)}
              </InlineCell>
              <InlineCell label='AO'>{renderTextureItem('occlusionTexture', 'AO', target.ambientTexture)}</InlineCell>
              <InlineCell label='自发光'>
                {renderTextureItem('emissiveTexture', '自发光', target.emissiveTexture)}
              </InlineCell>
              <InlineCell label='金属流'>
                {renderTextureItem('metallicRoughnessTexture', '金属流', target.metallicTexture)}
              </InlineCell>
              <InlineCell label='法线'>{renderTextureItem('normalTexture', '法线', target.bumpTexture)}</InlineCell>
              <InlineCell label='反射'>
                {renderTextureItem('reflectionTexture', '反射', target.reflectionTexture)}
              </InlineCell>
              <InlineCell label='折射'>
                {renderTextureItem('refractionTexture', '折射', target.refractionTexture)}
              </InlineCell>
            </>
          ),
        },
        {
          key: 'LightingColors',
          label: '颜色',
          children: (
            <>
              <InlineCell label='漫射' labelAlign='grow'>
                <BizField.ColorHexField
                  value={target.albedoColor?.toGammaSpace().asArray()}
                  onChange={v => updateProperty({ baseColor: Color3.FromArray(v).toLinearSpace().asArray() })}
                />
              </InlineCell>
              <InlineCell label='反射' labelAlign='grow'>
                <BizField.ColorHexField
                  value={target.reflectivityColor?.toGammaSpace().asArray()}
                  onChange={v => updateProperty({ reflectivityColor: Color3.FromArray(v).toLinearSpace().asArray() })}
                />
              </InlineCell>
              <InlineCell label='自发光' labelAlign='grow'>
                <BizField.ColorHexField
                  value={target.emissiveColor?.toGammaSpace().asArray()}
                  onChange={v => updateProperty({ emissiveColor: Color3.FromArray(v).toLinearSpace().asArray() })}
                />
              </InlineCell>
              <InlineCell label='氛围' labelAlign='grow'>
                <BizField.ColorHexField
                  value={target.ambientColor?.toGammaSpace().asArray()}
                  onChange={v => updateProperty({ ambientColor: Color3.FromArray(v).toLinearSpace().asArray() })}
                />
              </InlineCell>
              <InlineCell
                label='物理光衰减'
                labelAlign='grow'
                help='物理光衰减是指光线在传播过程中逐渐减弱的现象，与真实世界中的光线传播行为相似。在渲染中，物理光衰减会影响光线的强度和彩色分布。
  当usePhysicalLightFalloff为true时，渲染器将根据物理光衰减的规则计算光线的强度和彩色分布。这种方法可以产生更加真实的光照效果，尤其是在远距离或高强度光源的情况下。
  当usePhysicalLightFalloff为false时，渲染器将使用简化的光衰减模型，不考虑物理光衰减的规则。这种方法可能会更加快速和简单，但可能无法产生真实的光照效果。
  需要注意的是，使用物理光衰减可能会增加渲染时间和计算复杂度，特别是在有大量光源或复杂场景的情况下。因此，根据需要权衡使用物理光衰减的优势和成本。'
              >
                <BizField.BooleanField
                  value={target.usePhysicalLightFalloff}
                  onChange={v => updateProperty({ usePhysicalLightFalloff: v })}
                />
              </InlineCell>
            </>
          ),
        },
        {
          key: 'MetallicWorkflow',
          label: '金属流',
          children: (
            <>
              <InlineCell label='金属度'>
                <BizField.SliderField
                  defaultValue={target.metallic || undefined}
                  onChange={(v, complete) => updateProperty({ metallic: v }, !complete)}
                />
              </InlineCell>
              <InlineCell label='粗糙度'>
                <BizField.SliderField
                  defaultValue={target.roughness || undefined}
                  onChange={(v, complete) => updateProperty({ roughness: v }, !complete)}
                />
              </InlineCell>
              <InlineCell label='折射率'>
                <BizField.SliderField
                  max={3}
                  defaultValue={target.indexOfRefraction || undefined}
                  onChange={(v, complete) => updateProperty({ indexOfRefraction: v }, !complete)}
                />
              </InlineCell>
              <InlineCell label='菲涅尔系数'>
                <BizField.SliderField
                  defaultValue={target.metallicF0Factor || undefined}
                  onChange={(v, complete) => updateProperty({ metallicF0Factor: v }, !complete)}
                />
              </InlineCell>
            </>
          ),
        },
        {
          key: 'Subsurface',
          label: '次表面',
          children: (
            <>
              <InlineCell label='启用'>
                <BizField.BooleanField
                  defaultValue={target.clearCoat.isEnabled}
                  onChange={v => updateProperty({ clearcoatEnabled: v })}
                />
              </InlineCell>
              <InlineCell label='强度'>
                <BizField.SliderField
                  defaultValue={target.clearCoat.intensity}
                  onChange={(v, complete) => updateProperty({ clearcoatIntensity: v }, !complete)}
                />
              </InlineCell>
              <InlineCell label='粗糙度'>
                <BizField.SliderField
                  defaultValue={target.clearCoat.roughness}
                  onChange={(v, complete) => updateProperty({ clearcoatRoughness: v }, !complete)}
                />
              </InlineCell>
            </>
          ),
        },
        {
          key: 'levels',
          label: '强度',
          children: (
            <>
              <InlineCell label='环境'>
                <BizField.SliderField
                  max={2}
                  defaultValue={target.environmentIntensity || undefined}
                  onChange={(v, complete) => updateProperty({ environmentIntensity: v }, !complete)}
                />
              </InlineCell>
              <InlineCell label='自发光'>
                <BizField.SliderField
                  max={2}
                  defaultValue={target.emissiveIntensity || undefined}
                  onChange={(v, complete) => updateProperty({ emissiveIntensity: v }, !complete)}
                />
              </InlineCell>
              <InlineCell label='直接光'>
                <BizField.SliderField
                  max={2}
                  defaultValue={target.directIntensity || undefined}
                  onChange={(v, complete) => updateProperty({ directIntensity: v }, !complete)}
                />
              </InlineCell>
            </>
          ),
        },
        {
          key: 'rendering',
          label: '渲染',
          children: (
            <>
              <InlineCell label='无光照模式' labelAlign='grow'>
                <BizField.BooleanField value={target.unlit} onChange={v => updateProperty({ unlit: v })} />
              </InlineCell>

              <InlineCell label='光亮度覆盖透明度' labelAlign='grow'>
                <BizField.BooleanField
                  value={target.useRadianceOverAlpha}
                  onChange={v => updateProperty({ useRadianceOverAlpha: v })}
                />
              </InlineCell>
              <InlineCell label='镜面反射覆盖透明度' labelAlign='grow'>
                <BizField.BooleanField
                  value={target.useSpecularOverAlpha}
                  onChange={v => updateProperty({ useSpecularOverAlpha: v })}
                />
              </InlineCell>
              <InlineCell label='高光锯齿消除' labelAlign='grow'>
                <BizField.BooleanField
                  value={target.enableSpecularAntiAliasing}
                  onChange={v => updateProperty({ enableSpecularAntiAliasing: v })}
                />
              </InlineCell>
              <InlineCell label='实时过滤' labelAlign='grow'>
                <BizField.BooleanField
                  value={target.realTimeFiltering}
                  onChange={v => updateProperty({ realTimeFiltering: v })}
                />
              </InlineCell>
              <InlineCell label='实时过滤质量' labelAlign='grow'>
                <BizField.NumberField
                  value={target.realTimeFilteringQuality}
                  onChange={v => updateProperty({ realTimeFilteringQuality: v })}
                />
              </InlineCell>
            </>
          ),
        },
        {
          key: 'advance',
          label: '高级',
          children: (
            <>
              <InlineCell label='审查'>
                <BizField.SelectField
                  defaultValue={target.debugMode + ''}
                  onChange={v => updateProperty({ debugMode: +v })}
                  options={[
                    { label: '无', value: 0 },
                    // 几何
                    { label: '归一化位置', value: 1 },
                    { label: '法线', value: 2 },
                    { label: '切线', value: 3 },
                    { label: '副切线', value: 4 },
                    { label: '凹凸法线', value: 5 },
                    { label: '纹理坐标1', value: 6 },
                    { label: '纹理坐标2', value: 7 },
                    { label: '清漆法线', value: 8 },
                    { label: '清漆切线', value: 9 },
                    { label: '清漆副切线', value: 10 },
                    { label: '各向异性法线', value: 11 },
                    { label: '各向异性切线', value: 12 },
                    { label: '各向异性副切线', value: 13 },
                    // 贴图
                    { label: '漫反射贴图', value: 20 },
                    { label: '环境贴图', value: 21 },
                    { label: '不透明度贴图', value: 22 },
                    { label: '自发光贴图', value: 23 },
                    { label: '光照贴图', value: 24 },
                    { label: '金属贴图', value: 25 },
                    { label: '反射率贴图', value: 26 },
                    { label: '清漆贴图', value: 27 },
                    { label: '清漆色调贴图', value: 28 },
                    { label: '光泽贴图', value: 29 },
                    { label: '各向异性贴图', value: 30 },
                    { label: '厚度贴图', value: 31 },
                    // 环境
                    { label: '环境折射', value: 40 },
                    { label: '环境反射', value: 41 },
                    { label: '环境清漆', value: 42 },
                    // 光照
                    { label: '直接漫反射', value: 50 },
                    { label: '直接高光', value: 51 },
                    { label: '直接清漆', value: 52 },
                    { label: '直接光泽', value: 53 },
                    { label: '环境辐射', value: 54 },
                    // 光照参数
                    { label: '表面反射率', value: 60 },
                    { label: '反射率0', value: 61 },
                    { label: '金属度', value: 62 },
                    { label: '金属度F0', value: 71 },
                    { label: '粗糙度', value: 63 },
                    { label: 'AlphaG', value: 64 },
                    { label: 'NdotV', value: 65 },
                    { label: '清漆颜色', value: 66 },
                    { label: '清漆粗糙度', value: 67 },
                    { label: '清漆NdotV', value: 68 },
                    { label: '透射率', value: 69 },
                    { label: '折射透射率', value: 70 },
                    // 杂项
                    { label: 'SEO', value: 80 },
                    { label: 'EHO', value: 81 },
                    { label: '能量因子', value: 82 },
                    { label: '高光反射率', value: 83 },
                    { label: '清漆反射率', value: 84 },
                    { label: '光泽反射率', value: 85 },
                    { label: '亮度/透明度', value: 86 },
                    { label: 'Alpha', value: 87 },
                  ].map(d => ({ ...d, value: d.value + '' }))}
                />
              </InlineCell>
            </>
          ),
        },
      ]}
    ></Collapse>
  );
};

PropertyPanel.Mesh = ({
  className,
  style,
  model,
  containerNode,
  target,
}: IPropertyPanelProps & { containerNode: IFlowNode<'AssetContainerNode'>; target: Mesh }) => {
  const modelDesign = model.modelDesign;
  if (!modelDesign) return null;

  const navToMaterialNode = () => {
    modelDesign.navTo(
      modelDesign.calcOutlineID('__AssetContainer', containerNode.ID, 'Material', target.material!.name)
    );
  };
  return (
    <Collapse
      className={className}
      style={style}
      destroyInactivePanel
      defaultActiveKey={['info']}
      items={[
        {
          key: 'info',
          label: '基本信息',
          children: (
            <>
              <InlineCell label='名称'>
                <Typography.Text>{target.name}</Typography.Text>
              </InlineCell>
              <InlineCell label='材质'>
                {target.material ? (
                  <Button size='small' block onClick={navToMaterialNode}>
                    {target.material.name}
                  </Button>
                ) : (
                  '<没有材质>'
                )}
              </InlineCell>
            </>
          ),
        },
      ]}
    ></Collapse>
  );
};

PropertyPanel.Texture = ({
  className,
  style,
  model,
  containerNode,
  activeNode,
  target,
}: IPropertyPanelProps & { containerNode: IFlowNode<'AssetContainerNode'>; target: Texture }) => {
  const fu = useForceUpdate();

  const modelDesign = model.modelDesign;
  if (!modelDesign) return null;

  useEffect(() => {
    const ob = target.onLoadObservable.add(() => {
      fu.update();
      if (activeNode) modelDesign.reloadOutlineById(activeNode.id);
    });
    return () => {
      if (ob) ob.unregisterOnNextCall = true;
    };
  }, [target, activeNode]);

  const updateProperty = (data: IAssetContainerInitConfig_TextureModify, isStash?: boolean) => {
    if (isStash) {
      doAssetContainerOp(containerNode, { type: 'TextureUpdate', textureName: target.name, data });
      return;
    }

    model.project.command.execute(
      'AssetContainer_Op',
      {
        ID: containerNode.ID,
        action: { type: 'TextureUpdate', textureName: target.name, data },
      },
      { skipIfDisabled: true }
    );
  };

  return (
    <Collapse
      key={fu.key}
      className={className}
      style={style}
      destroyInactivePanel
      defaultActiveKey={['preview', 'info']}
      items={[
        {
          key: 'preview',
          label: '预览',
          children: (
            <>
              <TexturePreview texture={target} />
              <BizField.AssetsUploader
                style={{ marginTop: 12 }}
                disableMfsUpload
                accept='image/*'
                onChange={url => updateProperty({ url })}
              />
            </>
          ),
        },
        {
          key: 'info',
          label: '基本信息',
          children: (
            <>
              <InlineCell label='名称'>
                <Typography.Text>{target.name}</Typography.Text>
              </InlineCell>
              <InlineCell label='尺寸'>
                <Typography.Text>
                  {target.getBaseSize().width}x{target.getBaseSize().height}
                </Typography.Text>
              </InlineCell>

              <InlineCell label='UV 偏移'>
                <BizField.Vector2Field
                  value={{ x: target.uOffset, y: target.vOffset }}
                  onChange={v => v && updateProperty({ uvOffset: [v.x, v.y] })}
                />
              </InlineCell>

              <InlineCell label='UV 缩放'>
                <BizField.Vector2Field
                  value={{ x: target.uScale, y: target.vScale }}
                  onChange={v => v && updateProperty({ uvScale: [v.x, v.y] })}
                />
              </InlineCell>

              <InlineCell label='强度'>
                <BizField.SliderField
                  min={0}
                  max={3}
                  value={target.level}
                  onChange={(v, complete) => updateProperty({ level: v }, !complete)}
                />
              </InlineCell>

              <InlineCell label='UV 通道'>
                <BizField.SliderField
                  min={0}
                  max={3}
                  step={1}
                  value={target.coordinatesIndex}
                  onChange={(v, complete) => updateProperty({ uvSet: v }, !complete)}
                />
              </InlineCell>
            </>
          ),
        },
      ]}
    />
  );
};

PropertyPanel.AnimationGroupCollection = ({
  className,
  style,
  model,
  containerNode,
  activeNode,
}: IPropertyPanelProps & { containerNode: IFlowNode<'AssetContainerNode'> }) => {
  const fu = useForceUpdate();

  const container = containerNode.output.container as AssetContainer;
  if (!container) return null;

  const ctrlNode = containerNode.host.flowNodeManager.lookup(
    `${containerNode.ID}/${containerNode.name}_动画控制器`,
    'ComponentNode'
  );

  return (
    <Collapse
      className={className}
      style={style}
      destroyInactivePanel
      defaultActiveKey={['timeline', 'info']}
      items={[
        {
          key: 'timeline',
          label: '时间轴',
          children: (
            <>
              {ctrlNode && (
                <AnimationTimelineViewer
                  model={model}
                  containerNode={containerNode}
                  container={container}
                  ctrlNode={ctrlNode}
                />
              )}
            </>
          ),
        },
      ]}
    />
  );
};

PropertyPanel.DirectionLight = ({
  className,
  style,
  model,
  activeNode,
  flowNode,
}: IPropertyPanelProps & { flowNode: IFlowNode<'DirectionalLightNode'> }) => {
  const fu = useForceUpdate();

  useListen(flowNode.event, 'input:change', fu.update);

  const updateProperty = (prop: keyof IFlowNode<'DirectionalLightNode'>['input'], value: any, isStash?: boolean) => {
    if (isStash) {
      flowNode.setInput(prop, value);
      return;
    }

    model.project.command.execute(
      'Scene_UpdateFlowNode',
      {
        IDs: [flowNode.ID],
        propPath: 'input.' + prop,
        value,
      },
      { skipIfDisabled: true }
    );
  };

  return (
    <Collapse
      className={className}
      style={style}
      destroyInactivePanel
      defaultActiveKey={['info', 'debug']}
      items={[
        {
          key: 'info',
          label: '基本信息',
          children: (
            <>
              <InlineCell label='旋转角'>
                <BizField.SliderField
                  min={0}
                  max={359}
                  step={1}
                  value={flowNode.input.alpha}
                  onChange={(v, complete) => updateProperty('alpha', v, !complete)}
                />
              </InlineCell>

              <InlineCell label='俯仰角'>
                <BizField.SliderField
                  min={0}
                  max={180}
                  step={1}
                  value={flowNode.input.beta}
                  onChange={(v, complete) => updateProperty('beta', v, !complete)}
                />
              </InlineCell>

              <InlineCell label='半径'>
                <BizField.NumberField
                  step={1}
                  value={flowNode.input.radius}
                  onChange={v => updateProperty('radius', v)}
                />
              </InlineCell>

              <InlineCell label='强度'>
                <BizField.NumberField
                  step={1}
                  value={flowNode.input.intensity}
                  onChange={v => updateProperty('intensity', v)}
                />
              </InlineCell>

              <InlineCell label='颜色' labelAlign='grow'>
                <BizField.ColorHexField
                  disableAlpha
                  value={flowNode.input.color?.toGammaSpace().asArray()}
                  onChange={(v, complete) =>
                    updateProperty('color', Color3.FromArray(v).toLinearSpace().asArray(), !complete)
                  }
                />
              </InlineCell>

              <InlineCell label='启用投影' labelAlign='grow'>
                <BizField.BooleanField value={flowNode.input.shadow} onChange={v => updateProperty('shadow', v)} />
              </InlineCell>

              {flowNode.input.shadow && (
                <>
                  <InlineCell label='投影精度'>
                    <BizField.SelectField
                      options={['512', '1024', '2048', '4096'].map(v => ({ label: v, value: v }))}
                      value={flowNode.input.shadowMapSize + ''}
                      onChange={v => updateProperty('shadowMapSize', +v)}
                    />
                  </InlineCell>

                  <InlineCell label='投影亮度'>
                    <BizField.SliderField
                      min={0}
                      max={1}
                      step={0.1}
                      value={flowNode.input.shadowDarkness}
                      onChange={(v, complete) => updateProperty('shadowDarkness', v, !complete)}
                    />
                  </InlineCell>
                </>
              )}
            </>
          ),
        },
        {
          key: 'debug',
          label: '审查',
          children: (
            <>
              <InlineCell label='显示投影区域' labelAlign='grow'>
                <BizField.BooleanField
                  value={(flowNode.input as any).frustumViewerVisible}
                  onChange={v => updateProperty('frustumViewerVisible' as any, v)}
                />
              </InlineCell>
            </>
          ),
        },
      ]}
    />
  );
};

PropertyPanel.Model = ({
  className,
  style,
  model,
  activeNode,
  flowNode,
}: IPropertyPanelProps & { flowNode: IFlowNode<'AssetContainerNode'> }) => {
  const fu = useForceUpdate();

  useListen(flowNode.event, 'input:change', fu.update);

  const updateProperty = (prop: keyof IFlowNode<'AssetContainerNode'>['input'], value: any, isStash?: boolean) => {
    if (isStash) {
      flowNode.setInput(prop, value);
      return;
    }

    model.project.command.execute(
      'Scene_UpdateFlowNode',
      { IDs: [flowNode.ID], propPath: 'input.' + prop, value },
      { skipIfDisabled: true }
    );
  };

  return (
    <Collapse
      className={className}
      style={style}
      destroyInactivePanel
      defaultActiveKey={['info', 'debug']}
      items={[
        {
          key: 'info',
          label: '基本信息',
          children: (
            <>
              <InlineCell label='名称'>
                <Typography.Text>{flowNode.name}</Typography.Text>
              </InlineCell>

              <InlineCell label='位置'>
                <BizField.Vector3Field value={flowNode.input.position} onChange={v => updateProperty('position', v)} />
              </InlineCell>

              <InlineCell label='缩放'>
                <BizField.Vector3Field value={flowNode.input.scaling} onChange={v => updateProperty('scaling', v)} />
              </InlineCell>

              <InlineCell label='旋转 X'>
                <BizField.SliderField
                  min={0}
                  max={359}
                  step={1}
                  value={flowNode.input.rotation?.x}
                  onChange={(v, complete) => {
                    updateProperty(
                      'rotation',
                      { x: v, y: flowNode.input.rotation?.y, z: flowNode.input.rotation?.z },
                      !complete
                    );
                  }}
                />
              </InlineCell>

              <InlineCell label='旋转 Y'>
                <BizField.SliderField
                  min={0}
                  max={359}
                  step={1}
                  value={flowNode.input.rotation?.y}
                  onChange={(v, complete) => {
                    updateProperty(
                      'rotation',
                      { x: flowNode.input.rotation?.x, y: v, z: flowNode.input.rotation?.z },
                      !complete
                    );
                  }}
                />
              </InlineCell>

              <InlineCell label='旋转 Z'>
                <BizField.SliderField
                  min={0}
                  max={359}
                  step={1}
                  value={flowNode.input.rotation?.z}
                  onChange={(v, complete) => {
                    updateProperty(
                      'rotation',
                      { x: flowNode.input.rotation?.x, y: flowNode.input.rotation?.y, z: v },
                      !complete
                    );
                  }}
                />
              </InlineCell>
            </>
          ),
        },
      ]}
    />
  );
};
