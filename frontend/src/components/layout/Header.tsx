import { Layout, Button, Typography, Space } from 'antd';
import { useNavigate } from 'react-router-dom';

const { Header } = Layout;
const { Text } = Typography;

export default function TopHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    navigate('/auth/login');
  };

  return (
    <Header style={{ padding: '0 24px', background: '#fff', display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
      <Space size="large">
        <Text strong>Администратор</Text>
        <Button onClick={handleLogout}>Выйти</Button>
      </Space>
    </Header>
  );
}
