import { Button, Input, InputNumber, Space } from 'antd';
import React from 'react';
import { ModelDesignMovieClipModel } from './ModelDesignMovieClipModel';
import { SimpleSelect, useForceUpdate, useListen } from '../../../common';
import {
  CaretRightOutlined,
  FieldTimeOutlined,
  PauseOutlined,
  PlusOutlined,
  StepBackwardOutlined,
  StepForwardOutlined,
  VerticalLeftOutlined,
  VerticalRightOutlined,
} from '@ant-design/icons';

export interface IHeaderProps {
  className?: string;
  style?: React.CSSProperties;

  model: ModelDesignMovieClipModel;
}

export const Header = ({ className, style, model }: IHeaderProps) => {
  const fu = useForceUpdate();

  useListen(model.movieClip.event, 'afterClipConfigChange', () => fu.update());
  useListen(model.movieClip.event, 'afterPlayStateChange', () => fu.update());
  useListen(model.movieClip.event, 'afterRangeChange', fu.update);

  const range = model.range;
  const groups = model.clipConfig.groups;

  return (
    <div
      data-name='Header'
      className={className}
      style={{ display: 'flex', justifyContent: 'space-between', ...style }}
    >
      <Space.Compact size='small'>
        <Button icon={<PlusOutlined />} onClick={() => model.addGroup()}>
          分组
        </Button>
      </Space.Compact>

      <Space.Compact size='small'>
        <Button disabled={model.isPlaying} icon={<StepBackwardOutlined />} onClick={() => model.setFrame(range[0])}>
          起始
        </Button>
        <Button icon={model.isPlaying ? <PauseOutlined /> : <CaretRightOutlined />} onClick={() => model.togglePlay()}>
          {model.isPlaying ? '暂停' : '播放'}
        </Button>
        <Button disabled={model.isPlaying} icon={<StepForwardOutlined />} onClick={() => model.setFrame(range[1])}>
          结束
        </Button>
      </Space.Compact>

      <Space size='small'>
        <InputNumber
          min={range[0]}
          max={range[1]}
          step={1}
          prefix={<FieldTimeOutlined />}
          precision={1}
          size='small'
          style={{ width: 120 }}
          value={model.frame}
          onChange={v => model.setFrame(v || 0)}
        />
        <InputNumber
          min={0}
          size='small'
          style={{ width: 120 }}
          prefix='起始'
          value={range[0]}
          onChange={v => model.setRange([v || 0, range[1]])}
        />
        <InputNumber
          min={0}
          size='small'
          style={{ width: 120 }}
          prefix='结束'
          value={range[1]}
          onChange={v => model.setRange([range[0], v || 0])}
        />
      </Space>
    </div>
  );
};
