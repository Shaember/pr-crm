import { useState, useEffect } from 'react';
import { Typography, Table, Button, Modal, Form, Input, Space, message, Empty, Spin } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useAuthStore } from '../store/authStore';
import { hasPermission } from '../config/roles';
import { api } from '../services/api';
import type { Course } from '../types';

const { Title } = Typography;

export default function CoursesPage() {
  const [data, setData] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const role = useAuthStore((s) => s.user?.role);
  const canCreate = hasPermission(role, 'courses');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const courses = await api.courses.list();
      const mapped: Course[] = courses.map((c: any) => ({
        key: String(c.id),
        name: c.name,
        teacher: c.teacher || '',
        studentsCount: c.students_count ?? 0,
        status: c.status || 'Активен',
        description: c.description,
      }));
      setData(mapped);
    } catch (err: any) {
      message.error(err.message || 'Ошибка загрузки курсов');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    form.validateFields().then(async (values) => {
      try {
        const res = await api.courses.create({
          name: values.name,
          teacher: values.teacher,
          description: values.description,
        });
        const newCourse: Course = {
          key: String(res.id),
          name: values.name,
          teacher: values.teacher,
          studentsCount: 0,
          status: 'Активен',
          description: values.description,
        };
        setData([...data, newCourse]);
        message.success('Курс создан!');
        form.resetFields();
        setIsModalVisible(false);
      } catch (err: any) {
        message.error(err.message || 'Ошибка создания курса');
      }
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

      <Spin spinning={loading}>
        <Table columns={columns} dataSource={data} rowKey="key" locale={{ emptyText: <Empty description="Нет курсов" /> }} />
      </Spin>

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
            <Input placeholder="Имя преподавателя" />
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
