import React, { useContext, useRef } from 'react';
import cx from 'classnames';
import { FWContext } from './FWContext';
import { IWBSidePanel } from './IWBLayout';
import { FlexibleLayout } from './FlexibleLayout';
import { ComponentIcon } from './ComponentIcon';
import { useForceUpdate } from '../../hook';
import { AppstoreOutlined } from '@ant-design/icons';

export interface IFlexibleSidePanelContainerProps {
  className?: string;
  style?: React.CSSProperties;
}

export const FlexibleSidePanelContainer = ({ className, style }: IFlexibleSidePanelContainerProps) => {
  const ctx = useContext(FWContext);
  const fu = useForceUpdate();

  const ref = useRef<HTMLDivElement>(null);

  const { sidePanel } = ctx.config;
  if (!sidePanel) return null; // 侧边栏不可见

  const activePanel: IWBSidePanel | undefined = sidePanel.list[sidePanel.activeIdx] as any;

  const handleResize = (ev: React.MouseEvent<HTMLDivElement>) => {
    ev.preventDefault();
    ev.stopPropagation();

    if (!activePanel) return;

    const _container = ref.current;
    if (!_container) return;

    const startX = ev.clientX;
    const startWidth = sidePanel.width;

    const _handleMouseMove = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();

      const deltaX = ev.clientX - startX;
      const newWidth = startWidth + deltaX;

      _container.style.width = newWidth + 'px';
      sidePanel.width = newWidth;

      ctx.event.emit('afterConfigChange', { source: activePanel.layout, skipRefresh: true });
    };

    const _handleMouseUp = (ev: MouseEvent) => {
      ev.preventDefault();
      ev.stopPropagation();
      document.removeEventListener('mousemove', _handleMouseMove);
      document.removeEventListener('mouseup', _handleMouseUp);

      ctx.event.emit('afterConfigChange', { source: activePanel.layout });
      ctx.event.emit('reflow', null);
    };

    document.addEventListener('mousemove', _handleMouseMove);
    document.addEventListener('mouseup', _handleMouseUp);
  };

  const handleSwitchPanel = (idx: number) => {
    if (idx === sidePanel.activeIdx) sidePanel.activeIdx = -1;
    else sidePanel.activeIdx = idx;

    fu.update();

    ctx.event.emit('afterConfigChange', { skipRefresh: true });

    // 由于切换面板会导致布局变化，所以需要延迟触发刷新(等待 react 渲染完成)
    setTimeout(() => {
      ctx.event.emit('reflow', null);
    }, 0);
  };

  return (
    <div
      ref={ref}
      className={cx(className, 'FW-SidePanelContainer', { expanded: !!activePanel })}
      style={{ width: activePanel ? sidePanel.width : undefined, ...style }}
    >
      <ul className='FW-SidePanelContainer-side'>
        <li className={cx({ active: !activePanel })} onClick={() => handleSwitchPanel(-1)}>
          <AppstoreOutlined />
        </li>

        {sidePanel.list.map((panel, idx) => {
          if (panel.layout.type !== 'Component') return null;
          return (
            <li
              key={idx}
              title={ctx.renderTitle(panel.layout)}
              className={cx({ active: panel === activePanel })}
              onClick={() => handleSwitchPanel(idx)}
            >
              <ComponentIcon layout={panel.layout} />
            </li>
          );
        })}
      </ul>

      {activePanel && (
        <>
          <FWContext.Provider key={activePanel.layout.key} value={{ ...ctx, currentLayout: activePanel.layout }}>
            <FlexibleLayout className='FW-SidePanelContainer-main' />
          </FWContext.Provider>
          <div className='FW-SidePanelContainer-resizer' onMouseDown={handleResize} />
        </>
      )}
    </div>
  );
};
