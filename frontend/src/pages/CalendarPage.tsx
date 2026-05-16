import { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDropModule from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
// @ts-ignore
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Typography, Modal, Form, Select, DatePicker, message, Button } from 'antd';

moment.locale('ru');
const localizer = momentLocalizer(moment);
const withDragAndDrop = typeof withDragAndDropModule === 'function' ? withDragAndDropModule : (withDragAndDropModule as any).default;
const DnDCalendar = withDragAndDrop(Calendar as any);

const { Title } = Typography;
const { Option } = Select;

export default function CalendarPage() {
  const [events, setEvents] = useState([
    {
      id: 1,
      title: 'Основы React - Группа 1',
      start: new Date(new Date().setHours(10, 0, 0, 0)),
      end: new Date(new Date().setHours(11, 30, 0, 0)),
    },
    {
      id: 2,
      title: 'Продвинутый TypeScript - Группа 2',
      start: new Date(new Date().setHours(14, 0, 0, 0)),
      end: new Date(new Date().setHours(15, 30, 0, 0)),
    },
  ]);

  const [isModalVisible, setIsModalVisible] = useState(false);

  const handleSelectSlot = () => {
    setIsModalVisible(true);
  };

  const handleEventDrop = ({ event, start, end }: any) => {
    // Conflict detection mockup
    const hasConflict = events.some(e => e.id !== event.id && 
      ((start >= e.start && start < e.end) || (end > e.start && end <= e.end))
    );

    if (hasConflict) {
      message.error('Ошибка: На это время уже назначено другое занятие (Конфликт расписания)');
      return;
    }

    const updatedEvents = events.map(e => (e.id === event.id ? { ...e, start, end } : e));
    setEvents(updatedEvents);
    message.success('Урок перенесен успешно');
  };

  const handleAddLesson = () => {
    message.success('Урок добавлен!');
    setIsModalVisible(false);
  };

  return (
    <div style={{ height: 'calc(100vh - 150px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Расписание (Drag & Drop)</Title>
        <Button type="primary" onClick={() => setIsModalVisible(true)}>Добавить занятие</Button>
      </div>

      <div style={{ flex: 1, background: 'white', padding: 16, borderRadius: 8 }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          defaultView="week"
          onSelectSlot={handleSelectSlot}
          onEventDrop={handleEventDrop}
          resizable={false}
          selectable
          style={{ height: '100%' }}
          messages={{
            today: 'Сегодня',
            previous: 'Назад',
            next: 'Вперед',
            month: 'Месяц',
            week: 'Неделя',
            day: 'День',
            agenda: 'Повестка дня',
          }}
        />
      </div>

      <Modal title="Запланировать урок" open={isModalVisible} onOk={handleAddLesson} onCancel={() => setIsModalVisible(false)} okText="Сохранить" cancelText="Отмена">
        <Form layout="vertical">
          <Form.Item label="Курс">
            <Select placeholder="Выберите курс">
              <Option value="react">Основы React</Option>
              <Option value="ts">Продвинутый TypeScript</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Преподаватель">
            <Select placeholder="Выберите преподавателя">
              <Option value="anna">Анна Преподаватель</Option>
              <Option value="ivan">Иван Сергеев</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Время"><DatePicker.RangePicker showTime style={{ width: '100%' }} /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
