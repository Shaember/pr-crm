import { useState, useEffect } from 'react';
import { Card, Button, Descriptions, Typography, Space, Divider, message, Dropdown, Modal, Form, Input, Select, InputNumber } from 'antd';
import type { MenuProps } from 'antd';
import { MailOutlined, EditOutlined, DollarOutlined, BookOutlined, DownOutlined, FilePdfOutlined, ContainerOutlined, CalendarOutlined } from '@ant-design/icons';
import StudentStatusBadge from './StudentStatusBadge';
import type { Student } from '../../types';
import { useAuthStore } from '../../store/authStore';
import { hasPermission } from '../../config/roles';
import { api } from '../../services/api';

const { Title } = Typography;

interface CourseOption { id: number; name: string; }

interface StudentCardProps {
  student: Student;
  onBack: () => void;
}

export default function StudentCard({ student, onBack }: StudentCardProps) {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAssignCourseModalVisible, setIsAssignCourseModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [status, setStatus] = useState(student.status);
  const [showAttendance, setShowAttendance] = useState(false);
  const [courses, setCourses] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);

  useEffect(() => {
    api.courses.list().then((rows: any[]) => setCourses(rows.map(c => ({ id: c.id, name: c.name })))).catch(() => {});
  }, []);

  const role = useAuthStore((s) => s.user?.role);
  const canEditStudent = hasPermission(role, 'students.edit');
  const canManagePayments = hasPermission(role, 'payments.create');

  const handleStatusChange = (newStatus: Student['status']) => {
    setStatus(newStatus);
    message.success(`Статус успешно изменен на "${newStatus}"`);
  };

  const statusMenu: MenuProps['items'] = [
    { key: 'Активен', label: 'Активен', onClick: () => handleStatusChange('Активен') },
    { key: 'Отстранен', label: 'Отстранен', onClick: () => handleStatusChange('Отстранен') },
    { key: 'Выпущен', label: 'Выпущен', onClick: () => handleStatusChange('Выпущен') },
    { key: 'Отчислен', label: 'Отчислен', onClick: () => handleStatusChange('Отчислен') },
  ];

  const handleDownloadInvoice = () => {
    message.loading({ content: 'Генерация счета...', key: 'invoice' });
    setTimeout(() => {
      message.success({ content: 'Счет успешно скачан!', key: 'invoice', duration: 2 });
    }, 1000);
  };

  return (
    <Card
      title={<Title level={4} style={{ margin: 0 }}>Профиль студента</Title>}
      extra={<Button onClick={onBack}>Вернуться к списку</Button>}
      style={{ marginTop: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
    >
      {!showAttendance ? (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ФИО">{student.name}</Descriptions.Item>
          <Descriptions.Item label="Email">{student.email}</Descriptions.Item>
          <Descriptions.Item label="Телефон">{student.phone || '—'}</Descriptions.Item>
          <Descriptions.Item label="Статус"><StudentStatusBadge status={status} /></Descriptions.Item>
          <Descriptions.Item label="Дата зачисления">{student.enrollmentDate || '—'}</Descriptions.Item>
          <Descriptions.Item label="Текущий долг" style={{ color: student.debt > 0 ? 'red' : 'green' }}>
            {student.debt > 0 ? `${student.debt.toLocaleString('ru-RU')} ₽` : '0 ₽'}
          </Descriptions.Item>
          <Descriptions.Item label="Ежемесячная плата">
            {student.monthly_fee > 0 ? `${student.monthly_fee.toLocaleString('ru-RU')} ₽` : '—'}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <div style={{ padding: '20px 0', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>Здесь будет отображена таблица посещаемости студента.</p>
          <Button onClick={() => setShowAttendance(false)}>Вернуться к информации</Button>
        </div>
      )}

      <Divider>Быстрые действия</Divider>

      <Space wrap>
        {/* Always visible */}
        <Button icon={<CalendarOutlined />} onClick={() => setShowAttendance(!showAttendance)}>
          {showAttendance ? 'Скрыть посещаемость' : 'Посещаемость'}
        </Button>

        {/* Admin + Manager only */}
        {canEditStudent && (
          <>
            <Button icon={<EditOutlined />} onClick={() => setIsEditModalVisible(true)}>
              Редактировать
            </Button>
            <Button type="primary" icon={<BookOutlined />} onClick={() => setIsAssignCourseModalVisible(true)}>
              Назначить курс
            </Button>
          </>
        )}

        {canManagePayments && (
          <>
            <Button type="primary" icon={<DollarOutlined />} onClick={() => setIsPaymentModalVisible(true)} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}>
              Внести платеж
            </Button>
            <Button icon={<FilePdfOutlined />} onClick={handleDownloadInvoice}>
              Скачать счет
            </Button>
          </>
        )}

        {canEditStudent && (
          <>
            <Button icon={<MailOutlined />} onClick={() => setIsMessageModalVisible(true)}>
              Отправить сообщение
            </Button>
            <Button icon={<ContainerOutlined />} onClick={() => setIsNoteModalVisible(true)}>
              Добавить заметку
            </Button>
            <Dropdown menu={{ items: statusMenu }}>
              <Button>
                <Space>
                  Изменить статус
                  <DownOutlined />
                </Space>
              </Button>
            </Dropdown>
          </>
        )}
      </Space>

      {/* Modals */}
      <Modal title="Редактировать профиль" open={isEditModalVisible} onOk={() => { message.success('Профиль обновлен'); setIsEditModalVisible(false); }} onCancel={() => setIsEditModalVisible(false)} okText="Сохранить" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="ФИО"><Input defaultValue={student.name} /></Form.Item>
          <Form.Item label="Email"><Input defaultValue={student.email} /></Form.Item>
          <Form.Item label="Телефон"><Input defaultValue={student.phone} /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Назначить курс" open={isAssignCourseModalVisible} onOk={async () => {
        if (!selectedCourseId) { message.warning('Выберите курс'); return; }
        try {
          await api.students.assignCourse(Number(student.key), selectedCourseId);
          message.success('Курс успешно назначен');
          setIsAssignCourseModalVisible(false);
          setSelectedCourseId(null);
        } catch (err: any) {
          message.error(err.message || 'Ошибка назначения курса');
        }
      }} onCancel={() => setIsAssignCourseModalVisible(false)} okText="Назначить" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="Выберите курс">
            <Select placeholder="Курс" onChange={(val) => setSelectedCourseId(val)}>
              {courses.map(c => <Select.Option key={c.id} value={c.id}>{c.name}</Select.Option>)}
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Внести платеж" open={isPaymentModalVisible} onOk={() => { message.success('Платеж успешно записан'); setIsPaymentModalVisible(false); }} onCancel={() => setIsPaymentModalVisible(false)} okText="Внести" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="Сумма (₽)"><InputNumber style={{ width: '100%' }} min={0} defaultValue={student.debt || 15000} /></Form.Item>
          <Form.Item label="Метод оплаты">
            <Select defaultValue="card">
              <Select.Option value="card">Банковская карта</Select.Option>
              <Select.Option value="cash">Наличные</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Отправить сообщение" open={isMessageModalVisible} onOk={() => { message.success('Сообщение отправлено'); setIsMessageModalVisible(false); }} onCancel={() => setIsMessageModalVisible(false)} okText="Отправить" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="Тема"><Input placeholder="Введите тему..." /></Form.Item>
          <Form.Item label="Текст сообщения"><Input.TextArea rows={4} placeholder="Введите сообщение..." /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Добавить заметку" open={isNoteModalVisible} onOk={() => { message.success('Заметка добавлена'); setIsNoteModalVisible(false); }} onCancel={() => setIsNoteModalVisible(false)} okText="Сохранить" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="Текст заметки"><Input.TextArea rows={4} placeholder="Например: Студент просил перенести занятие..." /></Form.Item>
        </Form>
      </Modal>
    </Card>
  );
}
