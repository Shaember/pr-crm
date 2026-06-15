import { Layout, Menu, Typography } from 'antd';
import { UserOutlined, BookOutlined, CalendarOutlined, DollarOutlined, DashboardOutlined, TeamOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { hasPermission } from '../../config/roles';

const { Sider } = Layout;
const { Title } = Typography;

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const role = useAuthStore((s) => s.user?.role);

  const allItems = [
    { key: '/dashboard', icon: <DashboardOutlined />, label: 'Дашборд', permission: 'dashboard' },
    { key: '/students', icon: <UserOutlined />, label: 'Студенты', permission: 'students' },
    { key: '/courses', icon: <BookOutlined />, label: 'Курсы', permission: 'courses' },
    { key: '/calendar', icon: <CalendarOutlined />, label: 'Расписание', permission: 'calendar' },
    { key: '/payments', icon: <DollarOutlined />, label: 'Платежи', permission: 'payments' },
    { key: '/users', icon: <TeamOutlined />, label: 'Сотрудники', permission: 'users' },
  ];

  const items = allItems
    .filter(item => hasPermission(role, item.permission))
    .map(({ permission, ...rest }) => rest);

  return (
    <Sider collapsible theme="dark" width={250} style={{ borderRight: '1px solid #1f1f1f' }}>
      <div style={{ height: 64, margin: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Title level={3} style={{ color: '#fff', margin: 0, letterSpacing: '2px' }}>
          CRM PRO
        </Title>
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[location.pathname]}
        items={items}
        onClick={({ key }) => navigate(key)}
        style={{ padding: '0 8px' }}
      />
    </Sider>
  );
}
