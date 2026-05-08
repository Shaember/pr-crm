import { Typography, Card, Row, Col } from 'antd';

const { Title } = Typography;

export default function DashboardPage() {
  return (
    <div>
      <Title level={2}>Дашборд</Title>
      <Row gutter={16}>
        <Col span={8}>
          <Card title="Всего студентов" bordered={false}>
            120
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Активных курсов" bordered={false}>
            15
          </Card>
        </Col>
        <Col span={8}>
          <Card title="Месячная выручка" bordered={false}>
            500 000 ₽
          </Card>
        </Col>
      </Row>
    </div>
  );
}
