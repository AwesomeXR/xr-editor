import React, { useContext } from 'react';
import { XREditorContext } from '../XREditorContext';
import { InlineCell } from '../../common/component/InlineCell';
import { BizField } from './BizField';
import { Typography } from 'antd';
import { useListen } from '../../common/hook/useListen';
import { useForceUpdate } from '../../common/hook/useForceUpdate';
import cx from 'classnames';
import { CommandButton } from './CommandButton';
import { CloudDownloadOutlined, DeliveredProcedureOutlined } from '@ant-design/icons';

export interface IProjectSettingProps {
  className?: string;
  style?: React.CSSProperties;
}

export const ProjectSetting = ({ className, style }: IProjectSettingProps) => {
  const ctx = useContext(XREditorContext);
  const fu = useForceUpdate();

  useListen(ctx.project.event, 'afterMetaInfoChange', fu.update);

  return (
    <div
      data-name='ProjectSetting'
      className={cx('hideScrollbar', className)}
      style={{ padding: 8, overflow: 'auto', height: '100%', ...style }}
    >
      <InlineCell label='名称:'>
        <BizField.StringField value={ctx.project.projTitle} onChange={title => ctx.project.setMetaInfo({ title })} />
      </InlineCell>
      <InlineCell label='封面:'>
        <BizField.ImageUploader
          enableImgCrop={{ aspect: 5 / 4 }}
          value={ctx.project.projPoster}
          onChange={poster => ctx.project.setMetaInfo({ poster })}
        />
      </InlineCell>

      <CommandButton block size='small' icon={<DeliveredProcedureOutlined />} command='Export' style={{ marginTop: 8 }}>
        导出项目...
      </CommandButton>
    </div>
  );
};
