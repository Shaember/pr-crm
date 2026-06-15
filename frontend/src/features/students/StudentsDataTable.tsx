import { useState, useEffect } from 'react';
import { Table, Space, Button, Input, Select, Tag, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import StudentStatusBadge from './StudentStatusBadge';
import StudentCard from './StudentCard';
import { api } from '../../services/api';
import type { Student } from '../../types';

const { Option } = Select;

/** Raw shape returned by GET /api/students (snake_case) */
interface ApiStudent {
  id: number;
  name: string;
  email: string;
  phone?: string;
  status: Student['status'];
  debt: number;
  enrollment_date?: string;
  created_at?: string;
}

/** Map an API row into the frontend Student type */
function mapApiStudent(row: ApiStudent): Student {
  return {
    key: String(row.id),
    name: row.name,
    email: row.email,
    phone: row.phone,
    status: row.status,
    course: [],          // list endpoint does not include courses
    debt: row.debt ?? 0,
    enrollmentDate: row.enrollment_date,
  };
}

export default function StudentsDataTable() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [debtFilter, setDebtFilter] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStudents() {
      try {
        setLoading(true);
        setError(null);
        const rows = await api.students.list();
        if (!cancelled) {
          setStudents(rows.map(mapApiStudent));
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Ошибка загрузки студентов');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchStudents();
    return () => { cancelled = true; };
  }, []);

  const columns = [
    { title: 'Имя', dataIndex: 'name', key: 'name', sorter: (a: Student, b: Student) => a.name.localeCompare(b.name) },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    { title: 'Статус', dataIndex: 'status', key: 'status', render: (status: Student['status']) => <StudentStatusBadge status={status} /> },
    { title: 'Курс', dataIndex: 'course', key: 'course', render: (courses: string[]) => (
        <Space size={[0, 4]} wrap>
          {courses.length > 0
            ? courses.map((course) => <Tag key={course}>{course}</Tag>)
            : <span style={{ color: '#999' }}>—</span>}
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

  const filteredData = students.filter(item => {
    const matchName = item.name.toLowerCase().includes(searchText.toLowerCase()) || item.email.toLowerCase().includes(searchText.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    const matchDebt = debtFilter === 'has_debt' ? item.debt > 0 : debtFilter === 'no_debt' ? item.debt === 0 : true;
    return matchName && matchStatus && matchDebt;
  });

  if (selectedStudent) {
    return <StudentCard student={selectedStudent} onBack={() => setSelectedStudent(null)} />;
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Spin size="large" tip="Загрузка студентов..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <Empty description={error}>
          <Button type="primary" onClick={() => window.location.reload()}>Повторить</Button>
        </Empty>
      </div>
    );
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

      <Table columns={columns} dataSource={filteredData} rowKey="key" pagination={{ pageSize: 5 }} locale={{ emptyText: <Empty description="Нет студентов" /> }} />
    </div>
  );
}
