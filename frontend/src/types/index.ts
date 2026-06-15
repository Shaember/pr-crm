export interface Student {
  key: string;
  name: string;
  email: string;
  phone?: string;
  status: 'Активен' | 'Отстранен' | 'Выпущен' | 'Отчислен';
  course: string[];
  monthly_fee: number;
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
  period_months: number;
  date: string;
  start_date: string;
  end_date: string;
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
