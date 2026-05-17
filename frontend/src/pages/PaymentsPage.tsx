import { useState } from 'react';
import { Typography, Table, Button, Tag, Modal, Form, Input, Select, InputNumber, message, DatePicker } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const initialData = [
  { key: '1', id: 'TXN-1001', student: 'Иван Иванов', amount: 15000, date: '2026-05-01', status: 'Оплачен' },
  { key: '2', id: 'TXN-1002', student: 'Алексей Смирнов', amount: 40000, date: '2026-05-02', status: 'Просрочен' },
  { key: '3', id: 'TXN-1003', student: 'Мария Петрова', amount: 15000, date: '2026-05-04', status: 'В ожидании' },
];

export default function PaymentsPage() {
  const [data, setData] = useState(initialData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Студент', dataIndex: 'student', key: 'student' },
    { title: 'Сумма', dataIndex: 'amount', key: 'amount', render: (val: number) => `${val} ₽` },
    { title: 'Дата', dataIndex: 'date', key: 'date' },
    { 
      title: 'Статус', 
      dataIndex: 'status', 
      key: 'status',
      render: (status: string) => {
        let color = 'green';
        if (status === 'В ожидании') color = 'gold';
        if (status === 'Просрочен') color = 'volcano';
        return <Tag color={color}>{status}</Tag>;
      }
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: any, record: any) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDelete(record.key)} />
      )
    }
  ];

  const handleDelete = (key: string) => {
    setData(data.filter(item => item.key !== key));
    message.success('Транзакция удалена');
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.student.toLowerCase().includes(searchText.toLowerCase()) || item.id.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const handleAdd = () => {
    message.success('Счет выставлен!');
    setIsModalVisible(false);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Платежи</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Создать счет
        </Button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: '16px' }}>
        <Input 
          placeholder="Поиск по студенту или ID..." 
          style={{ width: 250 }} 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select placeholder="Статус" style={{ width: 150 }} allowClear onChange={setStatusFilter}>
          <Option value="Оплачен">Оплачен</Option>
          <Option value="В ожидании">В ожидании</Option>
          <Option value="Просрочен">Просрочен</Option>
        </Select>
        <RangePicker />
      </div>

      <Table columns={columns} dataSource={filteredData} />

      <Modal title="Создание счета" open={isModalVisible} onOk={handleAdd} onCancel={() => setIsModalVisible(false)} okText="Создать" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="Студент">
            <Select placeholder="Выберите студента">
              <Option value="ivan">Иван Иванов</Option>
              <Option value="alex">Алексей Смирнов</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Сумма (₽)"><InputNumber style={{ width: '100%' }} min={0} defaultValue={15000} /></Form.Item>
          <Form.Item label="Срок оплаты"><DatePicker style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
