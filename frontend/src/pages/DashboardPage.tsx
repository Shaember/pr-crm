import { Typography, Card, Row, Col, Statistic, message } from 'antd';
import { UserOutlined, BookOutlined, DollarOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { api } from '../services/api';

const { Title } = Typography;

export default function DashboardPage() {
  const [studentsCount, setStudentsCount] = useState(0);
  const [activeStudentsCount, setActiveStudentsCount] = useState(0);
  const [coursesCount, setCoursesCount] = useState(0);
  const [paymentsTotal, setPaymentsTotal] = useState(0);
  const [pendingPayments, setPendingPayments] = useState(0);
  const [totalDebt, setTotalDebt] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [students, courses, payments] = await Promise.all([
        api.students.list(),
        api.courses.list(),
        api.payments.list(),
      ]);

      setStudentsCount(students.length);
      setActiveStudentsCount(students.filter((s: any) => s.status === 'Активен').length);
      setCoursesCount(courses.filter((c: any) => (c.status || 'Активен') === 'Активен').length);
      setPaymentsTotal(
        payments
          .filter((p: any) => p.status === 'Оплачен')
          .reduce((sum: number, p: any) => sum + (p.amount || 0), 0)
      );
      setPendingPayments(payments.filter((p: any) => p.status === 'В ожидании').length);
      setTotalDebt(students.reduce((sum: number, s: any) => sum + (s.debt || 0), 0));
    } catch (err: any) {
      message.error(err.message || 'Ошибка загрузки данных дашборда');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Title level={2}>Дашборд</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Всего студентов"
              value={studentsCount}
              prefix={<UserOutlined />}
              suffix={<span style={{ fontSize: 14, color: '#52c41a' }}>({activeStudentsCount} активных)</span>}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Активных курсов"
              value={coursesCount}
              prefix={<BookOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card loading={loading}>
            <Statistic
              title="Месячная выручка"
              value={paymentsTotal}
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
              value={pendingPayments}
              valueStyle={{ color: '#d4b106' }}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
