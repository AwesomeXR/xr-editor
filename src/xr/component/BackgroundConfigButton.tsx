import { Collapse, Segmented } from 'antd';
import React, { useContext, useMemo } from 'react';
import { useForceUpdate, useListen, InlineCell } from '../../common';
import { HighlightPopover } from '../../common/component/HighlightPopover';
import { XREditorContext } from '../XREditorContext';
import { BizField } from './BizField';
import { PictureOutlined } from '@ant-design/icons';
import { BuiltinSkyBoxList } from '../BuiltinSkyBoxList';

export interface IBackgroundConfigButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const BackgroundConfigButton = ({ className, style }: IBackgroundConfigButtonProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();

  useListen(ctx.project.event, 'scene:sceneConfigHelper:afterChange', fu.update);

  const scene = ctx.project.activeScene;
  if (!scene) return null;

  const sceneConfigHelper = scene.sceneConfigHelper;

  const renderContent = () => {
    const backgroundMode = sceneConfigHelper.backgroundMode;

    return (
      <div style={{ width: 280 }}>
        <Collapse
          destroyInactivePanel
          defaultActiveKey={['background', 'hdr']}
          items={[
            {
              key: 'background',
              label: '背景',
              children: (
                <>
                  <InlineCell label='模式'>
                    <Segmented
                      block
                      size='small'
                      value={backgroundMode}
                      options={[
                        { label: '全景', value: 'skybox' },
                        { label: '颜色', value: 'color' },
                      ]}
                      onChange={mode => sceneConfigHelper.setBackgroundMode(mode as any)}
                    />
                  </InlineCell>
                  {backgroundMode === 'color' && (
                    <>
                      <InlineCell label='颜色' labelAlign='grow'>
                        <BizField.ColorHexField
                          value={sceneConfigHelper.bgColor}
                          onChange={v => sceneConfigHelper.setBgColor(v)}
                        />
                      </InlineCell>
                    </>
                  )}
                  {backgroundMode === 'skybox' && (
                    <>
                      <InlineCell label='全景图'>
                        <BizField.GalleryField
                          snapshotStyle={{ aspectRatio: '2', objectFit: 'fill' }}
                          options={BuiltinSkyBoxList}
                          value={sceneConfigHelper.skyBoxTexture}
                          onChange={v => v && sceneConfigHelper.setSkyBoxTexture(v)}
                        />
                      </InlineCell>

                      <InlineCell label='旋转'>
                        <BizField.SliderField
                          min={0}
                          max={359}
                          step={1}
                          value={sceneConfigHelper.skyBoxRotation}
                          onChange={v => sceneConfigHelper.setSkyBoxRotation(v)}
                        />
                      </InlineCell>
                    </>
                  )}
                </>
              ),
            },
          ]}
        />
      </div>
    );
  };

  return (
    <HighlightPopover
      className={className}
      style={style}
      content={renderContent}
      size='small'
      icon={<PictureOutlined />}
    >
      背景
    </HighlightPopover>
  );
};
