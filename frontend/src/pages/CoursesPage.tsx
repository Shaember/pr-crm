import { useState } from 'react';
import { Typography, Table, Button, Modal, Form, Input, Select, Space, message, Empty } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../config/roles';

const { Title } = Typography;

const initialCourses = [
  { key: '1', name: 'Основы React', teacher: 'Анна Преподаватель', studentsCount: 15, status: 'Активен' },
  { key: '2', name: 'Продвинутый TypeScript', teacher: 'Иван Сергеев', studentsCount: 8, status: 'Активен' },
];

const teacherMap: Record<string, string> = {
  anna: 'Анна Преподаватель',
  ivan: 'Иван Сергеев',
};

export default function CoursesPage() {
  const [data, setData] = useState(initialCourses);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const role = useAuthStore((s) => s.user?.role);
  const canCreate = hasPermission(role, 'courses');

  const handleAdd = () => {
    form.validateFields().then(values => {
      const newCourse = {
        key: Date.now().toString(),
        name: values.name,
        teacher: teacherMap[values.teacher] || values.teacher,
        studentsCount: 0,
        status: 'Активен',
      };
      setData([...data, newCourse]);
      message.success('Курс создан!');
      form.resetFields();
      setIsModalVisible(false);
    });
  };

  const columns = [
    { title: 'Название курса', dataIndex: 'name', key: 'name' },
    { title: 'Преподаватель', dataIndex: 'teacher', key: 'teacher' },
    { title: 'Кол-во студентов', dataIndex: 'studentsCount', key: 'studentsCount' },
    { title: 'Статус', dataIndex: 'status', key: 'status' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Курсы</Title>
        {canCreate && (
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
            Создать курс
          </Button>
        )}
      </div>

      <Table columns={columns} dataSource={data} locale={{ emptyText: <Empty description="Нет курсов" /> }} />

      <Modal
        title="Конструктор курса"
        open={isModalVisible}
        onOk={handleAdd}
        onCancel={() => { form.resetFields(); setIsModalVisible(false); }}
        okText="Создать"
        cancelText="Отмена"
        width={600}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Название курса" name="name" rules={[{ required: true, message: 'Введите название курса' }]}>
            <Input placeholder="Например: Продвинутый Node.js" />
          </Form.Item>
          <Form.Item label="Описание" name="description">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item label="Назначить преподавателя" name="teacher" rules={[{ required: true, message: 'Выберите преподавателя' }]}>
            <Select placeholder="Выберите преподавателя">
              <Select.Option value="anna">Анна Преподаватель</Select.Option>
              <Select.Option value="ivan">Иван Сергеев</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Уроки (Модули)">
            <Form.List name="lessons">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name, 'title']} rules={[{ required: true, message: 'Введите название урока' }]}>
                        <Input placeholder="Тема урока" />
                      </Form.Item>
                      <Button onClick={() => remove(name)} danger>Удалить</Button>
                    </Space>
                  ))}
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Добавить урок
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
