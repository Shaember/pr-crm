import { Layout, Button, Typography, Space, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { roleConfig } from '../../config/roles';

const { Header } = Layout;
const { Text } = Typography;

export default function TopHeader() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    logout();
    navigate('/auth/login');
  };

  const role = user?.role;
  const config = role ? roleConfig[role] : null;

  return (
    <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      <Space size="middle">
        <Text strong>{user?.username || 'Гость'}</Text>
        {config && <Tag color={config.color}>{config.label}</Tag>}
        <Button onClick={handleLogout}>Выйти</Button>
      </Space>
    </Header>
  );
}
