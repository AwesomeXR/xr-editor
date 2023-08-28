import React, { useContext, useLayoutEffect, useRef } from 'react';
import cx from 'classnames';
import { FWContext } from './FWContext';
import { IWBLayoutSplit } from './IWBLayout';
import { FlexibleLayout } from './FlexibleLayout';

export interface IFlexibleSplitProps {
  className?: string;
  style?: React.CSSProperties;
}

const calcStyle = (direction: IWBLayoutSplit['direction'], ratio: number) => {
  const sizeA = `calc((100% - ${GUTTER_SIZE}px) * ${ratio})`;
  const sizeB = `calc((100% - ${GUTTER_SIZE}px) * ${1 - ratio})`;

  const ret: Record<'ca' | 'cb' | 'gutter', Record<string, string>> = { ca: {}, gutter: {}, cb: {} };

  if (direction === 'vertical') {
    ret.ca.height = sizeA;
    ret.cb.height = sizeB;
    ret.gutter.top = sizeA;
  }

  if (direction === 'horizontal') {
    ret.ca.width = sizeA;
    ret.cb.width = sizeB;
    ret.gutter.left = sizeA;
  }

  return ret;
};

const applyDraggingStyle = (
  direction: IWBLayoutSplit['direction'],
  ratio: number,
  dom: { container: HTMLDivElement; ca: HTMLDivElement; cb: HTMLDivElement; gutter: HTMLDivElement }
) => {
  const sty = calcStyle(direction, ratio);
  Object.assign(dom.ca.style, sty.ca);
  Object.assign(dom.cb.style, sty.cb);
  Object.assign(dom.gutter.style, sty.gutter);
};

interface IDraggingInfo {
  containerSize: { width: number; height: number };
  startX: number;
  startY: number;
  startRatio: number;
}

const GUTTER_SIZE = 6; // .less 里也在用
const minChildSize = 48;

export const FlexibleSplit = <C extends string>({ className, style }: IFlexibleSplitProps) => {
  const TypedFWContext = FWContext;
  const ctx = useContext(TypedFWContext);

  const layout = ctx.currentLayout;
  if (layout.type !== 'Split') return null;

  // const evBusRef = useRef(ctx._evBus);
  // evBusRef.current = ctx._evBus;

  const ref = {
    container: useRef<HTMLDivElement>(null),
    ca: useRef<HTMLDivElement>(null),
    cb: useRef<HTMLDivElement>(null),
    gutter: useRef<HTMLDivElement>(null),
  };

  useLayoutEffect(() => {
    if (ref.container.current && ref.ca.current && ref.cb.current && ref.gutter.current) {
      const dom = {
        container: ref.container.current,
        ca: ref.ca.current,
        cb: ref.cb.current,
        gutter: ref.gutter.current,
      };

      let currentRatio = layout.ratio || 0.5;
      let rInfo: IDraggingInfo | undefined = undefined;

      const handleGutterMouseDown = (ev: MouseEvent) => {
        // 记录初始信息
        rInfo = {
          containerSize: dom.container.getBoundingClientRect(),
          startX: ev.clientX,
          startY: ev.clientY,
          startRatio: currentRatio,
        };
      };

      // mouse move 的时候处理拖拽逻辑
      const handleContainerMouseMove = (ev: MouseEvent) => {
        if (!rInfo) return;

        ev.stopPropagation();
        ev.preventDefault();

        const { width, height } = rInfo.containerSize;

        const totalLength = layout.direction === 'vertical' ? height : width;
        const delta = layout.direction === 'vertical' ? ev.clientY - rInfo.startY : ev.clientX - rInfo.startX;

        let dragPos = totalLength * rInfo.startRatio + delta;

        // 钳制拖拽范围
        if (dragPos < minChildSize) dragPos = minChildSize;
        if (totalLength - minChildSize < dragPos) dragPos = totalLength - minChildSize;

        currentRatio = dragPos / totalLength;

        applyDraggingStyle(layout.direction, currentRatio, dom);
        ctx.event.emit('reflow', null);
      };

      const handleContainerMouseUp = (ev: MouseEvent) => {
        if (!rInfo) return;

        ev.stopPropagation();
        ev.preventDefault();
        rInfo = undefined;

        layout.ratio = currentRatio;
        ctx.event.emit('afterConfigChange', { source: layout });
      };

      const handleContainerMouseLeave = (ev: MouseEvent) => {
        handleContainerMouseUp(ev);
      };

      dom.gutter.addEventListener('mousedown', handleGutterMouseDown);
      dom.container.addEventListener('mousemove', handleContainerMouseMove);
      dom.container.addEventListener('mouseup', handleContainerMouseUp);
      dom.container.addEventListener('mouseleave', handleContainerMouseLeave);

      return () => {
        dom.gutter.removeEventListener('mousedown', handleGutterMouseDown);
        dom.container.removeEventListener('mousemove', handleContainerMouseMove);
        dom.container.removeEventListener('mouseup', handleContainerMouseUp);
        dom.container.removeEventListener('mouseleave', handleContainerMouseLeave);
      };
    }
  }, [layout.ratio, layout]);

  const sty = calcStyle(layout.direction, layout.ratio || 0.5);

  return (
    <div className={cx('FW-split', layout.direction, className)} ref={ref.container} style={style}>
      <div className='ca' ref={ref.ca} style={sty.ca}>
        <TypedFWContext.Provider value={{ ...ctx, currentLayout: layout.children[0] }}>
          <FlexibleLayout />
        </TypedFWContext.Provider>
      </div>
      <div className='gutter' ref={ref.gutter} style={sty.gutter} />
      <div className='cb' ref={ref.cb} style={sty.cb}>
        <TypedFWContext.Provider value={{ ...ctx, currentLayout: layout.children[1] }}>
          <FlexibleLayout />
        </TypedFWContext.Provider>
      </div>
    </div>
  );
};
