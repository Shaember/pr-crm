import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';
import ProtectedRoute from '../components/ProtectedRoute';
import RoleGuard from '../components/RoleGuard';
import AuthPage from '../pages/AuthPage';

// Lazy-loaded pages for code-splitting
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const StudentsPage = lazy(() => import('../pages/StudentsPage'));
const CoursesPage = lazy(() => import('../pages/CoursesPage'));
const CalendarPage = lazy(() => import('../pages/CalendarPage'));
const PaymentsPage = lazy(() => import('../pages/PaymentsPage'));
const UsersPage = lazy(() => import('../pages/UsersPage'));

function PageLoader() {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
      <Spin size="large" tip="Загрузка..." />
    </div>
  );
}

function LazyPage({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<PageLoader />}>{children}</Suspense>;
}

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
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      { path: 'dashboard', element: <LazyPage><DashboardPage /></LazyPage> },
      { path: 'students', element: <LazyPage><StudentsPage /></LazyPage> },
      { path: 'courses', element: <LazyPage><CoursesPage /></LazyPage> },
      { path: 'calendar', element: <LazyPage><CalendarPage /></LazyPage> },
      {
        path: 'payments',
        element: (
          <RoleGuard permission="payments">
            <LazyPage><PaymentsPage /></LazyPage>
          </RoleGuard>
        ),
      },
      {
        path: 'users',
        element: (
          <RoleGuard permission="users">
            <LazyPage><UsersPage /></LazyPage>
          </RoleGuard>
        ),
      },
      { path: '', element: <Navigate to="/dashboard" replace /> },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
