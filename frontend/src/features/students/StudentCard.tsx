import { useState } from 'react';
import { Card, Button, Descriptions, Typography, Space, Divider, message, Dropdown, Modal, Form, Input, Select, InputNumber } from 'antd';
import type { MenuProps } from 'antd';
import { MailOutlined, EditOutlined, DollarOutlined, BookOutlined, DownOutlined, FilePdfOutlined, ContainerOutlined, CalendarOutlined } from '@ant-design/icons';
import StudentStatusBadge from './StudentStatusBadge';

const { Title } = Typography;

export default function StudentCard() {
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAssignCourseModalVisible, setIsAssignCourseModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isMessageModalVisible, setIsMessageModalVisible] = useState(false);
  const [isNoteModalVisible, setIsNoteModalVisible] = useState(false);
  const [status, setStatus] = useState<'Активен' | 'Отстранен' | 'Выпущен' | 'Отчислен'>('Активен');
  const [showAttendance, setShowAttendance] = useState(false);

  const handleStatusChange = (newStatus: any) => {
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
    <Card title={<Title level={4} style={{ margin: 0 }}>Профиль студента</Title>} style={{ marginTop: 24, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
      {!showAttendance ? (
        <Descriptions bordered column={2}>
          <Descriptions.Item label="ФИО">Иван Иванов</Descriptions.Item>
          <Descriptions.Item label="Email">ivan.ivanov@example.com</Descriptions.Item>
          <Descriptions.Item label="Телефон">+7 999 123 45 67</Descriptions.Item>
          <Descriptions.Item label="Статус"><StudentStatusBadge status={status} /></Descriptions.Item>
          <Descriptions.Item label="Дата зачисления">2023-09-01</Descriptions.Item>
          <Descriptions.Item label="Текущий долг" style={{ color: 'red' }}>15 000 ₽</Descriptions.Item>
        </Descriptions>
      ) : (
        <div style={{ padding: '20px 0', textAlign: 'center', background: '#f5f5f5', borderRadius: '8px' }}>
          <p>Здесь будет отображена таблица посещаемости студента.</p>
          <Button onClick={() => setShowAttendance(false)}>Вернуться к информации</Button>
        </div>
      )}
      
      <Divider>Быстрые действия</Divider>
      
      <Space wrap>
        <Button icon={<EditOutlined />} onClick={() => setIsEditModalVisible(true)}>
          Редактировать
        </Button>
        <Button type="primary" icon={<BookOutlined />} onClick={() => setIsAssignCourseModalVisible(true)}>
          Назначить курс
        </Button>
        <Button type="primary" icon={<DollarOutlined />} onClick={() => setIsPaymentModalVisible(true)} style={{ backgroundColor: '#52c41a', borderColor: '#52c41a', color: 'white' }}>
          Внести платеж
        </Button>
        <Button icon={<FilePdfOutlined />} onClick={handleDownloadInvoice}>
          Скачать счет
        </Button>
        <Button icon={<MailOutlined />} onClick={() => setIsMessageModalVisible(true)}>
          Отправить сообщение
        </Button>
        <Button icon={<ContainerOutlined />} onClick={() => setIsNoteModalVisible(true)}>
          Добавить заметку
        </Button>
        <Button icon={<CalendarOutlined />} onClick={() => setShowAttendance(!showAttendance)}>
          {showAttendance ? 'Скрыть посещаемость' : 'Посещаемость'}
        </Button>
        <Dropdown menu={{ items: statusMenu }}>
          <Button>
            <Space>
              Изменить статус
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      </Space>

      {/* Modals */}
      <Modal title="Редактировать профиль" open={isEditModalVisible} onOk={() => { message.success('Профиль обновлен'); setIsEditModalVisible(false); }} onCancel={() => setIsEditModalVisible(false)} okText="Сохранить" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="ФИО"><Input defaultValue="Иван Иванов" /></Form.Item>
          <Form.Item label="Email"><Input defaultValue="ivan.ivanov@example.com" /></Form.Item>
          <Form.Item label="Телефон"><Input defaultValue="+7 999 123 45 67" /></Form.Item>
        </Form>
      </Modal>

      <Modal title="Назначить курс" open={isAssignCourseModalVisible} onOk={() => { message.success('Курс успешно назначен'); setIsAssignCourseModalVisible(false); }} onCancel={() => setIsAssignCourseModalVisible(false)} okText="Назначить" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="Выберите курс">
            <Select placeholder="Курс">
              <Select.Option value="react">Основы React</Select.Option>
              <Select.Option value="ts">Продвинутый TypeScript</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>

      <Modal title="Внести платеж" open={isPaymentModalVisible} onOk={() => { message.success('Платеж успешно записан'); setIsPaymentModalVisible(false); }} onCancel={() => setIsPaymentModalVisible(false)} okText="Внести" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="Сумма (₽)"><InputNumber style={{ width: '100%' }} min={0} defaultValue={15000} /></Form.Item>
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
