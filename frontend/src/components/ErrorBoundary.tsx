import { Component, type ReactNode } from 'react';
import { Result, Button } from 'antd';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
          <Result
            status="error"
            title="Что-то пошло не так"
            subTitle={this.state.error?.message || 'Произошла непредвиденная ошибка'}
            extra={[
              <Button type="primary" key="retry" onClick={this.handleReset}>
                Попробовать снова
              </Button>,
              <Button key="home" onClick={() => window.location.href = '/dashboard'}>
                На главную
              </Button>,
            ]}
          />
        </div>
      );
    }

    return this.props.children;
  }
}
