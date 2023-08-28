import { PlusOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import React from 'react';
import { HighlightPopover } from '../../../common/component/HighlightPopover';
import { BizList } from '../../../common/component/BizList';
import { BizIcon } from '../../../common/component/BizIcon';
import { ModelDesignOutlineModel } from './ModelDesignOutlineModel';
import { getInternalRandomString } from '../../../common';

export interface IHeaderProps {
  className?: string;
  style?: React.CSSProperties;

  model: ModelDesignOutlineModel;
}

export const Header = ({ className, style, model }: IHeaderProps) => {
  const scene = model.project.activeScene;
  if (!scene) return null;

  const host = scene.rootFlowHost;
  if (!host) return null;

  return (
    <div
      data-name='Header'
      className={className}
      style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', ...style }}
    >
      <HighlightPopover
        icon={<PlusOutlined />}
        defaultBtnType='primary'
        content={opt => (
          <BizList
            items={[
              {
                icon: <BizIcon name='light_sun' />,
                title: '平行光',
                disabled: host.flowNodeManager.all.some(n => n._define.className === 'DirectionalLightNode'),
                onConfirm: async () => {
                  const ID = getInternalRandomString();

                  return model.project.command
                    .execute('Scene_AddFlowNode', { className: 'DirectionalLightNode', name: '平行光', ID })
                    .ret.then(() => {
                      model.outline?.navTo(`__Light/${ID}`);
                      opt.close();
                    });
                },
              },
            ]}
            style={{ width: 150 }}
          />
        )}
      >
        添加
      </HighlightPopover>
    </div>
  );
};
