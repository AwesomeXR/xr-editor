import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { IOutlinePayload, ModelDesignMovieClipModel } from './ModelDesignMovieClipModel';
import { IMovieClipTrackItem } from 'xr-core';
import { useForceUpdate, useListen } from '../../../common';
import cx from 'classnames';
import './Timeline.less';
import { ITreeNodeRTInfo } from '../../../common/component/LightTree';
import _, { set } from 'lodash';

export interface ITimelineProps {
  className?: string;
  style?: React.CSSProperties;
  model: ModelDesignMovieClipModel;
}

const useRuler = (model: ModelDesignMovieClipModel, scale: number) => {
  const bps = [40, 60];
  const frameDelta = Math.floor(bps[0] / scale + ((bps[1] - bps[0]) / scale) * 0.5);
  const offsetDelta = frameDelta * scale;

  // 用 css 实现 ruler 刻度
  const stepColor = '#666';
  const background = `repeating-linear-gradient(to right, ${stepColor}, ${stepColor} 1px, transparent 1px, transparent ${offsetDelta}px)`;

  const labelOffsets = _.range(0, model.range[1], frameDelta).map(v => ({ text: v, offset: v * scale }));

  return { background, labelOffsets, stepColor, frameDelta, offsetDelta, bps };
};

export const Timeline = ({ className, style, model }: ITimelineProps) => {
  const fu = useForceUpdate();
  const ref = useRef<HTMLDivElement>(null);

  const scale = model.state.timelineScale;
  const offset = model.state.timelineOffset;

  const scaleRef = useRef<number>(scale);
  scaleRef.current = scale;

  const setScale = (scale: number) => {
    model.updateState({ timelineScale: scale });
  };
  const setOffset = (offset: number) => {
    model.updateState({ timelineOffset: offset });
  };

  useListen(model.outline.event, 'afterSelectChange', fu.update);
  useListen(model.movieClip.event, 'afterRangeChange', fu.update);

  useLayoutEffect(() => {
    if (ref.current) {
      const ele = ref.current;

      // 处理 ref 的 wheel 事件
      const _handleWheel = (ev: WheelEvent) => {
        ev.preventDefault();

        const { deltaY } = ev;
        const newScale = scaleRef.current + deltaY * 0.001;

        setScale(newScale);
      };

      // passive: false 阻止默认行为, 否则会导致整个页面滚动
      // [React与被动事件监听(Passive Event Listeners) - 知乎](https://zhuanlan.zhihu.com/p/549868276)
      ele.addEventListener('wheel', _handleWheel, { passive: false });

      return () => {
        ele.removeEventListener('wheel', _handleWheel);
      };
    }
  }, []);

  const ruler = useRuler(model, scale);

  const nodes = model.outline.nodesForRender;
  const range = model.range;
  const width = (range[1] - range[0]) * scale;

  const activeNodeIdx = nodes.findIndex(n => model.outline.selectedIds.includes(n.node.id));

  const handleDragStart = (ev: React.MouseEvent<HTMLElement>) => {
    ev.stopPropagation();
    ev.preventDefault();

    // start drag
    const startX = ev.clientX;
    const startOffset = offset;

    const _handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      let newOffset = startOffset + dx;

      // 只能往负方向拖动
      if (newOffset > 0) newOffset = 0;

      setOffset(newOffset);
    };

    const _handleMouseUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', _handleMouseMove);
      window.removeEventListener('mouseup', _handleMouseUp);
    };

    window.addEventListener('mousemove', _handleMouseMove);
    window.addEventListener('mouseup', _handleMouseUp);
  };

  const renderTracks = () => {
    return nodes.map(node => {
      const _placeholder = <div key={node.node.id} className='MD-Timeline-Track empty' />;

      const payload = node.node.data.payload as IOutlinePayload | undefined;
      if (!payload) return _placeholder;

      if (payload.type === 'TrackRoot') {
        return <Timeline.Track key={node.node.id} model={model} track={payload.track} scale={scale} node={node} />;
      }

      return _placeholder;
    });
  };

  return (
    <div
      ref={ref}
      data-name='Timeline'
      className={cx(className, 'MD-Timeline')}
      style={{ height: 24 * (nodes.length + 1), ...style }}
      onMouseDown={handleDragStart}
    >
      {/* 填充背景 */}
      <div className='MD-Timeline-Background'>
        <div className='block' style={{ left: range[0] * scale, width, transform: `translateX(${offset}px)` }} />
        <div
          className='select'
          style={{
            display: activeNodeIdx < 0 ? 'none' : 'block',
            transform: `translateY(${(activeNodeIdx + 1) * 24}px)`,
          }}
        />
        <div className='grid-x' />
        <div className='grid-y' style={{ background: ruler.background, transform: `translateX(${offset}px)` }} />
      </div>

      <div className='MD-Timeline-Content' style={{ width, transform: `translateX(${offset}px)` }}>
        <Timeline.Ruler model={model} scale={scale} />
        {renderTracks()}
        <Timeline.Cursor model={model} scale={scale} />
      </div>
    </div>
  );
};

Timeline.Ruler = ({ model, scale }: ITimelineProps & { scale: number }) => {
  const { background, labelOffsets } = useRuler(model, scale);
  const ref = useRef<HTMLDivElement>(null);

  const range = model.range;

  const handleMouseDown = (ev: React.MouseEvent<HTMLElement>) => {
    ev.stopPropagation();
    ev.preventDefault();

    if (!ref.current) return;

    // start drag
    const startX = ev.clientX;
    const bounding = ref.current.getBoundingClientRect();
    const startOffset = startX - bounding.left;
    model.setFrame(Math.round(startOffset / scale));

    const _handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      let newOffset = startOffset + dx;

      // 钳制到 range
      if (newOffset < range[0] * scale) newOffset = range[0] * scale;
      if (newOffset > range[1] * scale) newOffset = range[1] * scale;

      model.setFrame(Math.round(newOffset / scale));
    };

    const _handleMouseUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', _handleMouseMove);
      window.removeEventListener('mouseup', _handleMouseUp);
    };

    window.addEventListener('mousemove', _handleMouseMove);
    window.addEventListener('mouseup', _handleMouseUp);
  };

  return (
    <div ref={ref} className='MD-Timeline-Ruler' style={{ background }} onMouseDown={handleMouseDown}>
      {labelOffsets.map(d => (
        <code key={d.offset} className='label' style={{ transform: `translateX(${d.offset}px)` }}>
          {d.text}
        </code>
      ))}
    </div>
  );
};

Timeline.Cursor = ({ model, scale }: ITimelineProps & { scale: number }) => {
  const fu = useForceUpdate();
  useListen(model.movieClip.event, 'afterFrameChange', () => fu.update());

  const range = model.range;

  const handleMouseDown = (ev: React.MouseEvent<HTMLElement>) => {
    ev.stopPropagation();
    ev.preventDefault();

    // start drag
    const startX = ev.clientX;
    const startOffset = offset;

    const _handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      let newOffset = startOffset + dx;

      // 钳制到 range
      if (newOffset < range[0] * scale) newOffset = range[0] * scale;
      if (newOffset > range[1] * scale) newOffset = range[1] * scale;

      model.setFrame(Math.round(newOffset / scale));
    };

    const _handleMouseUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', _handleMouseMove);
      window.removeEventListener('mouseup', _handleMouseUp);
    };

    window.addEventListener('mousemove', _handleMouseMove);
    window.addEventListener('mouseup', _handleMouseUp);
  };

  const offset = model.frame * scale;

  return (
    <div
      className='MD-Timeline-Cursor'
      style={{ transform: `translateX(${offset}px)` }}
      onMouseDown={handleMouseDown}
    />
  );
};

Timeline.Track = ({
  className,
  style,
  model,
  scale,
  track,
  node,
}: ITimelineProps & { track: IMovieClipTrackItem; scale: number; node: ITreeNodeRTInfo }) => {
  const ref = useRef<HTMLDivElement>(null);
  const fu = useForceUpdate();

  const [offset, setOffset] = useState<number>(track.startTime * scale);
  const [length, setLength] = useState<number>(track.duration * (track.speedRatio || 1) * scale);
  const [dragging, setDragging] = useState<boolean>();

  useEffect(() => setOffset(track.startTime * scale), [scale]);
  useEffect(() => setLength(track.duration * (track.speedRatio || 1) * scale), [scale]);

  const handleMouseDown = (ev: React.MouseEvent<HTMLElement>) => {
    ev.stopPropagation();
    ev.preventDefault();

    // select
    model.outline.resetSelect([track.key]);

    // start drag
    const startX = ev.clientX;
    const startOffset = offset;

    const _handleMouseMove = (ev: MouseEvent) => {
      const dx = ev.clientX - startX;
      let newOffset = startOffset + dx;

      // 钳制到 0
      if (newOffset < 0) newOffset = 0;

      setOffset(newOffset);
      setDragging(true);

      model.updateTrack(track.key, { startTime: Math.round(newOffset / scale) }, true);
    };

    const _handleMouseUp = (ev: MouseEvent) => {
      window.removeEventListener('mousemove', _handleMouseMove);
      window.removeEventListener('mouseup', _handleMouseUp);

      setDragging(false);
    };

    window.addEventListener('mousemove', _handleMouseMove);
    window.addEventListener('mouseup', _handleMouseUp);
  };

  const select = model.outline.selectedIds.includes(node.node.id);
  const active = model.activeKeys.includes(track.key);

  return (
    <div className={cx(className, 'MD-Timeline-Track', { select, active })} style={style}>
      <i
        className='track-block'
        ref={ref}
        style={{ width: length, transform: `translateX(${offset}px)` }}
        onMouseDown={handleMouseDown}
      >
        <code className='label'>{track.startTime.toFixed(1)}</code>
        <code className='label' style={{ transform: `translateX(${length}px)` }}>
          {(track.startTime + track.duration).toFixed(1)}
        </code>
      </i>
    </div>
  );
};
