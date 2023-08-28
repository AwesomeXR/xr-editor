import React, { useContext } from 'react';
import { Col, Descriptions, Empty, QRCode, Row, Typography } from 'antd';
import { XREditorContext } from '../XREditorContext';
import { IXREditorPublishData } from '../IXREditorConfig';
import dayjs from 'dayjs';

export interface IPublishDataPanelProps {
  className?: string;
  style?: React.CSSProperties;

  data?: IXREditorPublishData;
}

const Desc = Descriptions;

export const PublishDataPanel = ({ className, style, data }: IPublishDataPanelProps) => {
  const ctx = useContext(XREditorContext);

  if (!data) data = ctx.project.latestPublishData;

  return (
    <div data-name='PublishDataPanel' className={className} style={{ padding: 8, ...style }}>
      {data ? (
        <Row>
          <Desc size='small' column={1} style={{ flex: 1, width: 1 }}>
            <Desc.Item label='发布时间'>{dayjs(data.timestamp).format('YYYY-MM-DD HH:mm:ss')}</Desc.Item>
            <Desc.Item label='发布标题'>{data.rtConfig.title}</Desc.Item>
            <Desc.Item label='访问地址'>
              <Typography.Link copyable href={data.indexEntryURL} target='_blank'>
                {data.indexEntryURL}
              </Typography.Link>
            </Desc.Item>
            <Desc.Item label='baseURL'>
              <Typography.Text copyable>{data.mfs.url}</Typography.Text>
            </Desc.Item>
            <Desc.Item label='indexKey'>
              <Typography.Text copyable>{data.mfs.indexKey}</Typography.Text>
            </Desc.Item>
          </Desc>

          <QRCode value={data.indexEntryURL} size={180} style={{ marginLeft: 16 }} />
        </Row>
      ) : (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description='暂无发布结果' />
      )}
    </div>
  );
};
