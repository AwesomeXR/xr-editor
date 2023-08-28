import React, { memo, useMemo, useRef } from 'react';
import { useForceUpdate, useListen } from '../../../common';
import { AnimationGroup, AssetContainer } from 'xr-impl-bjs/dist/bjs';
import { BizField } from '../../component/BizField';
import { IFlowNode, Util } from 'ah-flow-node';
import _ from 'lodash';
import { DoubleRightOutlined, NodeIndexOutlined } from '@ant-design/icons';
import { BizIcon } from '../../../common/component/BizIcon';
import { CommandButton } from '../../component/CommandButton';
import { Button } from 'antd';
import { ModelDesignPropertyModel } from './ModelDesignPropertyModel';

export interface IAnimationTimelineViewerProps {
  className?: string;
  style?: React.CSSProperties;
  model: ModelDesignPropertyModel;
  containerNode: IFlowNode<'AssetContainerNode'>;
  container: AssetContainer;
  ctrlNode: IFlowNode<'ComponentNode'>;
}

export const AnimationTimelineViewer = ({
  className,
  style,
  model,
  containerNode,
  container,
  ctrlNode,
}: IAnimationTimelineViewerProps) => {
  const fu = useForceUpdate();

  useListen(ctrlNode.event, 'input:change', fu.update);
  useListen(ctrlNode.event, 'output:change', fu.update);

  const ctrlInput = ctrlNode.input as any;
  const ctrlOutput = ctrlNode.output as any;

  // button wave rerender 消耗太大，所以用 useMemo
  const runBtn = useMemo(
    () => (
      <CommandButton
        size='small'
        type={ctrlInput.run ? 'primary' : 'default'}
        icon={<BizIcon name={ctrlInput.run ? 'pause' : 'play'} />}
        command='Scene_UpdateFlowNode'
        arg={{ IDs: [ctrlNode.ID], propPath: 'input.run', value: !ctrlInput.run }}
        style={{ marginLeft: 8 }}
      >
        {ctrlInput.run ? '暂停' : '播放'}
      </CommandButton>
    ),
    [ctrlInput.run]
  );

  return (
    <div className={className} style={style}>
      <div style={{ display: 'flex' }}>
        <div style={{ width: 100 }}>播放速率</div>
        <BizField.NumberField
          min={0}
          step={0.5}
          value={ctrlInput.speedRatio}
          onChange={v => ctrlNode.setInput('speedRatio' as any, v)}
          style={{ flex: 1, width: 1 }}
        />
      </div>

      <div style={{ marginTop: 12 }}>
        <div>
          <BizIcon name='render_animation' /> 时间轴
        </div>
        <div style={{ display: 'flex' }}>
          <BizField.SliderField
            disabled={ctrlInput.run}
            min={ctrlInput.range?.x}
            max={ctrlInput.range?.y}
            step={1}
            value={ctrlOutput.frame}
            onChange={v => ctrlNode.setInput('frame' as any, v)}
            style={{ flex: 1, width: 1 }}
          />
          {runBtn}
        </div>
      </div>
      {container.animationGroups.map(ag => {
        return (
          <AnimationTimelineViewer_Animator_Stable
            key={ag.name}
            model={model}
            containerNode={containerNode}
            container={container}
            ctrlNode={ctrlNode}
            ag={ag}
            style={{ marginTop: 12 }}
          />
        );
      })}
    </div>
  );
};

export const AnimationTimelineViewer_Animator = ({
  className,
  style,
  model,
  ctrlNode,
  ag,
}: IAnimationTimelineViewerProps & { ag: AnimationGroup }) => {
  const fu = useForceUpdate();

  const ioKeyPrefix = `animation/${ag.name}`;

  useListen(ctrlNode.event, 'input:change', ev => {
    if (ev.key.startsWith(ioKeyPrefix)) fu.update();
  });
  useListen(ctrlNode.event, 'output:change', ev => {
    if (ev.key.startsWith(ioKeyPrefix)) fu.update();
  });

  const ctrlInput = ctrlNode.input as any;
  const ctrlOutput = ctrlNode.output as any;

  const isSynced = ctrlInput[ioKeyPrefix + '/sync'];

  // button wave rerender 消耗太大，所以用 useMemo
  const syncBtn = useMemo(
    () => (
      <Button
        size='small'
        type={isSynced ? 'primary' : 'default'}
        icon={<NodeIndexOutlined />}
        onClick={() => {
          ctrlInput[ioKeyPrefix + '/sync'] = !isSynced;
        }}
        style={{ marginLeft: 8 }}
      >
        同步
      </Button>
    ),
    [isSynced]
  );

  return (
    <div className={className} style={style} key={ag.name}>
      <div>
        <BizIcon name='anim_data' /> {ag.name}
      </div>
      <div style={{ display: 'flex' }}>
        <BizField.SliderField
          min={ctrlInput.range?.x}
          max={ctrlInput.range?.y}
          step={1}
          disabled={isSynced} // 同步时禁用
          value={ctrlOutput[ioKeyPrefix + '/frame']}
          onChange={v => {
            ctrlInput[ioKeyPrefix + '/frame'] = v;
          }}
          style={{ flex: 1, width: 1 }}
        />
        {syncBtn}
      </div>
    </div>
  );
};

const AnimationTimelineViewer_Animator_Stable = memo(AnimationTimelineViewer_Animator, () => false);
