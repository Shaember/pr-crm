import { useState } from 'react';
import { Typography, Table, Button, Tag, Modal, Form, Select, InputNumber, message, DatePicker, Empty } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import type { Payment } from '../types';

const { Title } = Typography;
const { Option } = Select;

const initialData: Payment[] = [
  { key: '1', id: 'TXN-1001', student: 'Иван Иванов', amount: 15000, date: '2026-05-01', status: 'Оплачен' },
  { key: '2', id: 'TXN-1002', student: 'Алексей Смирнов', amount: 40000, date: '2026-05-02', status: 'Просрочен' },
  { key: '3', id: 'TXN-1003', student: 'Мария Петрова', amount: 15000, date: '2026-05-04', status: 'В ожидании' },
];

const studentMap: Record<string, string> = {
  ivan: 'Иван Иванов',
  alex: 'Алексей Смирнов',
  maria: 'Мария Петрова',
};

let txnCounter = 1003;

export default function PaymentsPage() {
  const [data, setData] = useState<Payment[]>(initialData);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [form] = Form.useForm();

  const handleDelete = (key: string) => {
    setData(data.filter(item => item.key !== key));
    message.success('Транзакция удалена');
  };

  const handleAdd = () => {
    form.validateFields().then(values => {
      txnCounter++;
      const newPayment: Payment = {
        key: Date.now().toString(),
        id: `TXN-${txnCounter}`,
        student: studentMap[values.student] || values.student,
        amount: values.amount,
        date: values.date ? values.date.format('YYYY-MM-DD') : new Date().toISOString().split('T')[0],
        status: 'В ожидании',
      };
      setData([...data, newPayment]);
      message.success('Счет выставлен!');
      form.resetFields();
      setIsModalVisible(false);
    });
  };

  const filteredData = data.filter(item => {
    const matchSearch = item.student.toLowerCase().includes(searchText.toLowerCase()) || item.id.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const columns = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Студент', dataIndex: 'student', key: 'student' },
    { title: 'Сумма', dataIndex: 'amount', key: 'amount', render: (val: number) => `${val.toLocaleString('ru-RU')} ₽` },
    { title: 'Дата', dataIndex: 'date', key: 'date' },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (status: Payment['status']) => {
        const colorMap: Record<Payment['status'], string> = {
          'Оплачен': 'green',
          'В ожидании': 'gold',
          'Просрочен': 'volcano',
        };
        return <Tag color={colorMap[status]}>{status}</Tag>;
      }
    },
    {
      title: 'Действия',
      key: 'actions',
      render: (_: unknown, record: Payment) => (
        <Button danger type="text" icon={<DeleteOutlined />} onClick={() => handleDelete(record.key)} />
      )
    }
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Платежи</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Создать счет
        </Button>
      </div>

      <div style={{ marginBottom: 16, display: 'flex', gap: '16px' }}>
        <input
          placeholder="Поиск по студенту или ID..."
          style={{ width: 250, padding: '4px 11px', border: '1px solid #d9d9d9', borderRadius: 6 }}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select placeholder="Статус" style={{ width: 150 }} allowClear onChange={setStatusFilter}>
          <Option value="Оплачен">Оплачен</Option>
          <Option value="В ожидании">В ожидании</Option>
          <Option value="Просрочен">Просрочен</Option>
        </Select>
      </div>

      <Table
        columns={columns}
        dataSource={filteredData}
        locale={{ emptyText: <Empty description="Нет платежей" /> }}
      />

      <Modal
        title="Создание счета"
        open={isModalVisible}
        onOk={handleAdd}
        onCancel={() => { form.resetFields(); setIsModalVisible(false); }}
        okText="Создать"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Студент" name="student" rules={[{ required: true, message: 'Выберите студента' }]}>
            <Select placeholder="Выберите студента">
              <Option value="ivan">Иван Иванов</Option>
              <Option value="alex">Алексей Смирнов</Option>
              <Option value="maria">Мария Петрова</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Сумма (₽)" name="amount" rules={[{ required: true, message: 'Введите сумму' }]}>
            <InputNumber style={{ width: '100%' }} min={0} placeholder="15000" />
          </Form.Item>
          <Form.Item label="Срок оплаты" name="date" rules={[{ required: true, message: 'Выберите дату' }]}>
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
