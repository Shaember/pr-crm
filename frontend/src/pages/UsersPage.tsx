import { useState } from 'react';
import { Table, Button, Modal, Form, Input, Select, Tag, message, Typography, Space, Popconfirm } from 'antd';
import { UserAddOutlined, EditOutlined, DeleteOutlined, LockOutlined, UnlockOutlined } from '@ant-design/icons';

const { Title } = Typography;

const initialUsers = [
  { key: '1', name: 'Админ Админов', email: 'admin@school.com', role: 'Admin', status: 'Активен' },
  { key: '2', name: 'Менеджер Менеджеров', email: 'manager@school.com', role: 'Manager', status: 'Активен' },
  { key: '3', name: 'Анна Преподаватель', email: 'anna@school.com', role: 'Teacher', status: 'Заблокирован' },
];

export default function UsersPage() {
  const [users, setUsers] = useState(initialUsers);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [form] = Form.useForm();

  const handleToggleStatus = (key: string, currentStatus: string) => {
    const newStatus = currentStatus === 'Активен' ? 'Заблокирован' : 'Активен';
    setUsers(users.map(u => u.key === key ? { ...u, status: newStatus } : u));
    message.success(`Статус изменен на "${newStatus}"`);
  };

  const handleDelete = (key: string) => {
    setUsers(users.filter(u => u.key !== key));
    message.success('Сотрудник удален');
  };

  const openEditModal = (user: any) => {
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
        setUsers(users.map(u => u.key === editingUser.key ? { ...u, ...values } : u));
        message.success('Данные обновлены!');
      } else {
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
    { title: 'Роль', dataIndex: 'role', key: 'role', render: (role: string) => <Tag color={role === 'Admin' ? 'red' : role === 'Manager' ? 'blue' : 'purple'}>{role}</Tag> },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (status: string) => <Tag color={status === 'Активен' ? 'green' : 'default'}>{status}</Tag> },
    {
      title: 'Управление',
      key: 'actions',
      render: (_: any, record: any) => (
        <Space size="middle">
          <Button type="text" icon={<EditOutlined />} onClick={() => openEditModal(record)} />
          <Button 
            type="text" 
            icon={record.status === 'Активен' ? <LockOutlined /> : <UnlockOutlined />} 
            onClick={() => handleToggleStatus(record.key, record.status)} 
            title={record.status === 'Активен' ? 'Заблокировать' : 'Разблокировать'}
          />
          <Popconfirm title="Удалить сотрудника?" onConfirm={() => handleDelete(record.key)} okText="Да" cancelText="Нет">
            <Button type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Сотрудники (CRM Пользователи)</Title>
        <Button type="primary" icon={<UserAddOutlined />} onClick={openCreateModal}>
          Добавить сотрудника
        </Button>
      </div>

      <Table columns={columns} dataSource={users} rowKey="key" />

      <Modal 
        title={editingUser ? "Редактировать сотрудника" : "Добавить сотрудника"} 
        open={isModalVisible} 
        onOk={handleSave} 
        onCancel={() => setIsModalVisible(false)} 
        okText="Сохранить" 
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="ФИО" name="name" rules={[{ required: true, message: 'Введите ФИО' }]}><Input placeholder="Введите имя..." /></Form.Item>
          <Form.Item label="Email" name="email" rules={[{ required: true, type: 'email' }]}><Input placeholder="email@school.com" /></Form.Item>
          {!editingUser && (
            <Form.Item label="Временный пароль" name="password" rules={[{ required: true }]}><Input.Password placeholder="Пароль" /></Form.Item>
          )}
          <Form.Item label="Роль" name="role" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="Admin">Admin</Select.Option>
              <Select.Option value="Manager">Manager</Select.Option>
              <Select.Option value="Teacher">Teacher</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
