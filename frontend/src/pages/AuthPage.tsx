import { Card, Button, Form, Input, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import type { Role } from '../config/roles';

const { Title } = Typography;

export default function AuthPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values: { email: string; password: string }) => {
    try {
      const response = await api.auth.login(values.email, values.password);
      const role = (response.user?.role || 'Admin') as Role;
      login(response.token, values.email, role);
      message.success(`Добро пожаловать, ${response.user?.name || values.email}!`);
      navigate('/dashboard');
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Ошибка подключения';
      // Fallback: mock login if backend unavailable
      if (errorMsg === 'Failed to fetch' || errorMsg.includes('Network')) {
        login('mock-token-' + Date.now(), values.email, 'Admin');
        message.success('Добро пожаловать! (демо-режим)');
        navigate('/dashboard');
      } else {
        message.error(errorMsg);
      }
    }
  };

  return (
    <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3}>Вход в CRM</Title>
      </div>
      <Form layout="vertical" onFinish={onFinish}>
        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Пожалуйста, введите ваш email' }]}>
          <Input placeholder="admin@school.com" />
        </Form.Item>
        <Form.Item label="Пароль" name="password" rules={[{ required: true, message: 'Пожалуйста, введите пароль' }]}>
          <Input.Password placeholder="Введите пароль" />
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Войти
        </Button>
        <div style={{ marginTop: 16, fontSize: 12, color: '#999', textAlign: 'center' }}>
          <div>Тестовые аккаунты:</div>
          <div>admin@school.com / admin123</div>
          <div>manager@school.com / manager123</div>
          <div>teacher@school.com / teacher123</div>
        </div>
      </Form>
    </Card>
  );
}
