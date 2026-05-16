import { useState } from 'react';
import { Typography, Table, Button, Modal, Form, Input, Select, Space, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

const { Title } = Typography;

export default function CoursesPage() {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const columns = [
    { title: 'Название курса', dataIndex: 'name', key: 'name' },
    { title: 'Преподаватель', dataIndex: 'teacher', key: 'teacher' },
    { title: 'Кол-во студентов', dataIndex: 'studentsCount', key: 'studentsCount' },
    { title: 'Статус', dataIndex: 'status', key: 'status' },
  ];

  const data = [
    { key: '1', name: 'Основы React', teacher: 'Анна Преподаватель', studentsCount: 15, status: 'Активен' },
    { key: '2', name: 'Продвинутый TypeScript', teacher: 'Иван Сергеев', studentsCount: 8, status: 'Активен' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Курсы</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalVisible(true)}>
          Создать курс
        </Button>
      </div>

      <Table columns={columns} dataSource={data} />

      <Modal title="Конструктор курса" open={isModalVisible} onOk={() => { message.success('Курс создан!'); setIsModalVisible(false); }} onCancel={() => setIsModalVisible(false)} okText="Создать" cancelText="Отмена" width={600}>
        <Form layout="vertical">
          <Form.Item label="Название курса"><Input placeholder="Например: Продвинутый Node.js" /></Form.Item>
          <Form.Item label="Описание"><Input.TextArea rows={3} /></Form.Item>
          <Form.Item label="Назначить преподавателя">
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
