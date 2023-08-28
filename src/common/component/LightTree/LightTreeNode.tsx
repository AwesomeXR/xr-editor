import { CaretDownOutlined, CaretRightOutlined } from '@ant-design/icons';
import React, { useRef, useState } from 'react';
import cx from 'classnames';
import { BizIcon } from '../BizIcon';
import { ITreeNodeDataAction, TreeModel } from './TreeModel';
import { useForceUpdate, useListen } from '../../hook';
import { IBizMenuItem } from '../BizMenu';
import { FloatBizMenu } from '../FloatBizMenu';
import { LightTreeNodeRename } from './LightTreeNodeRename';

export interface ILightTreeNodeProps {
  className?: string;
  style?: React.CSSProperties;

  id: string;
  model: TreeModel;
}

export const LightTreeNode = ({ className, style, id, model }: ILightTreeNodeProps) => {
  const fu = useForceUpdate();
  const lightTreeNodeRef = useRef<HTMLDivElement>(null);

  const [menuOpen, setMenuOpen] = useState<{ cursor: { x: number; y: number }; items: IBizMenuItem[] }>();
  const [renaming, setRenaming] = useState<boolean>();

  useListen(model.event, 'afterNodeChange', ev => ev.id === id && fu.update(), [id]);
  useListen(model.event, 'afterSelectChange', ev => ev.ids.includes(id) && fu.update(), [id]);
  useListen(
    model.event,
    '__scrollIntoView',
    ev => {
      if (ev.id === id) {
        if (ev.source === 'API' && lightTreeNodeRef.current) {
          (lightTreeNodeRef.current as any).scrollIntoViewIfNeeded();
        }
      }
    },
    [id]
  );

  useListen(
    model.event,
    '__openContextMenu',
    ev => {
      if (ev.id === id && lightTreeNodeRef.current) {
        setMenuOpen({
          cursor: ev.cursor || calcMenuCursor(lightTreeNodeRef.current),
          items: ev.menuItems,
        });
      }
    },
    [id]
  );

  useListen(
    model.event,
    '__startRename',
    ev => {
      if (ev.id === id && lightTreeNodeRef.current) {
        setRenaming(true);
      }
    },
    [id]
  );

  const info = model.getNodeInfo(id);
  if (!info) return null;

  const indentPx = info.level * 18;

  const handleTopLevelMouseDown = (ev: React.MouseEvent<HTMLDivElement>) => {
    ev.stopPropagation();

    // 不响应 preventDefault, 否则会导致 input 无法选中
    // ev.preventDefault();

    // 左键点击，选中
    if (ev.button === 0) {
      const multiSelect = ev.metaKey || ev.ctrlKey;
      if (multiSelect) model.select(id, !info.selected, ev.currentTarget);
      else model.resetSelect([id], ev.currentTarget);
    }
  };

  const handleContextMenu = (ev: React.MouseEvent<HTMLDivElement>) => {
    ev.stopPropagation();
    ev.preventDefault();

    model.openContextMenu(id, { x: ev.clientX, y: ev.clientY });
  };

  const renderAction = (a: ITreeNodeDataAction, stable?: boolean) => {
    return (
      <i
        title={a.title}
        key={a.key}
        className={cx('LightTree-LightTreeNode-icon', { stable })}
        onMouseDown={ev => {
          ev.stopPropagation();
          ev.preventDefault();
          if (ev.button === 0) {
            model.event.emit('afterNodeAction', { node: info.node, key: a.key, source: ev.currentTarget });
          }
        }}
      >
        {a.img ? <img src={a.img} /> : <BizIcon name={a.icon} />}
      </i>
    );
  };

  const renderInner = () => {
    return (
      <div className='LightTree-LightTreeNode-inner' title={info.node.data.content}>
        <div
          className='LightTree-LightTreeNode-icon collapse-icon'
          onMouseDown={ev => {
            ev.stopPropagation();
            if (info.isLeaf) return;
            model.expand(id, !info.expended, ev.currentTarget);
          }}
        >
          {info.isLeaf ? null : info.expended ? <CaretDownOutlined /> : <CaretRightOutlined />}
        </div>

        <div className='LightTree-LightTreeNode-icon'>
          <BizIcon name={info.node.data.icon} />
        </div>

        <div className='LightTree-LightTreeNode-content'>
          {renaming ? (
            <LightTreeNodeRename
              initValue={info.node.data.content}
              onSubmit={newName => {
                model.event.emit('onNodeRename', { node: info.node, newName });
                setRenaming(false);
              }}
              onCancel={() => setRenaming(false)}
            />
          ) : (
            info.node.data.content
          )}
        </div>

        {info.node.data.subContent && (
          <div className='LightTree-LightTreeNode-subContent'>{info.node.data.subContent}</div>
        )}

        <div className='LightTree-LightTreeNode-action'>
          {info.node.data.actions?.map(a => renderAction(a))}
          {info.node.data.stableActions?.map(a => renderAction(a, true))}
        </div>
      </div>
    );
  };

  const tempSelect = menuOpen;

  return (
    <>
      <div
        ref={lightTreeNodeRef}
        data-name={id}
        className={cx('LightTree-LightTreeNode', className, {
          select: info.selected,
          disabled: info.node.data.disabled,
          tempSelect,
          editing: renaming,
        })}
        style={{ paddingLeft: indentPx, ...style }}
        onMouseDown={handleTopLevelMouseDown}
        onContextMenu={handleContextMenu}
        onDragEnter={ev => {
          if (model.disableDropOverSelect) return;

          ev.stopPropagation();
          ev.preventDefault();
          model.resetSelect([id], ev.currentTarget); // 拖拽时，自动选中
        }}
      >
        {renderInner()}
      </div>

      {menuOpen && (
        <FloatBizMenu
          visible
          items={menuOpen.items}
          cursor={menuOpen.cursor}
          onClose={() => setMenuOpen(undefined)}
          onCommand={(cmd, arg) => {
            model.event.emit('onNodeContextMenuExecute', { node: info.node, cmd, arg });
          }}
        />
      )}
    </>
  );
};

function calcMenuCursor(target: Element) {
  const box = target.getBoundingClientRect();
  return { x: box.x + box.width + 8, y: box.y };
}
