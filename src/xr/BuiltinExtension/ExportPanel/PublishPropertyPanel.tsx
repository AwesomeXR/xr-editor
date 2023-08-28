import { Button, Tabs, Image, Input, Row, message, QRCode, Divider, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { InlineCell, ProgressHelper, useForceUpdate, useListen } from '../../../common';
import {
  AimOutlined,
  CopyFilled,
  DownloadOutlined,
  EyeOutlined,
  LinkOutlined,
  PictureOutlined,
  ReloadOutlined,
  ThunderboltOutlined,
  VideoCameraOutlined,
} from '@ant-design/icons';
import { CommandButton } from '../../component/CommandButton';
import { BizField } from '../../component/BizField';
import copy from 'copy-to-clipboard';
import { ExportPanelModel, IExportMode } from './ExportPanelModel';
import { UserLevelRequirement } from '../../component/UserLevelRequirement';
import { UserLevelEnum } from '../../IUserLevel';
import { buildCommand } from '../../BuildCommand';

export interface IPublishPropertyPanelProps {
  className?: string;
  style?: React.CSSProperties;
  model: ExportPanelModel;
}

export const PublishPropertyPanel = ({ className, style, model }: IPublishPropertyPanelProps) => {
  const activeMode = model.state.mode;

  const renderTabTitle = (key: IExportMode, title: string, icon: any) => {
    return (
      <Button type={key === activeMode ? 'primary' : 'text'} icon={icon} style={{ width: 120, textAlign: 'left' }}>
        {title}
      </Button>
    );
  };

  return (
    <div
      data-name='PublishPropertyPanel'
      className={className}
      style={{ padding: '16px 16px 16px 20px', position: 'relative', ...style }}
    >
      <Tabs
        size='small'
        tabPosition='left'
        destroyInactiveTabPane
        activeKey={activeMode}
        onChange={mode => model.updateState({ mode } as any)}
        tabBarGutter={0}
        items={[
          {
            key: 'H5',
            label: renderTabTitle('H5', '链接', <LinkOutlined />),
            children: <PublishPropertyPanel.H5 model={model} />,
          },
          {
            key: 'Image',
            label: renderTabTitle('Image', '图片', <PictureOutlined />),
            children: <PublishPropertyPanel.Image model={model} />,
          },
          {
            key: 'Video',
            label: renderTabTitle('Video', '视频', <VideoCameraOutlined />),
            children: <PublishPropertyPanel.Video model={model} />,
          },
        ]}
      />
    </div>
  );
};

PublishPropertyPanel.H5 = ({ className, style, model }: IPublishPropertyPanelProps) => {
  const fu = useForceUpdate();

  useListen(model.project.event, 'afterPublish', fu.update);
  useListen(model.project.event, 'afterActiveSceneChange', fu.update);

  const scene = model.project.activeScene;

  const renderPublishData = () => {
    const pData = model.project.latestPublishData;
    const publishCmdArg = {
      skipOpenFileExplorer: true,
      syncEDCameraToPreview: {
        allowControl: model.state.publish?.allowControl,
        allowMove: model.state.publish?.allowMove,
      },
      extraTplData: { logo: model.state.publish?.logo, backgroundImage: model.state.publish?.backgroundImage },
    };

    if (!pData) {
      return (
        <UserLevelRequirement level={UserLevelEnum.Normal} style={{ display: 'block' }}>
          <CommandButton
            block
            size='small'
            icon={<ThunderboltOutlined />}
            command={'Publish'}
            arg={publishCmdArg}
            type='primary'
            style={{ marginBottom: 8 }}
          >
            生成链接
          </CommandButton>

          <CommandButton
            block
            size='small'
            icon={<DownloadOutlined />}
            command='Publish'
            arg={{ ...publishCmdArg, toLocal: true }}
            style={{ marginBottom: 16 }}
          >
            导出到本地
          </CommandButton>
        </UserLevelRequirement>
      );
    }

    return (
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <QRCode value={pData.indexEntryURL} size={180} />
        </div>

        <div style={{ marginTop: 8 }}>
          <Input prefix={<LinkOutlined />} value={pData.indexEntryURL} style={{ width: '100%' }} />
        </div>

        <Row style={{ width: '100%', marginTop: 8 }}>
          <a href={pData.indexEntryURL} target='_blank' style={{ flex: 1, width: 1 }}>
            <Button size='small' block icon={<EyeOutlined />} type={'primary'}>
              新窗口打开
            </Button>
          </a>
          <Button
            size='small'
            icon={<CopyFilled />}
            type={'primary'}
            style={{ marginLeft: 8 }}
            onClick={() => {
              copy(pData.indexEntryURL);
              message.success('已复制到剪贴板');
            }}
          >
            复制
          </Button>

          <UserLevelRequirement level={UserLevelEnum.Normal}>
            <CommandButton
              size='small'
              icon={<ThunderboltOutlined />}
              command={'Publish'}
              arg={publishCmdArg}
              style={{ marginLeft: 8 }}
            >
              重新生成
            </CommandButton>
          </UserLevelRequirement>
        </Row>

        <Row style={{ width: '100%', marginTop: 8 }}>
          <CommandButton
            block
            size='small'
            icon={<DownloadOutlined />}
            command='Publish'
            arg={{ ...publishCmdArg, toLocal: true }}
          >
            导出到本地
          </CommandButton>
        </Row>
      </div>
    );
  };

  return (
    <div className={className} style={style}>
      {renderPublishData()}

      <Divider type='horizontal' />

      <InlineCell label='允许交互' labelAlign='grow'>
        <BizField.BooleanField
          value={model.state.publish?.allowControl}
          onChange={v => model.updateState({ publish: { ...model.state.publish, allowControl: v } })}
        />
      </InlineCell>
      <InlineCell label='双指平移' labelAlign='grow'>
        <BizField.BooleanField
          value={model.state.publish?.allowMove}
          onChange={v => model.updateState({ publish: { ...model.state.publish, allowMove: v } })}
        />
      </InlineCell>

      <InlineCell label='相机聚焦' childrenStyle={{ display: 'flex' }}>
        <Button size='small' icon={<AimOutlined />} style={{ flex: 1 }} onClick={() => scene?.zoomOn('picked')}>
          物体中心
        </Button>
        <Button
          size='small'
          icon={<AimOutlined />}
          style={{ marginLeft: 8, flex: 1 }}
          onClick={() => scene?.zoomOn('world-center')}
        >
          世界中心
        </Button>
      </InlineCell>

      <InlineCell label='显示 LOGO'>
        <BizField.ImageUploader
          previewWidth={100}
          enableImgCrop={{ aspect: 1 }}
          value={model.state.publish?.logo}
          onChange={v => model.updateState({ publish: { ...model.state.publish, logo: v } })}
        />
      </InlineCell>

      <InlineCell label='加载背景'>
        <BizField.ImageUploader
          previewWidth={100}
          enableImgCrop={{ aspect: 1 }}
          value={model.state.publish?.backgroundImage}
          onChange={v => model.updateState({ publish: { ...model.state.publish, backgroundImage: v } })}
        />
      </InlineCell>
    </div>
  );
};

PublishPropertyPanel.Image = ({ className, style, model }: IPublishPropertyPanelProps) => {
  const [snapPreviewUrl, setSnapPreviewUrl] = useState<string>();

  const scene = model.project.activeScene;
  if (!scene) return null;

  const handleTakeSnapshot = async () => {
    const ret = await scene.takeSnapshotExtra({ hideGizmo: true });
    setSnapPreviewUrl(ret.previewURL);
  };

  return (
    <div className={className} style={style}>
      <InlineCell label='预览' labelFixedSpan={4}>
        {snapPreviewUrl ? (
          <>
            <Image src={snapPreviewUrl} style={{ width: '100%' }} />
            <Button size='small' block icon={<ReloadOutlined />} style={{ marginTop: 8 }} onClick={handleTakeSnapshot}>
              重新生成
            </Button>
          </>
        ) : (
          <Button size='small' block icon={<ReloadOutlined />} onClick={handleTakeSnapshot}>
            生成
          </Button>
        )}
      </InlineCell>

      {snapPreviewUrl && (
        <Button size='small' block type='primary' icon={<DownloadOutlined />} style={{ marginTop: 16 }}>
          导出
        </Button>
      )}
    </div>
  );
};

PublishPropertyPanel.Video = ({ className, style, model }: IPublishPropertyPanelProps) => {
  const fu = useForceUpdate();
  const scene = model.project.activeScene;

  useEffect(() => {
    if (scene) {
      const _lastVisible = scene.gizmoState.gizmoVisible;
      scene.setGizmoState({ gizmoVisible: false });

      // 退出组件的时候，恢复 gizmo 的显示状态
      return () => {
        scene.setGizmoState({ gizmoVisible: _lastVisible });
      };
    }
  }, [scene]);

  useEffect(() => {
    return () => {
      model.composer.stop();
    };
  }, []);

  useListen(model.project.event, 'afterViewportResize', fu.update);

  useListen(model.movieClip.event, 'afterFrameChange', fu.update);
  useListen(model.movieClip.event, 'afterPlayStateChange', fu.update);
  useListen(model.composer.event, 'afterStateChange', fu.update);
  useListen(model.composer.event, 'onComposeProgress', fu.update);

  useListen(model.composer.event, 'afterComposed', ev => {
    window.open(URL.createObjectURL(ev.blob));
  });

  const { vpScale = 1, sampleRate = 30, quality = 0.7 } = model.state.videoComposer || {};

  const disableField = model.composer.state === 'recording';

  const vp = model.project.getRenderingCanvasSize();

  const scaledVpWidth = Math.round(vp.width * vpScale);
  const scaledVpHeight = Math.round(vp.height * vpScale);

  return (
    <div className={className} style={style}>
      <InlineCell label='视口缩放'>
        <BizField.NumberField
          min={0.1}
          step={0.1}
          value={vpScale}
          onChange={v => model.updateState({ videoComposer: { ...model.state.videoComposer, vpScale: v } })}
          style={{ display: 'block' }}
        />
      </InlineCell>

      <InlineCell label='分辨率'>
        <Typography.Text>
          {vpScale === 1 ? `${vp.width} x ${vp.height}` : `${scaledVpWidth} x ${scaledVpHeight} (缩放后)`}
        </Typography.Text>
      </InlineCell>

      <InlineCell label='采样帧率'>
        <BizField.SliderField
          disabled={disableField}
          min={5}
          max={60}
          step={5}
          value={sampleRate}
          onChange={v => model.updateState({ videoComposer: { ...model.state.videoComposer, sampleRate: v } })}
        />
      </InlineCell>
      <InlineCell label='合成质量'>
        <BizField.SliderField
          disabled={disableField}
          min={0}
          max={1}
          step={0.1}
          value={quality}
          onChange={v => model.updateState({ videoComposer: { ...model.state.videoComposer, quality: v } })}
        />
      </InlineCell>
      <InlineCell label='时间轴'>
        <BizField.SliderField
          disabled={disableField}
          min={model.movieClip.range[0]}
          max={model.movieClip.range[1]}
          step={1}
          value={model.movieClip.frame}
          onChange={v => model.movieClip.setFrame(v)}
        />
      </InlineCell>

      <Divider type='horizontal' />

      {(model.composer.state === 'init' || model.composer.state === 'composed' || model.composer.state === 'stop') && (
        <>
          <UserLevelRequirement level={UserLevelEnum.Normal} style={{ display: 'block' }}>
            <Button
              block
              size='small'
              type='primary'
              icon={<ThunderboltOutlined />}
              onClick={() => model.composer.record(sampleRate)}
            >
              开始录制
            </Button>
          </UserLevelRequirement>
        </>
      )}

      {model.composer.state === 'recording' && (
        <>
          <Button block size='small' type='primary' loading icon={<ThunderboltOutlined />}>
            录制中
          </Button>
        </>
      )}

      {model.composer.state === 'recorded' && (
        <>
          <Button
            block
            size='small'
            type='primary'
            icon={<ThunderboltOutlined />}
            onClick={() => model.composer.compose('APNG', scaledVpWidth, scaledVpHeight, sampleRate, quality)}
          >
            合成 APNG
          </Button>
        </>
      )}

      {model.composer.state === 'composing' && (
        <>
          <Button block size='small' type='primary' loading icon={<ThunderboltOutlined />}>
            合成中 {ProgressHelper.format(model.composer.composingProgress)}
          </Button>
        </>
      )}
    </div>
  );
};
