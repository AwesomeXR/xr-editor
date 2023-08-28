import React, { useContext } from 'react';
import { HighlightPopover } from '../../common/component/HighlightPopover';
import { InlineCell, useForceUpdate, useListen } from '../../common';
import { Segmented } from 'antd';
import { XREditorContext } from '../XREditorContext';
import { BizField } from './BizField';
import { DesktopOutlined } from '@ant-design/icons';

export interface IViewportButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ViewportButton = ({ className, style }: IViewportButtonProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();

  useListen(ctx.project.event, 'afterViewportChange', fu.update);
  useListen(ctx.project.event, 'afterViewportResize', fu.update);

  const vp = ctx.project.getRenderingCanvasSize();

  const renderContent = () => {
    return (
      <div style={{ width: 320 }}>
        <InlineCell label='尺寸'>
          <Segmented
            block
            size='small'
            options={[
              { label: '自由', value: 'auto' },
              { label: '固定比例', value: 'fixed-ratio' },
              { label: '固定尺寸', value: 'fixed-size' },
            ]}
            value={ctx.project.viewport.type}
            onChange={type => ctx.project.setViewport({ type: type as any })}
          />
        </InlineCell>

        {ctx.project.viewport.type === 'fixed-ratio' && (
          <>
            <InlineCell label='宽高比'>
              <BizField.SliderField
                min={0.1}
                max={5}
                step={0.1}
                defaultValue={ctx.project.viewport.fixedRatio?.ratio || 1}
                onChange={v => {
                  v && ctx.project.setViewport({ fixedRatio: { ratio: v } });
                }}
              />
            </InlineCell>
          </>
        )}

        {ctx.project.viewport.type === 'fixed-size' && (
          <>
            <InlineCell label='宽度'>
              <BizField.NumberField
                min={64}
                max={4096}
                step={1}
                defaultValue={ctx.project.viewport.fixedSize?.width || vp.width}
                onChange={v => {
                  if (!v) return;
                  ctx.project.setViewport({
                    fixedSize: { width: v, height: ctx.project.viewport.fixedSize?.height || vp.height },
                  });
                }}
              />
            </InlineCell>
            <InlineCell label='高度'>
              <BizField.NumberField
                min={64}
                max={4096}
                step={1}
                defaultValue={ctx.project.viewport.fixedSize?.height || vp.height}
                onChange={v => {
                  if (!v) return;
                  ctx.project.setViewport({
                    fixedSize: { width: ctx.project.viewport.fixedSize?.width || vp.width, height: v },
                  });
                }}
              />
            </InlineCell>
          </>
        )}
      </div>
    );
  };

  return (
    <HighlightPopover
      className={className}
      style={style}
      content={renderContent}
      size='small'
      icon={<DesktopOutlined />}
    >
      视口
    </HighlightPopover>
  );
};
