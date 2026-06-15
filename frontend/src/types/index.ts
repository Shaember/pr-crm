export interface Student {
  key: string;
  name: string;
  email: string;
  phone?: string;
  status: 'Активен' | 'Отстранен' | 'Выпущен' | 'Отчислен';
  course: string[];
  debt: number;
  enrollmentDate?: string;
}

export interface Course {
  key: string;
  name: string;
  teacher: string;
  studentsCount: number;
  status: string;
  description?: string;
}

export interface Payment {
  key: string;
  id: string;
  student: string;
  amount: number;
  date: string;
  status: 'Оплачен' | 'В ожидании' | 'Просрочен';
}

export interface CRMUser {
  key: string;
  name: string;
  email: string;
  role: 'Admin' | 'Manager' | 'Teacher';
  status: 'Активен' | 'Заблокирован';
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
}
