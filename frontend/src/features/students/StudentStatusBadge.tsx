import { Tag } from 'antd';

interface BadgeProps {
  status: 'Активен' | 'Отстранен' | 'Выпущен' | 'Отчислен';
}

export default function StudentStatusBadge({ status }: BadgeProps) {
  let color = 'blue';
  if (status === 'Активен') color = 'green';
  if (status === 'Отстранен') color = 'volcano';
  if (status === 'Выпущен') color = 'gold';
  if (status === 'Отчислен') color = 'default';

  return <Tag color={color}>{status.toUpperCase()}</Tag>;
}
