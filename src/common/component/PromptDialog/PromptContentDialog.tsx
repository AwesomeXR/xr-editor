import { Button, Checkbox, Form, Input, InputNumber, Modal, Radio, Space, Switch } from 'antd';
import React from 'react';
import './style.less';

export interface IPromptContentDialogProps {
  className?: string;
  style?: React.CSSProperties;
}

export interface IPromptContentDialogState {
  st:
    | { type: 'init' }
    | {
        type: 'prompt';
        title: string;
        children: any;
        width: number;
        resolve: (data: any) => void;
      };
}

export class PromptContentDialog extends React.Component<IPromptContentDialogProps, IPromptContentDialogState> {
  state: Readonly<IPromptContentDialogState> = {
    st: { type: 'init' },
  };

  private get st() {
    return this.state.st;
  }

  /**
   * prompt
   */
  public async prompt<T>(render: (resolve: (data: T) => any) => any, title: string = '请确认', width: number = 600) {
    if (this.st.type === 'init') {
      return new Promise<T | null>(_resolve => {
        const resolve = (data: any) => {
          this.setState({ st: { type: 'init' } });
          _resolve(data);
        };

        this.setState({
          st: {
            type: 'prompt',
            title,
            width,
            resolve,
            children: render(resolve),
          },
        });
      });
    }

    throw new Error('state error: ' + this.st.type);
  }

  render() {
    const { st } = this.state;

    return (
      <Modal
        destroyOnClose
        className='PromptContentDialog'
        title={st.type === 'prompt' ? st.title : ''}
        open={st.type === 'prompt'}
        footer={null}
        width={st.type === 'prompt' ? st.width : 600}
        maskClosable={false}
        onCancel={() => {
          if (st.type === 'prompt') {
            st.resolve(null);
          }
        }}
      >
        {st.type === 'prompt' && st.children}
      </Modal>
    );
  }
}
