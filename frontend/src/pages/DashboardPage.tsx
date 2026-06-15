import { Typography, Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, BookOutlined, DollarOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { Student, Course, Payment } from '../types';

const { Title } = Typography;

// Shared mock data (same as in other pages)
const mockStudents: Student[] = [
  { key: '1', name: 'Иван Иванов', email: 'ivan@example.com', status: 'Активен', course: ['Основы React', 'UI Дизайн'], debt: 15000 },
  { key: '2', name: 'Алексей Смирнов', email: 'alexey@example.com', status: 'Отстранен', course: ['Продвинутый TypeScript'], debt: 40000 },
  { key: '3', name: 'Мария Петрова', email: 'maria@example.com', status: 'Активен', course: ['Node.js Backend'], debt: 0 },
];

const mockCourses: Course[] = [
  { key: '1', name: 'Основы React', teacher: 'Анна Преподаватель', studentsCount: 15, status: 'Активен' },
  { key: '2', name: 'Продвинутый TypeScript', teacher: 'Иван Сергеев', studentsCount: 8, status: 'Активен' },
];

const mockPayments: Payment[] = [
  { key: '1', id: 'TXN-1001', student: 'Иван Иванов', amount: 15000, date: '2026-05-01', status: 'Оплачен' },
  { key: '2', id: 'TXN-1002', student: 'Алексей Смирнов', amount: 40000, date: '2026-05-02', status: 'Просрочен' },
  { key: '3', id: 'TXN-1003', student: 'Мария Петрова', amount: 15000, date: '2026-05-04', status: 'В ожидании' },
];

export default function DashboardPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      setStudents(mockStudents);
      setCourses(mockCourses);
      setPayments(mockPayments);
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const activeStudents = students.filter(s => s.status === 'Активен').length;
  const totalDebt = students.reduce((sum, s) => sum + s.debt, 0);
  const monthlyRevenue = payments
    .filter(p => p.status === 'Оплачен')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div>
      <Title level={2}>Дашборд</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Всего студентов"
              value={students.length}
              prefix={<UserOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>({activeStudents} активных)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Активных курсов"
              value={courses.filter(c => c.status === 'Активен').length}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Месячная выручка"
              value={monthlyRevenue}
              prefix={<DollarOutlined />}
              suffix="₽"
              valueStyle={{ color: '#3f8600' }}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} sm={12}>
          <Card loading={loading}>
            <Statistic
              title="Общий долг студентов"
              value={totalDebt}
              suffix="₽"
              valueStyle={{ color: totalDebt > 0 ? '#cf1322' : '#3f8600' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12}>
          <Card loading={loading}>
            <Statistic
              title="Ожидают оплаты"
              value={payments.filter(p => p.status === 'В ожидании').length}
              valueStyle={{ color: '#d4b106' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
