import { Typography } from 'antd';
import React from 'react';

export class ErrorBoundary extends React.Component<{ children: any }> {
  state = { errorMsg: '' };

  static getDerivedStateFromError(error: Error) {
    // Update state so the next render will show the fallback UI.
    return { errorMsg: error.message };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    // You can also log the error to an error reporting service
    console.error(error);
  }

  render() {
    if (this.state.errorMsg) {
      // You can render any custom fallback UI
      return <Typography.Text type='danger'>{this.state.errorMsg}</Typography.Text>;
    }

    return this.props.children || null;
  }
}
