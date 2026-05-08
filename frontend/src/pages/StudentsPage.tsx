import { Typography } from 'antd';
import StudentsDataTable from '../features/students/StudentsDataTable';

const { Title } = Typography;

export default function StudentsPage() {
  return (
    <div>
      <Title level={2}>Студенты</Title>
      <StudentsDataTable />
    </div>
  );
}
