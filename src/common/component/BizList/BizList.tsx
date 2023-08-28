import React, { useState } from 'react';
import cx from 'classnames';
import './style.less';
import { CaretRightOutlined, LoadingOutlined } from '@ant-design/icons';

export type IBizListItem = {
  icon?: any;
  title: string;
  active?: boolean;
  disabled?: boolean;
  onConfirm?: () => any;
  children?: IBizListItem[];
};

export interface IBizListProps {
  className?: string;
  style?: React.CSSProperties;

  items: IBizListItem[];
}

export const BizList = ({ className, style, items }: IBizListProps) => {
  const [loadingIndex, setLoadingIndex] = useState<number>(-1);

  const handleItemClick = (item: IBizListItem, i: number) => {
    if (!item.onConfirm || i === loadingIndex || item.disabled) return;

    const ret = item.onConfirm();

    // 如果是 Promise，那么显示 loading
    if (ret instanceof Promise) {
      setLoadingIndex(i);
      ret.finally(() => setLoadingIndex(-1));
    }
  };

  const renderItem = (item: IBizListItem, i: number) => {
    const hasChildren = item.children && item.children.length;
    const isLoading = loadingIndex === i;

    return (
      <li
        key={i}
        className={cx('BizList-item', {
          hasIcon: item.icon,
          hasChildren,
          isLoading,
          disabled: item.disabled,
          active: item.active,
        })}
        onClick={() => handleItemClick(item, i)}
      >
        <span className='icon'> {isLoading ? <LoadingOutlined /> : item.icon}</span>
        <span className='title'>{item.title}</span>
        {hasChildren && <CaretRightOutlined className='tail-icon' />}
        {hasChildren && <BizList className='children' items={item.children!} />}
      </li>
    );
  };

  return (
    <ul data-name='BizList' className={cx(className, 'BizList')} style={style}>
      {items.map((item, i) => renderItem(item, i))}
    </ul>
  );
};
