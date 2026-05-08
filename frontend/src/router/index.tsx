import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import AuthPage from '../pages/AuthPage';
import DashboardPage from '../pages/DashboardPage';
import StudentsPage from '../pages/StudentsPage';
import CoursesPage from '../pages/CoursesPage';
import CalendarPage from '../pages/CalendarPage';
import PaymentsPage from '../pages/PaymentsPage';
import UsersPage from '../pages/UsersPage';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <AuthPage /> },
      { path: '', element: <Navigate to="/auth/login" replace /> },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'students', element: <StudentsPage /> },
      { path: 'courses', element: <CoursesPage /> },
      { path: 'calendar', element: <CalendarPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'users', element: <UsersPage /> },
      { path: '', element: <Navigate to="/dashboard" replace /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
