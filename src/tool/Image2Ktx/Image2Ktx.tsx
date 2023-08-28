import { Card, Col, Row } from 'antd';
import React, { useState } from 'react';

export interface IImage2KtxProps {
  className?: string;
  style?: React.CSSProperties;
}

export const Image2Ktx = ({ className, style }: IImage2KtxProps) => {
  const [loadedImg, setLoadedImg] = useState<{ url: string }>({
    url: 'https://rshop.tech/gw/assets/upload/202308111053564.jpeg',
  });

  const handleFileDrop = (ev: React.DragEvent<HTMLDivElement>) => {
    ev.preventDefault();
    ev.stopPropagation();

    // 从event中获取文件列表
    const files = ev.dataTransfer.files;

    // 检测是否是拖拽文件到页面的操作
    if (files.length === 0) return false;
    // 检测文件是不是图片
    else if (files[0].type.indexOf('image') === -1) {
      alert('拖的不是图片！');
      return false;
    }
    //
    else if (
      files[0].type !== 'image/png' &&
      files[0].type !== 'image/jpg' &&
      files[0].type !== 'image/jpeg' &&
      files[0].type !== 'image/gif'
    ) {
      alert('图片仅限于png、jpg、gif格式！');
      return false;
    }

    // 检测通过，执行后续操作
    // 1.获取文件
    const file = files[0];
    // 2.创建读取文件的对象
    const reader = new FileReader();
    // 3.读取文件
    reader.readAsDataURL(file);

    // 4.读取成功后执行的方法函数
    reader.onload = function (e) {
      const url = e.target?.result as string;
      setLoadedImg({ url });
    };
  };

  return (
    <div
      data-name='Image2Ktx'
      className={className}
      style={{ height: '100%', width: '100%', ...style }}
      onDragOver={ev => ev.preventDefault()}
      onDrop={handleFileDrop}
    >
      <Row align='middle' style={{ height: '100%' }}>
        <Col span={10} style={{ height: '100%' }}>
          <Card size='small' title='原始图片' bodyStyle={{ height: 'calc(100% - 40px)' }}>
            {loadedImg ? (
              <img
                src={loadedImg.url}
                alt='原始图片'
                style={{ display: 'block', maxWidth: '100%', objectFit: 'contain' }}
              />
            ) : (
              <div>拖入此处</div>
            )}
          </Card>
        </Col>
        <Col span={4}>B</Col>
        <Col span={10}>
          <Card size='small' title='转换后图片'></Card>
        </Col>
      </Row>
    </div>
  );
};
