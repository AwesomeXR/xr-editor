import { Button, Checkbox, Form, Input, InputNumber, Modal, Radio, Space, Switch } from 'antd';
import React from 'react';
import './style.less';

export interface IPromptDialogProps {
  title?: string;

  className?: string;
  style?: React.CSSProperties;
}

export type IPromptDialogFormSchema =
  | { name: string; label?: string; type: 'radio'; options: { label: string; value: string | number }[] }
  | { name: string; label?: string; type: 'checkbox'; options: { label: string; value: string | number }[] }
  | { name: string; label?: string; type: 'string' }
  | { name: string; label?: string; type: 'text' }
  | { name: string; label?: string; type: 'number' }
  | { name: string; label?: string; type: 'boolean' }
  | { name: string; label?: string; type: 'file' };

export interface IPromptDialogState {
  st:
    | { type: 'init' }
    | {
        type: 'prompt';
        initialValues: any;
        schemas: IPromptDialogFormSchema[];
        extra?: { title?: string };
        resolver?: (data: any) => any;
      };
}

export class PromptDialog extends React.Component<IPromptDialogProps, IPromptDialogState> {
  state: Readonly<IPromptDialogState> = {
    st: { type: 'init' },
  };

  private get st() {
    return this.state.st;
  }

  /**
   * prompt
   */
  public async prompt<T>(schemas: IPromptDialogFormSchema[], initialValues: T, extra: { title?: string } = {}) {
    if (this.st.type === 'init') {
      return new Promise<T | null>(resolver => {
        this.setState({ st: { type: 'prompt', initialValues, schemas, resolver, extra } });
      });
    }

    return initialValues;
  }

  private handleSubmit = (data: any) => {
    if (this.st.type === 'prompt') this.st.resolver?.(data);
    this.setState({ st: { type: 'init' } });
  };

  render() {
    const { st } = this.state;
    const title = (st.type === 'prompt' ? st.extra?.title : this.props.title) || '请确认';

    const handleCancel = () => {
      if (st.type === 'prompt') st.resolver?.(null);
      this.setState({ st: { type: 'init' } });
    };

    return (
      <Modal
        className='PromptDialog'
        title={title}
        open={st.type === 'prompt'}
        footer={null}
        closeIcon={false}
        closable={false}
        width={600}
        destroyOnClose
      >
        {st.type === 'prompt' && (
          <Form initialValues={st.initialValues} onFinish={this.handleSubmit} size='small'>
            {st.schemas.map(s => {
              const label = s.label || s.name;
              return (
                <Form.Item
                  key={s.name}
                  label={label}
                  name={s.name}
                  valuePropName={s.type === 'boolean' ? 'checked' : undefined}
                >
                  {s.type === 'string' ? (
                    <Input />
                  ) : s.type === 'text' ? (
                    <Input.TextArea autoSize={{ minRows: 3, maxRows: 6 }} />
                  ) : s.type === 'boolean' ? (
                    <Switch />
                  ) : s.type === 'number' ? (
                    <InputNumber />
                  ) : s.type === 'radio' ? (
                    <Radio.Group options={s.options} />
                  ) : s.type === 'checkbox' ? (
                    <Checkbox.Group options={s.options} />
                  ) : s.type === 'file' ? (
                    <FileInputWrapper />
                  ) : (
                    <Input />
                  )}
                </Form.Item>
              );
            })}

            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={handleCancel}>取消</Button>
              <Button type='primary' htmlType='submit'>
                确定
              </Button>
            </Space>
          </Form>
        )}
      </Modal>
    );
  }
}

const FileInputWrapper = (p: any) => {
  return <input type='file' onChange={ev => p.onChange?.(ev.target.files![0])} />;
};
