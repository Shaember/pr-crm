import { useState, useEffect } from 'react';
import { Typography, Table, Button, Tag, Modal, Form, Select, Input, InputNumber, message, DatePicker, Empty, Spin } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import { api } from '../services/api';
import type { Payment } from '../types';

const { Title } = Typography;
const { Option } = Select;

export default function PaymentsPage() {
  const [data, setData] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const payments = await api.payments.list();
      const mapped: Payment[] = payments.map((p: any) => ({
        key: String(p.id),
        id: p.transaction_id || `TXN-${p.id}`,
        student: p.student_name || p.student || '',
        amount: p.amount,
        date: p.date || '',
        status: p.status || 'В ожидании',
      }));
      setData(mapped);
    } catch (err: any) {
      message.error(err.message || 'Ошибка загрузки платежей');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (key: string) => {
    try {
      await api.payments.delete(Number(key));
      setData(data.filter(item => item.key !== key));
      message.success('Транзакция удалена');
    } catch (err: any) {
      message.error(err.message || 'Ошибка удаления');
    }
  };

  const handleAdd = () => {
    form.validateFields().then(async (values) => {
      try {
        const dateStr = values.date ? values.date.format('YYYY-MM-DD') : new Date().toISOString().split('T')[0];
        const res = await api.payments.create({
          student_name: values.student,
          amount: values.amount,
          date: dateStr,
        });
        const newPayment: Payment = {
          key: String(res.id),
          id: `TXN-${res.id}`,
          student: values.student,
          amount: values.amount,
          date: dateStr,
          status: 'В ожидании',
        };
        setData([...data, newPayment]);
        message.success('Счет выставлен!');
        form.resetFields();
        setIsModalVisible(false);
      } catch (err: any) {
        message.error(err.message || 'Ошибка создания платежа');
      }
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

      <Spin spinning={loading}>
        <Table
          columns={columns}
          dataSource={filteredData}
          rowKey="key"
          locale={{ emptyText: <Empty description="Нет платежей" /> }}
        />
      </Spin>

      <Modal
        title="Создание счета"
        open={isModalVisible}
        onOk={handleAdd}
        onCancel={() => { form.resetFields(); setIsModalVisible(false); }}
        okText="Создать"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Студент" name="student" rules={[{ required: true, message: 'Введите имя студента' }]}>
            <Input placeholder="Имя студента" />
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
