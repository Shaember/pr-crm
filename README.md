# CRM PRO — Система управления учебным центром

Полнофункциональная CRM-система для управления студентами, курсами, расписанием и платежами учебного центра.

## Стек технологий

### Frontend
- **React 19** + **TypeScript 6**
- **Vite 8** — сборка и dev-сервер
- **Ant Design 6** — UI-компоненты
- **Zustand** — управление состоянием
- **React Router 7** — маршрутизация
- **Vitest** + **Testing Library** — тестирование

### Backend
- **Node.js** + **Express**
- **better-sqlite3** — база данных
- **JWT** — аутентификация
- **bcryptjs** — хеширование паролей
- **prom-client** — метрики Prometheus

## Быстрый старт

### Установка зависимостей

```bash
# Бэкенд
npm install

# Фронтенд
cd frontend && npm install
```

### Запуск

```bash
# Терминал 1 — бэкенд (порт 4000)
node server.js

# Терминал 2 — фронтенд (порт 5173)
cd frontend && npm run dev
```

Откройте http://localhost:5173 в браузере.

### Тестовые аккаунты

| Логин | Пароль | Роль |
|---|---|---|
| admin@school.com | admin123 | Администратор |
| manager@school.com | manager123 | Менеджер |
| teacher@school.com | teacher123 | Преподаватель |

## Структура проекта

```
pr crm/
├── server.js              # Express-сервер (API + БД)
├── database.db            # SQLite база данных
├── package.json
├── Dockerfile
├── docker-compose.yml
└── frontend/
    ├── src/
    │   ├── main.tsx                # Точка входа
    │   ├── config/roles.ts         # RBAC: роли и права
    │   ├── types/index.ts          # TypeScript типы
    │   ├── store/authStore.ts      # Zustand: авторизация
    │   ├── services/api.ts         # API-клиент
    │   ├── components/
    │   │   ├── ErrorBoundary.tsx   # Ловец ошибок
    │   │   ├── ProtectedRoute.tsx  # Защита маршрутов
    │   │   ├── RoleGuard.tsx       # Защита по ролям
    │   │   └── layout/
    │   │       ├── Header.tsx      # Шапка
    │   │       └── Sidebar.tsx     # Боковое меню
    │   ├── pages/
    │   │   ├── AuthPage.tsx        # Авторизация
    │   │   ├── DashboardPage.tsx   # Дашборд
    │   │   ├── StudentsPage.tsx    # Студенты
    │   │   ├── CoursesPage.tsx     # Курсы
    │   │   ├── CalendarPage.tsx    # Расписание
    │   │   ├── PaymentsPage.tsx    # Платежи
    │   │   └── UsersPage.tsx       # Сотрудники
    │   └── features/students/
    │       ├── StudentsDataTable.tsx
    │       ├── StudentCard.tsx
    │       └── StudentStatusBadge.tsx
    ├── vite.config.ts
    └── package.json
```

## Функционал

### Авторизация и роли

Система поддерживает три роли с разными уровнями доступа:

| Раздел | Admin | Manager | Teacher |
|---|:---:|:---:|:---:|
| Дашборд | ✅ | ✅ | ✅ |
| Студенты | ✅ | ✅ | ✅ |
| Курсы | ✅ | ✅ | ✅ |
| Расписание | ✅ | ✅ | ✅ |
| Платежи | ✅ | ✅ | ❌ |
| Сотрудники | ✅ | ✅ | ❌ |
| Удаление админов | ✅ | ❌ | ❌ |

### Студенты
- Просмотр списка с поиском и фильтрацией (по статусу, долгу)
- Профиль студента с подробной информацией
- Назначение курсов, внесение платежей, изменение статуса

### Курсы
- Создание курсов с конструктором (название, преподаватель, модули)
- Просмотр списка с количеством студентов

### Расписание
- Недельный календарь с drag & drop
- Добавление занятий с выбором курса и преподавателя
- Проверка конфликтов расписания

### Платежи
- Создание счетов, удаление, фильтрация по статусу
- Поиск по студенту или ID транзакции
- Статусы: Оплачен, В ожидании, Просрочен

### Сотрудники
- CRUD для пользователей системы
- Назначение ролей, блокировка/разблокировка
- Ограничения: менеджер не может управлять администраторами

## API

### Авторизация
```
POST /login          { username, password } → { token, user }
POST /register       { username, password, name, role }
```

### Студенты
```
GET    /api/students       Список студентов
GET    /api/students/:id   Профиль + курсы
POST   /api/students       Создать (Admin/Manager)
PUT    /api/students/:id   Обновить (Admin/Manager)
DELETE /api/students/:id   Удалить (Admin)
```

### Курсы
```
GET    /api/courses        Список курсов
POST   /api/courses        Создать (Admin/Manager)
PUT    /api/courses/:id    Обновить (Admin/Manager)
DELETE /api/courses/:id    Удалить (Admin)
```

### Платежи
```
GET    /api/payments       Список платежей
POST   /api/payments       Создать (Admin/Manager)
PUT    /api/payments/:id   Обновить статус (Admin/Manager)
DELETE /api/payments/:id   Удалить (Admin/Manager)
```

### Сотрудники
```
GET    /api/users          Список (Admin/Manager)
POST   /api/users          Создать
PUT    /api/users/:id      Обновить
DELETE /api/users/:id      Удалить (Admin)
```

### Система
```
GET /health    Статус сервера
GET /metrics   Метрики Prometheus
```

## Тестирование

```bash
cd frontend

npm test              # Запуск всех тестов
npm run test:watch    # Watch-режим
npm run test:coverage # С отчётом покрытия
```

104 теста покрывают:
- RBAC-логику (роли, права, ограничения)
- Zustand store (авторизация, localStorage)
- Компоненты (ErrorBoundary, ProtectedRoute, RoleGuard)
- Страницы (формы, таблицы, модалки, фильтры)
- Features (StudentCard, StudentsDataTable)

## Docker

```bash
docker-compose up --build
```

- Бэкенд: http://localhost:4000
- Фронтенд: http://localhost:3000

## Переменные окружения

| Переменная | По умолчанию | Описание |
|---|---|---|
| `VITE_API_URL` | `http://localhost:4000` | URL бэкенд-API |
