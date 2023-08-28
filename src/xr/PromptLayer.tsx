import React, { useContext, useState } from 'react';
import { XREditorContext } from './XREditorContext';
import { Form, Modal } from 'antd';
import { Schema } from 'ah-api-type';
import { SchemaFormItems, useListen } from '../common';

export const PromptLayer = () => {
  const ctx = useContext(XREditorContext);
  const [form] = Form.useForm();

  const [openInfo, setOpenInfo] = useState<{ visible: boolean; title?: string; schema?: Schema; defaultValue?: any }>({
    visible: false,
  });

  useListen(ctx.event, 'promptQuery', ev => {
    setOpenInfo({ visible: true, ...ev });
  });

  const handleFinish = (value: any) => {
    ctx.event.emit('promptResponse', { value });
    setOpenInfo({ ...openInfo, visible: false });
  };

  const handleOk = () => {
    form.submit();
  };

  const handleClose = () => {
    ctx.event.emit('promptResponse', { value: null });
    setOpenInfo({ ...openInfo, visible: false });
  };

  const renderContent = () => {
    if (!openInfo || !openInfo.schema) return null;

    return (
      <Form labelWrap form={form} size='small' initialValues={openInfo.defaultValue} onFinish={handleFinish}>
        <SchemaFormItems rootSchema={openInfo.schema} />
      </Form>
    );
  };

  return (
    <Modal
      destroyOnClose
      open={openInfo?.visible}
      title={openInfo.title || '提示'}
      onCancel={handleClose}
      onOk={handleOk}
    >
      {renderContent()}
    </Modal>
  );
};
