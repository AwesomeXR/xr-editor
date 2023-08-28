import { BarsOutlined, CopyOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import React, { useContext, useState } from 'react';
import { HighlightPopover, IHighlightPopoverContentRenderOpt } from '../../common/component/HighlightPopover';
import { FetchAsync, useForceUpdate, useListen } from '../../common';
import { XREditorContext } from '../XREditorContext';
import { Button, Empty, Modal, Space, Typography, theme } from 'antd';
import { CommandButton } from './CommandButton';
import { getBlobUrl } from '../../common/lib/getBlobUrl';
import { SceneModel } from '../ViewModel';

export interface ISceneSwitchButtonProps {
  className?: string;
  style?: React.CSSProperties;
}

export const SceneSwitchButton = ({ className, style }: ISceneSwitchButtonProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();
  const { token } = theme.useToken();

  useListen(ctx.project.event, 'afterActiveSceneChange', fu.update);
  useListen(ctx.project.event, 'scene:afterMetaChange', fu.update);

  const activeScene = ctx.project.activeScene;

  const renderSceneList = (opt: IHighlightPopoverContentRenderOpt) => {
    const colCnt = 3;

    const _itemStyle: React.CSSProperties = {
      position: 'relative',
      width: `calc((100% - ${8 * (colCnt - 1)}px) / ${colCnt})`,
      aspectRatio: '1',
      display: 'block',
      cursor: 'pointer',
      boxSizing: 'border-box',
      border: `1px solid ${token.colorBorder}`,
      borderRadius: 4,
    };

    return (
      <div style={{ width: 480, display: 'flex', flexWrap: 'wrap' }}>
        {...ctx.project.scenes.map((s, i) => {
          const _onClick = () => {
            ctx.project.command
              .execute('SwitchActiveScene', { ID: s.ID }, { skipIfDisabled: true })
              .ret.then(opt.close);
          };

          const _isActive = activeScene?.ID === s.ID;

          return (
            <div
              key={s.ID}
              style={{
                ..._itemStyle,
                marginLeft: i % colCnt ? 8 : 0,
                marginBottom: 8,
                border: _isActive ? `2px solid ${token.colorPrimary}` : _itemStyle.border,
              }}
            >
              {s.poster ? (
                <FetchAsync refreshKey={s.poster} request={async () => getBlobUrl(ctx.project.mfs, s.poster!)}>
                  {({ url }) => (
                    <img src={url} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
                  )}
                </FetchAsync>
              ) : (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无封面' />
              )}

              <div
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                onClick={_onClick}
              />

              <Space.Compact size='small' style={{ position: 'absolute', right: 4, top: 4 }}>
                <CommandButton icon={<CopyOutlined />} command={'CloneScene'} arg={{ ID: s.ID }} />
                <CommandButton icon={<DeleteOutlined />} command={'RemoveScene'} arg={{ ID: s.ID }} />
              </Space.Compact>

              <Typography.Text
                ellipsis
                style={{ position: 'absolute', left: 4, right: 4, bottom: 4, textAlign: 'center' }}
                editable={{
                  onChange: title => {
                    s.title = title;
                  },
                }}
              >
                {s.title || s.ID}
              </Typography.Text>
            </div>
          );
        })}
        <div
          style={{
            ..._itemStyle,
            marginLeft: ctx.project.scenes.length % colCnt ? 8 : 0,
            marginBottom: 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => {
            ctx.project.command.execute('CreateScene', {}, { skipIfDisabled: true }).ret.then(opt.close);
          }}
        >
          添加场景
        </div>
      </div>
    );
  };

  // 循环切换场景
  const handleLoopScene = () => {
    const scenes = ctx.project.scenes;

    let idx = scenes.findIndex(s => activeScene?.ID === s.ID) + 1;
    if (idx >= scenes.length) idx = 0;

    ctx.project.command.execute('SwitchActiveScene', { ID: scenes[idx].ID }, { skipIfDisabled: true });
  };

  return (
    <Space.Compact size='small'>
      <HighlightPopover className={className} style={{ ...style }} icon={<BarsOutlined />} content={renderSceneList}>
        <Typography.Text ellipsis style={{ width: '150px', textAlign: 'left' }}>
          {activeScene?.title || '场景'}
        </Typography.Text>
      </HighlightPopover>

      <Button onClick={handleLoopScene}>
        {ctx.project.scenes.findIndex(s => activeScene?.ID === s.ID) + 1}/{ctx.project.scenes.length}
      </Button>
    </Space.Compact>
  );
};
