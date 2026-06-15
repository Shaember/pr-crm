import { Card, Button, Form, Input, Typography, message, Select } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { api } from '../services/api';
import type { Role } from '../config/roles';

const { Title } = Typography;

export default function AuthPage() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  const onFinish = async (values: { email: string; password: string; role: Role }) => {
    try {
      const { token } = await api.auth.login(values.email, values.password);
      login(token, values.email, values.role || 'Admin');
      message.success('Добро пожаловать!');
      navigate('/dashboard');
    } catch {
      // Fallback: mock login if backend unavailable
      login('mock-token-' + Date.now(), values.email, values.role || 'Admin');
      message.success('Добро пожаловать! (демо-режим)');
      navigate('/dashboard');
    }
  };

  return (
    <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <Title level={3}>Вход в CRM</Title>
      </div>
      <Form layout="vertical" onFinish={onFinish} initialValues={{ role: 'Admin' }}>
        <Form.Item label="Email" name="email" rules={[{ required: true, message: 'Пожалуйста, введите ваш email' }]}>
          <Input placeholder="admin@example.com" />
        </Form.Item>
        <Form.Item label="Пароль" name="password" rules={[{ required: true, message: 'Пожалуйста, введите пароль' }]}>
          <Input.Password placeholder="Введите пароль" />
        </Form.Item>
        <Form.Item label="Роль (демо)" name="role" rules={[{ required: true }]}>
          <Select>
            <Select.Option value="Admin">Администратор</Select.Option>
            <Select.Option value="Manager">Менеджер</Select.Option>
            <Select.Option value="Teacher">Преподаватель</Select.Option>
          </Select>
        </Form.Item>
        <Button type="primary" htmlType="submit" block size="large">
          Войти
        </Button>
      </Form>
    </Card>
  );
}
