import { useState } from 'react';
import { Table, Space, Button, Input, Select, Tag, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import StudentStatusBadge from './StudentStatusBadge';
import StudentCard from './StudentCard';
import type { Student } from '../../types';

const { Option } = Select;

const initialData: Student[] = [
  { key: '1', name: 'Иван Иванов', email: 'ivan@example.com', phone: '+7 999 123 45 67', status: 'Активен', course: ['Основы React', 'UI Дизайн'], debt: 15000, enrollmentDate: '2023-09-01' },
  { key: '2', name: 'Алексей Смирнов', email: 'alexey@example.com', phone: '+7 999 234 56 78', status: 'Отстранен', course: ['Продвинутый TypeScript'], debt: 40000, enrollmentDate: '2023-10-15' },
  { key: '3', name: 'Мария Петрова', email: 'maria@example.com', phone: '+7 999 345 67 89', status: 'Активен', course: ['Node.js Backend'], debt: 0, enrollmentDate: '2024-01-10' },
];

export default function StudentsDataTable() {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [debtFilter, setDebtFilter] = useState<string | null>(null);

  const columns = [
    { title: 'Имя', dataIndex: 'name', key: 'name', sorter: (a: Student, b: Student) => a.name.localeCompare(b.name) },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (status: Student['status']) => <StudentStatusBadge status={status} /> },
    { title: 'Курс', dataIndex: 'course', key: 'course', render: (courses: string[]) => (
        <Space size={[0, 4]} wrap>
          {courses.map((course) => <Tag key={course}>{course}</Tag>)}
        </Space>
      )
    },
    { title: 'Долг', dataIndex: 'debt', key: 'debt', render: (debt: number) => (
        debt > 0 ? <span style={{ color: 'red', fontWeight: 'bold' }}>{debt.toLocaleString('ru-RU')} ₽</span> : <span style={{ color: 'green' }}>0 ₽</span>
      ),
      sorter: (a: Student, b: Student) => a.debt - b.debt,
    },
    { title: 'Действия', key: 'actions', render: (_: any, record: Student) => (
        <Button type="link" onClick={() => setSelectedStudent(record)}>Профиль</Button>
      )
    },
  ];

  const filteredData = initialData.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchText.toLowerCase()) || item.email.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    const matchDebt = debtFilter === 'has_debt' ? item.debt > 0 : debtFilter === 'no_debt' ? item.debt === 0 : true;
    return matchName && matchStatus && matchDebt;
  });

  if (selectedStudent) {
    return <StudentCard student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: '16px' }}>
        <Input 
          placeholder="Поиск по имени или email..." 
          prefix={<SearchOutlined />} 
          style={{ width: 300 }} 
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
        />
        <Select placeholder="Фильтр по статусу" style={{ width: 180 }} allowClear onChange={setStatusFilter}>
          <Option value="Активен">Активен</Option>
          <Option value="Отстранен">Отстранен</Option>
          <Option value="Выпущен">Выпущен</Option>
        </Select>
        <Select placeholder="Фильтр по долгу" style={{ width: 180 }} allowClear onChange={setDebtFilter}>
          <Option value="has_debt">Есть долг</Option>
          <Option value="no_debt">Нет долга</Option>
        </Select>
      </div>

      <Table columns={columns} dataSource={filteredData} pagination={{ pageSize: 5 }} locale={{ emptyText: <Empty description="Нет студентов" /> }} />
    </div>
  );
}
