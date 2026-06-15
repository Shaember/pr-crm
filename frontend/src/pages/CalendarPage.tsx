import { useState } from 'react';
import { Calendar, momentLocalizer } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import 'moment/locale/ru';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';
import { Typography, Modal, Form, Select, DatePicker, message, Button } from 'antd';

moment.locale('ru');
const localizer = momentLocalizer(moment);

// Type-safe DnD calendar wrapper
const DnDCalendar = withDragAndDrop(Calendar) as React.ComponentType<any>;

const { Title } = Typography;
const { Option } = Select;

const courseLabels: Record<string, string> = {
  react: 'Основы React',
  ts: 'Продвинутый TypeScript',
};

const teacherLabels: Record<string, string> = {
  anna: 'Анна Преподаватель',
  ivan: 'Иван Сергеев',
};

interface CalendarEventType {
  id: number;
  title: string;
  start: Date;
  end: Date;
}

export default function CalendarPage() {
  const [events, setEvents] = useState<CalendarEventType[]>([
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
  const [form] = Form.useForm();

  const handleSelectSlot = () => {
    setIsModalVisible(true);
  };

  const handleEventDrop = ({ event, start, end }: { event: CalendarEventType; start: Date; end: Date }) => {
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
    form.validateFields().then(values => {
      const courseName = courseLabels[values.course] || values.course;
      const teacherName = teacherLabels[values.teacher] || values.teacher;
      const [start, end] = values.timeRange;

      const hasConflict = events.some(e =>
        (start.toDate() >= e.start && start.toDate() < e.end) || (end.toDate() > e.start && end.toDate() <= e.end)
      );

      if (hasConflict) {
        message.error('Конфликт расписания: на это время уже назначено занятие');
        return;
      }

      const newEvent: CalendarEventType = {
        id: Date.now(),
        title: `${courseName} — ${teacherName}`,
        start: start.toDate(),
        end: end.toDate(),
      };

      setEvents([...events, newEvent]);
      message.success('Урок добавлен!');
      form.resetFields();
      setIsModalVisible(false);
    });
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

      <Modal
        title="Запланировать урок"
        open={isModalVisible}
        onOk={handleAddLesson}
        onCancel={() => { form.resetFields(); setIsModalVisible(false); }}
        okText="Сохранить"
        cancelText="Отмена"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Курс" name="course" rules={[{ required: true, message: 'Выберите курс' }]}>
            <Select placeholder="Выберите курс">
              <Option value="react">Основы React</Option>
              <Option value="ts">Продвинутый TypeScript</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Преподаватель" name="teacher" rules={[{ required: true, message: 'Выберите преподавателя' }]}>
            <Select placeholder="Выберите преподавателя">
              <Option value="anna">Анна Преподаватель</Option>
              <Option value="ivan">Иван Сергеев</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Время" name="timeRange" rules={[{ required: true, message: 'Выберите время' }]}>
            <DatePicker.RangePicker showTime style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
