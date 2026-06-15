import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Typography, Space, Popconfirm, Tooltip, Empty } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { hasPermission, roleConfig, type Role } from '../config/roles';

const { Title } = Typography;

const initialUsers = [
  { key: '1', name: 'Админ Админов', email: 'admin@school.com', role: 'Admin' as Role, status: 'Активен' },
  { key: '2', name: 'Менеджер Менеджеров', email: 'manager@school.com', role: 'Manager' as Role, status: 'Активен' },
  { key: '3', name: 'Анна Преподаватель', email: 'anna@school.com', role: 'Teacher' as Role, status: 'Заблокирован' },
];

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<typeof initialUsers[0] | null>(null);
  const [form] = Form.useForm();

  const currentUserRole = useAuthStore((s) => s.user?.role);
  const currentUsername = useAuthStore((s) => s.user?.username);

  const canCreate = hasPermission(currentUserRole, 'users.create');
  const canEdit = hasPermission(currentUserRole, 'users.edit');
  const canDelete = hasPermission(currentUserRole, 'users.delete');
  const canToggleStatus = hasPermission(currentUserRole, 'users.toggle_status');

  const handleToggleStatus = (key: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Активен' ? 'Заблокирован' : 'Активен';
    setUsers(users.map(u => u.key === key ? { ...u, status: newStatus } : u));
    message.success(`Статус изменен на "${newStatus}"`);
  };

  const handleDelete = (key: string) => {
    const target = users.find(u => u.key === key);
    // Manager cannot delete Admin
    if (currentUserRole === 'Manager' && target?.role === 'Admin') {
      message.error('Менеджер не может удалить администратора');
      return;
    }
    setUsers(users.filter(u => u.key !== key));
    message.success('Сотрудник удален');
  };

  const openEditModal = (user: typeof initialUsers[0]) => {
    setEditingUser(user);
    form.setFieldsValue(user);
    setIsModalVisible(true);
  };

  const openCreateModal = () => {
    setEditingUser(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleSave = () => {
    form.validateFields().then(values => {
      if (editingUser) {
        // Manager cannot change role to Admin
        if (currentUserRole === 'Manager' && values.role === 'Admin') {
          message.error('Менеджер не может назначить роль администратора');
          return;
        }
        setUsers(users.map(u => u.key === editingUser.key ? { ...u, ...values } : u));
        message.success('Данные обновлены!');
      } else {
        // Manager cannot create Admin
        if (currentUserRole === 'Manager' && values.role === 'Admin') {
          message.error('Менеджер не может создать администратора');
          return;
        }
        const newUser = { key: Date.now().toString(), ...values, status: 'Активен' };
        setUsers([...users, newUser]);
        message.success('Пользователь успешно создан!');
      }
      setIsModalVisible(false);
    });
  };

  const columns = [
    { title: 'Имя', dataIndex: 'name', key: 'name' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Роль',
      dataIndex: 'role',
      key: 'role',
      render: (role: Role) => {
        const config = roleConfig[role];
        return <Tag color={config?.color || 'default'}>{config?.label || role}</Tag>;
      },
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'Активен' ? 'green' : 'default'}>{status}</Tag>
      ),
    },
    {
      title: 'Управление',
      key: 'actions',
      render: (_: any, record: typeof initialUsers[0]) => {
        const isSelf = record.email === currentUsername;
        const isAdminTarget = record.role === 'Admin';
        const isManager = currentUserRole === 'Manager';

        return (
          <Space size="middle">
            {canEdit ? (
              <Tooltip title="Редактировать">
                <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
              </Tooltip>
            ) : (
              <Tooltip title="Нет прав">
                <Button type="text" icon={<EditOutlined />} disabled />
              </Tooltip>
            )}

            {canToggleStatus && !isSelf ? (
              <Tooltip title={record.status === 'Активен' ? 'Заблокировать' : 'Разблокировать'}>
                <Button
                  type="text"
                  icon={record.status === 'Активен' ? <LockOutlined /> : <UnlockOutlined />}
                  onClick={() => handleToggleStatus(record.key, record.status)}
                  disabled={isManager && isAdminTarget}
                />
              </Tooltip>
            ) : (
              <Tooltip title={isSelf ? 'Нельзя заблокировать себя' : 'Нет прав'}>
                <Button type="text" icon={<LockOutlined />} disabled />
              </Tooltip>
            )}

            {canDelete && !isSelf ? (
              <Popconfirm title="Удалить сотрудника?" onConfirm={() => handleDelete(record.key)} okText="Да" cancelText="Нет">
                <Button type="text" danger icon={<DeleteOutlined />} disabled={isManager && isAdminTarget} />
              </Popconfirm>
            ) : (
              <Tooltip title={isSelf ? 'Нельзя удалить себя' : 'Нет прав'}>
                <Button type="text" danger icon={<DeleteOutlined />} disabled />
              </Tooltip>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Сотрудники (CRM Пользователи)</Title>
        {canCreate && (
          <Button type="primary" icon={<UserAddOutlined />} onClick={openCreateModal}>
            Добавить сотрудника
          </Button>
        )}
      </div>

      <Table columns={columns} dataSource={users} rowKey="key" locale={{ emptyText: <Empty description="Нет сотрудников" /> }} />

      <Modal
        title={editingUser ? 'Редактировать сотрудника' : 'Добавить сотрудника'}
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="ФИО" name="name" rules={[{ required: true, message: 'Введите ФИО' }]}>
            <Input placeholder="Введите имя..." />
          </Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}>
            <Input placeholder="email@school.com" />
          </Form.Item>
          {!editingUser && (
            <Form.Item label="Временный пароль" name="password" rules={[{ required: true }]}>
              <Input.Password placeholder="Пароль" />
            </Form.Item>
          )}
          <Form.Item label="Роль" name="role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Admin">Администратор</Select.Option>
              <Select.Option value="Manager">Менеджер</Select.Option>
              <Select.Option value="Teacher">Преподаватель</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
