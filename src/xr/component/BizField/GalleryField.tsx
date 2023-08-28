import { Button, Card, Col, Empty, Modal, Row } from 'antd';
import React, { useState } from 'react';

export type IGalleryOptionItem = {
  label: string;
  value: string;
  snapshot: string;
};

export interface IGalleryFieldProps {
  className?: string;
  style?: React.CSSProperties;

  options: IGalleryOptionItem[];
  snapshotStyle?: React.CSSProperties;

  value?: string;
  defaultValue?: string;

  onChange?: (value: string | null) => any;
}

/** 画廊 */
export const GalleryField = ({
  className,
  style,
  onChange,
  snapshotStyle,
  value,
  defaultValue,
  options,
}: IGalleryFieldProps) => {
  const [stash, setStash] = useState<string>(value || defaultValue || '');
  const [panelVisible, setPanelVisible] = useState<boolean>();

  const handleSelect = (item: IGalleryOptionItem) => {
    setStash(item.value);
    setPanelVisible(false);
    onChange?.(item.value);
  };

  let previewURL: string | undefined;

  const _snap = options.find(item => item.value === stash)?.snapshot;
  if (_snap) previewURL = _snap;
  else if (stash.match(/\.(jpg|jpeg|png|gig)/i)) previewURL = stash;

  return (
    <>
      <div data-name='GalleryField' className={className} style={style}>
        {previewURL ? (
          <img
            src={previewURL}
            style={{ display: 'block', width: '100%', cursor: 'pointer', ...snapshotStyle }}
            onClick={() => setPanelVisible(true)}
          />
        ) : stash ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ display: 'block', width: '100%', cursor: 'pointer' }}
            description={'暂无预览'}
          >
            <Button size='small' onClick={() => setPanelVisible(true)}>
              选择图片
            </Button>
          </Empty>
        ) : (
          <Button size='small' onClick={() => setPanelVisible(true)}>
            选择图片
          </Button>
        )}
      </div>

      <Modal open={panelVisible} title='选择图片' width={650} footer={null} onCancel={() => setPanelVisible(false)}>
        <Row gutter={16}>
          {options.map((item, i) => {
            return (
              <Col span={8} key={i}>
                <Card
                  size='small'
                  hoverable
                  cover={
                    <img
                      src={item.snapshot || item.value}
                      style={{ aspectRatio: '1', objectFit: 'cover', ...snapshotStyle }}
                    />
                  }
                  onClick={() => handleSelect(item)}
                >
                  <Card.Meta title={item.label} />
                </Card>
              </Col>
            );
          })}
        </Row>
      </Modal>
    </>
  );
};
