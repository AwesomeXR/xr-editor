import React, { useLayoutEffect, useRef, useState } from 'react';
import { IBizMenuItem } from '../BizMenu';
import { Button, Space } from 'antd';
import { FloatBizMenu } from '../FloatBizMenu/FloatBizMenu';
import { findParentHTMLElement } from '../../lib/findParentHTMLElement';
import _ from 'lodash';
import cx from 'classnames';
import './style.less';

export type IDatasourceItem = {
  title: string;
  items: IBizMenuItem[];
  active?: boolean;
};

export interface IBizMenuBarProps {
  className?: string;
  style?: React.CSSProperties;

  datasource: IDatasourceItem[];

  onCheckEnabled?: (command: string, arg?: string) => boolean;
  onCommand?: (cmd: string, arg?: string) => any;
}

export const BizMenuBar = ({ className, style, datasource, onCommand, onCheckEnabled }: IBizMenuBarProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const [activeData, setActiveData] = useState<{ cursor: { x: number; y: number }; data: IDatasourceItem }>();

  useLayoutEffect(() => {
    if (!ref.current || !activeData) return;

    const hoverEleList: { ele: HTMLElement; box: DOMRect }[] = [];
    ref.current
      .querySelectorAll('.BizMenuBar-MenuBtn')
      .forEach(btn => hoverEleList.push({ ele: btn as any, box: btn.getBoundingClientRect() }));

    const _handleMouseMove = _.throttle((ev: MouseEvent) => {
      hoverEleList.some(({ box }, i) => {
        if (datasource[i] === activeData.data) return false;

        const toHover =
          _.inRange(ev.clientX, box.x, box.x + box.width) && _.inRange(ev.clientY, box.y, box.y + box.height);

        if (toHover) {
          setActiveData({ cursor: { x: box.left, y: box.bottom + 2 }, data: datasource[i] });
          return true;
        }
      });
    }, 50);

    document.body.addEventListener('mousemove', _handleMouseMove);

    return () => {
      _handleMouseMove.cancel();
      document.body.removeEventListener('mousemove', _handleMouseMove);
    };
  }, [activeData]);

  const handleClickBtn = (ev: React.MouseEvent<any, MouseEvent>, target: IDatasourceItem) => {
    if (activeData) {
      setActiveData(undefined);
      return;
    }

    let _cursor = { x: ev.clientX, y: ev.clientY };

    const btnEle =
      ev.target instanceof HTMLElement && findParentHTMLElement(ev.target, ele => ele.classList.contains('ant-btn'));

    if (btnEle) {
      const _btnRect = btnEle.getBoundingClientRect();
      _cursor.x = _btnRect.left;
      _cursor.y = _btnRect.bottom + 2;
    }

    setActiveData({ cursor: { x: _cursor.x, y: _cursor.y }, data: target });
  };

  return (
    <>
      <div ref={ref} className={cx('BizMenuBar', className)} style={{ ...style }}>
        <Space size={2}>
          {datasource.map((dItem, i) => {
            const isActive = dItem === activeData?.data;

            return (
              <Button
                key={i}
                size='small'
                className='BizMenuBar-MenuBtn'
                type={isActive ? 'primary' : 'text'}
                onMouseDown={ev => handleClickBtn(ev, dItem)}
              >
                <span className='text'>{dItem.title}</span>
              </Button>
            );
          })}
        </Space>
      </div>

      {activeData && (
        <FloatBizMenu
          visible
          cursor={activeData.cursor}
          items={activeData.data.items}
          onCheckEnabled={onCheckEnabled}
          onCommand={onCommand}
          onClose={() => setActiveData(undefined)}
        />
      )}
    </>
  );
};
