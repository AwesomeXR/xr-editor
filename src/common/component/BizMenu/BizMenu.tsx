import React, { useContext, useEffect, useRef, useState } from 'react';
import './style.less';
import cx from 'classnames';
import { CaretRightOutlined } from '@ant-design/icons';
import _ from 'lodash';
import { theme } from 'antd';
import { BizIcon, IBizIconName } from '../BizIcon';

export type IBizMenuItem = {
  title: string;
  icon?: IBizIconName;

  command?: string;
  arg?: string;

  hotkey?: string;

  active?: boolean;
  disabled?: boolean;

  children?: IBizMenuItem[];
};

export interface IBizMenuProps {
  className?: string;
  style?: React.CSSProperties;

  items: IBizMenuItem[];

  onCheckEnabled?: (command: string, arg?: string) => boolean;
  onCommand?: (command: string, arg?: string) => any;
  cursor?: { x: number; y: number };
}

export const BizMenu = ({
  className,
  style,
  items,
  cursor = { x: 0, y: 0 },
  onCheckEnabled,
  onCommand,
}: IBizMenuProps) => {
  const { token } = theme.useToken();
  const bizMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const _bodySize = document.body.getBoundingClientRect();
    const MenuListEl = document.querySelectorAll<HTMLDivElement>('section.BizMenu-list');
    MenuListEl.forEach((menu, i) => {
      const childSize = menu.getBoundingClientRect();
      //第一层是BizMenu
      if (i === 0 && childSize.height > _bodySize.height - cursor.y)
        return (menu.parentElement!.style.top = `${cursor.y - childSize.height}px`);

      if (i === 0) return (menu.parentElement!.style.top = cursor.y + 'px');

      if (childSize.height > _bodySize.height - cursor.y) return (menu.style.top = `-${childSize.height - 28}px`);
    });
  }, [items]);

  const handleClickItem = (item: IBizMenuItem) => {
    if (onCommand && item.command) onCommand(item.command, item.arg);
  };

  const renderIcon = (icon?: React.ReactNode) => {
    if (!icon) return null;
    if (typeof icon === 'string') return <BizIcon name={icon as any} />;
    return icon;
  };

  const renderItem = (item: IBizMenuItem, i: number) => {
    const disabled =
      typeof item.disabled === 'boolean'
        ? item.disabled
        : onCheckEnabled
        ? item.command
          ? !onCheckEnabled(item.command, item.arg)
          : false
        : false;

    return (
      <div key={i} className={cx('BizMenu-item', { 'has-children': item.children, active: item.active, disabled })}>
        <div
          className='BizMenu-item-content'
          onClick={() => {
            if (!disabled) handleClickItem(item);
          }}
        >
          <i className='icon'>{renderIcon(item.icon)}</i>
          <div className='text'>{item.title}</div>
          <div className='hotkey'>{item.hotkey}</div>
          <CaretRightOutlined className='children-arrow' />
        </div>

        {item.children && renderList(item.children)}
      </div>
    );
  };

  const renderList = (list: IBizMenuItem[]) => {
    let listWidth: number = _.max(
      list.map(d => {
        let _width = 4 + 4 + 24 + 4 + 4 + 4 + 4;

        _width += d.title.length * 20 + 8; // text

        if (d.hotkey) _width += d.hotkey.length * 16 + 8; // hotkey
        if (d.children) _width += 16; // children-arrow

        return _width;
      })
    ) as any;

    if (listWidth < 128) listWidth = 128;

    return (
      <section className='BizMenu-list' style={{ width: listWidth }} ref={bizMenuRef}>
        {list.map((child, i) => renderItem(child, i))}
      </section>
    );
  };

  return (
    <div
      data-name='BizMenu'
      className={cx('BizMenu', className)}
      style={
        {
          '--color-primary': token.colorPrimary,
          position: 'absolute',
          top: cursor.y,
          left: cursor.x,
          ...style,
        } as any
      }
    >
      {renderList(items)}
    </div>
  );
};
