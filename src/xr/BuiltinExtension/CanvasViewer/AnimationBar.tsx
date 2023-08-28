import React, { useMemo } from 'react';
import { CanvasViewerModel } from './CanvasViewerModel';
import { useForceUpdate, useListen } from '../../../common';
import { Button, Slider, Space } from 'antd';
import { CaretRightOutlined, PauseOutlined, StepBackwardOutlined, StepForwardOutlined } from '@ant-design/icons';
import { HighlightPopover } from '../../../common/component/HighlightPopover';
import { LightTree } from '../../../common/component/LightTree';
import _ from 'lodash';

export interface IAnimationBarProps {
  className?: string;
  style?: React.CSSProperties;
  model: CanvasViewerModel;
}

export const AnimationBar = ({ className, style, model }: IAnimationBarProps) => {
  const fu = useForceUpdate();

  const movieClip = model.movieClip;
  const aniBarOutline = model.aniBarOutline;

  useListen(model.event, 'afterStateChange', fu.update);
  useListen(aniBarOutline.event, 'afterAllChange', fu.update);
  useListen(aniBarOutline.event, 'afterSelectChange', fu.update);

  useListen(movieClip.event, 'afterAnimatorsChange', fu.update);
  useListen(movieClip.event, 'afterPlayStateChange', fu.update);
  useListen(movieClip.event, 'afterFrameChange', fu.update);

  const ctrlBtn = useMemo(() => {
    if (movieClip.isPlaying) {
      return (
        <Button size='small' icon={<PauseOutlined />} onClick={() => movieClip.togglePlay()}>
          暂停
        </Button>
      );
    }

    return (
      <Button size='small' icon={<CaretRightOutlined />} onClick={() => movieClip.togglePlay()}>
        播放
      </Button>
    );
  }, [movieClip.isPlaying]);

  const frameProgressBtn = useMemo(() => {
    return (
      <Space.Compact size='small' style={{ marginLeft: 24 }}>
        <Button
          type='text'
          icon={<StepBackwardOutlined />}
          onClick={() => model.movieClip.setFrame(model.movieClip.range[0])}
        />
        <Button
          type='text'
          icon={<StepForwardOutlined />}
          onClick={() => model.movieClip.setFrame(model.movieClip.range[1])}
        />
      </Space.Compact>
    );
  }, []);

  const aniSelector = useMemo(() => {
    const activeKeySet = new Set(movieClip.activeKeys);

    const nodeRts = aniBarOutline.allNodes
      .map(n => aniBarOutline.getNodeInfo(n.id)!)
      .filter(d => {
        const payload = d.node.data.payload;
        return payload.type === 'TrackRoot' && activeKeySet.has(payload.track.key);
      });

    let displayText = '';
    if (nodeRts.length === 0) displayText = '---';
    else if (nodeRts.length === 1) displayText = nodeRts[0].node.data.content;
    else displayText = `${nodeRts[0].node.data.content} 等${nodeRts.length}个动画`;

    return (
      <HighlightPopover
        style={{ marginLeft: 16 }}
        defaultBtnType='text'
        onOpen={() => model.reloadAniBarOutline()}
        placement='topLeft'
        content={() => (
          <div style={{ width: 300 }}>
            <LightTree model={model.aniBarOutline} />
          </div>
        )}
      >
        {displayText}
      </HighlightPopover>
    );
  }, [movieClip.activeKeys.join(','), movieClip.animators.map(d => d.name).join(','), aniBarOutline.nodesForRender]);

  const frameSlider = useMemo(() => {
    if (movieClip.range[1] === 0) return null;

    return (
      <Slider
        min={movieClip.range[0]}
        max={movieClip.range[1]}
        step={1}
        disabled={movieClip.isPlaying}
        value={movieClip.frame}
        onChange={v => movieClip.setFrame(v)}
      />
    );
  }, [movieClip.isPlaying, movieClip.frame]);

  const animators = movieClip.animators;
  if (!animators.length) return null; // 没有动画数据, 不显示

  return (
    <div data-name='AnimationBar' className={className} style={{ padding: '8px 16px', ...style }}>
      {frameSlider}

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          {ctrlBtn}
          {frameProgressBtn}
          {aniSelector}
        </div>

        <code style={{ color: '#fff', fontSize: 12 }}>
          {movieClip.frame.toFixed(0)}/{movieClip.range[1]} 帧
        </code>
      </div>
    </div>
  );
};
