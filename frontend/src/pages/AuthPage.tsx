import { Card, Button, Form, Input, Typography } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Title } = Typography;

export default function AuthPage() {
  const navigate = useNavigate();

  const onFinish = () => {
    navigate('/dashboard');
  };

  return (
    <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3}>Вход в CRM</Title>
      </div>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Пожалуйста, введите ваш email' }]}>
          <Input placeholder="admin@example.com" />
        </Form.Item>
        <Form.Item label="Пароль" name="password" rules={[{ required: true, message: 'Пожалуйста, введите пароль' }]}>
          <Input.Password placeholder="Введите пароль" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Войти
        </Button>
      </Form>
    </Card>
  );
}
