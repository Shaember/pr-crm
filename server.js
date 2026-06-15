const client = require('prom-client');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Database = require('better-sqlite3');
const cors = require('cors');

const SECRET = "crm_secret_key";
const PORT = 4000;

const app = express();

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:5199', 'http://localhost:3000'] }));
app.use(express.json());

// Prometheus metrics
client.collectDefaultMetrics();
const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route']
});

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    httpRequestsTotal.inc({ method: req.method, route: req.path });
    next();
});

// Database
const db = new Database('./database.db');
db.pragma('foreign_keys = ON');

// ============================================================
// TABLES + MIGRATIONS
// ============================================================

db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT,
    role TEXT DEFAULT 'Teacher' CHECK(role IN ('Admin', 'Manager', 'Teacher')),
    status TEXT DEFAULT 'Активен' CHECK(status IN ('Активен', 'Заблокирован')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    phone TEXT,
    status TEXT DEFAULT 'Активен' CHECK(status IN ('Активен', 'Отстранен', 'Выпущен', 'Отчислен')),
    monthly_fee REAL DEFAULT 0,
    debt REAL DEFAULT 0,
    enrollment_date TEXT DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    teacher TEXT,
    description TEXT,
    price_per_month REAL DEFAULT 0,
    students_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Активен',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS student_courses (
    student_id INTEGER,
    course_id INTEGER,
    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_id INTEGER,
    student_name TEXT,
    amount REAL NOT NULL,
    period_months INTEGER DEFAULT 1,
    start_date TEXT,
    end_date TEXT,
    date TEXT DEFAULT (date('now')),
    status TEXT DEFAULT 'В ожидании' CHECK(status IN ('Оплачен', 'В ожидании', 'Просрочен')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);
`);

// Migration: add columns if they don't exist
function migrate() {
    const columns = db.prepare("PRAGMA table_info(payments)").all().map(c => c.name);
    if (!columns.includes('period_months')) {
        db.exec("ALTER TABLE payments ADD COLUMN period_months INTEGER DEFAULT 1");
        console.log('Migration: added period_months to payments');
    }
    if (!columns.includes('start_date')) {
        db.exec("ALTER TABLE payments ADD COLUMN start_date TEXT");
        console.log('Migration: added start_date to payments');
    }
    if (!columns.includes('end_date')) {
        db.exec("ALTER TABLE payments ADD COLUMN end_date TEXT");
        console.log('Migration: added end_date to payments');
    }

    const studentCols = db.prepare("PRAGMA table_info(students)").all().map(c => c.name);
    if (!studentCols.includes('monthly_fee')) {
        db.exec("ALTER TABLE students ADD COLUMN monthly_fee REAL DEFAULT 0");
        console.log('Migration: added monthly_fee to students');
    }

    const courseCols = db.prepare("PRAGMA table_info(courses)").all().map(c => c.name);
    if (!courseCols.includes('price_per_month')) {
        db.exec("ALTER TABLE courses ADD COLUMN price_per_month REAL DEFAULT 0");
        console.log('Migration: added price_per_month to courses');
    }
}

migrate();

// ============================================================
// SEED DATA
// ============================================================

function seedData() {
    const count = db.prepare("SELECT COUNT(*) as count FROM users").get();
    if (count.count > 0) return;

    console.log('Seeding initial data...');

    const insertUser = db.prepare("INSERT INTO users (username, password, name, role, status) VALUES (?, ?, ?, ?, ?)");
    const insertStudent = db.prepare("INSERT INTO students (name, email, phone, status, monthly_fee, debt, enrollment_date) VALUES (?, ?, ?, ?, ?, ?, ?)");
    const insertCourse = db.prepare("INSERT INTO courses (name, teacher, description, price_per_month, students_count, status) VALUES (?, ?, ?, ?, ?, ?)");
    const insertLink = db.prepare("INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)");
    const insertPayment = db.prepare("INSERT INTO payments (student_id, student_name, amount, period_months, start_date, end_date, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

    const seed = db.transaction(() => {
        // Users
        insertUser.run('admin@school.com', bcrypt.hashSync('admin123', 10), 'Админ Админов', 'Admin', 'Активен');
        insertUser.run('manager@school.com', bcrypt.hashSync('manager123', 10), 'Менеджер Менеджеров', 'Manager', 'Активен');
        insertUser.run('teacher@school.com', bcrypt.hashSync('teacher123', 10), 'Анна Преподаватель', 'Teacher', 'Заблокирован');

        // Students
        insertStudent.run('Иван Иванов', 'ivan@example.com', '+7 999 123 45 67', 'Активен', 15000, 0, '2026-01-01');
        insertStudent.run('Алексей Смирнов', 'alexey@example.com', '+7 999 234 56 78', 'Отстранен', 20000, 0, '2026-01-15');
        insertStudent.run('Мария Петрова', 'maria@example.com', '+7 999 345 67 89', 'Активен', 15000, 0, '2026-03-01');

        // Courses
        insertCourse.run('Основы React', 'Анна Преподаватель', 'Базовый курс по React', 15000, 15, 'Активен');
        insertCourse.run('Продвинутый TypeScript', 'Иван Сергеев', 'Углублённый TypeScript', 20000, 8, 'Активен');

        // Student-Course links
        insertLink.run(1, 1);
        insertLink.run(2, 2);
        insertLink.run(3, 1);

        // Payments (с датами начала и окончания)
        insertPayment.run(1, 'Иван Иванов', 15000, 1, '2026-05-01', '2026-06-01', '2026-05-01', 'Оплачен');
        insertPayment.run(2, 'Алексей Смирнов', 60000, 3, '2026-04-01', '2026-07-01', '2026-04-01', 'Просрочен');
        insertPayment.run(3, 'Мария Петрова', 15000, 1, '2026-06-01', '2026-07-01', '2026-06-01', 'В ожидании');
    });

    seed();
    console.log('Seed data inserted.');
}

seedData();

// ============================================================
// DEBT RECALCULATION
// ============================================================

function recalcDebt(studentId) {
    const student = db.prepare("SELECT * FROM students WHERE id = ?").get(studentId);
    if (!student) return;

    // Считаем сколько месяцев прошло с момента зачисления
    const enrollDate = new Date(student.enrollment_date);
    const now = new Date();
    const monthsEnrolled = Math.max(1, Math.floor((now - enrollDate) / (1000 * 60 * 60 * 24 * 30)));

    // Сумма оплаченных периодов (только статус "Оплачен")
    const paid = db.prepare(
        "SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE student_id = ? AND status = 'Оплачен'"
    ).get(studentId);

    // Долг = месячная плата * месяцы - оплачено
    const expectedDebt = student.monthly_fee * monthsEnrolled;
    const actualDebt = Math.max(0, expectedDebt - paid.total);

    db.prepare("UPDATE students SET debt = ? WHERE id = ?").run(Math.round(actualDebt), studentId);
}

// ============================================================
// AUTO-CHECK: ПРОСРОЧЕННЫЕ ПЛАТЕЖИ
// ============================================================

function checkExpiredPayments() {
    const today = new Date().toISOString().split('T')[0];

    // Находим все "Оплачен" платежи, у которых end_date < сегодня
    const expired = db.prepare(
        "SELECT * FROM payments WHERE status = 'Оплачен' AND end_date IS NOT NULL AND end_date < ?"
    ).all(today);

    if (expired.length > 0) {
        const update = db.prepare("UPDATE payments SET status = 'Просрочен' WHERE id = ?");
        const affectedStudents = new Set();

        expired.forEach(p => {
            update.run(p.id);
            if (p.student_id) affectedStudents.add(p.student_id);
            console.log(`[AUTO] Payment #${p.id} expired (end_date: ${p.end_date})`);
        });

        // Пересчитываем долги затронутых студентов
        affectedStudents.forEach(sid => recalcDebt(sid));
        console.log(`[AUTO] ${expired.length} payment(s) marked as expired`);
    }
}

// Запускаем проверку каждые 60 секунд
setInterval(checkExpiredPayments, 60 * 1000);
// И сразу при старте
checkExpiredPayments();

// ============================================================
// AUTH MIDDLEWARE
// ============================================================

function auth(req, res, next) {
    const token = req.headers.authorization;
    if (!token) return res.status(401).json({ error: "No token" });

    try {
        const decoded = jwt.verify(token, SECRET);
        req.user = decoded;
        next();
    } catch {
        res.status(401).json({ error: "Invalid token" });
    }
}

function requireRole(...roles) {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: "Недостаточно прав" });
        }
        next();
    };
}

// ============================================================
// AUTH ENDPOINTS
// ============================================================

app.post('/register', async (req, res) => {
    try {
        const { username, password, name, role } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Missing fields" });

        const hash = await bcrypt.hash(password, 10);
        const userRole = ['Admin', 'Manager', 'Teacher'].includes(role) ? role : 'Teacher';

        const result = db.prepare("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)").run(username, hash, name || username, userRole);
        res.json({ message: "User created", id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: "User exists" });
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);

        if (!user) return res.status(401).json({ error: "User not found" });
        if (user.status === 'Заблокирован') return res.status(403).json({ error: "Аккаунт заблокирован" });

        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ error: "Wrong password" });

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role, name: user.name },
            SECRET,
            { expiresIn: "24h" }
        );

        res.json({ token, user: { id: user.id, username: user.username, name: user.name, role: user.role } });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// STUDENTS CRUD
// ============================================================

app.get('/api/students', auth, (req, res) => {
    try {
        // Пересчитываем долги перед выдачей
        const students = db.prepare("SELECT * FROM students ORDER BY id").all();
        students.forEach(s => recalcDebt(s.id));
        const updated = db.prepare("SELECT * FROM students ORDER BY id").all();
        res.json(updated);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/students/:id', auth, (req, res) => {
    try {
        recalcDebt(parseInt(req.params.id));
        const row = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
        if (!row) return res.status(404).json({ error: "Student not found" });

        const courses = db.prepare(`
            SELECT c.* FROM courses c JOIN student_courses sc ON c.id = sc.course_id WHERE sc.student_id = ?
        `).all(req.params.id);

        const payments = db.prepare("SELECT * FROM payments WHERE student_id = ? ORDER BY created_at DESC").all(req.params.id);

        res.json({ ...row, courses, payments });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/students', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { name, email, phone, status, monthly_fee } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const result = db.prepare("INSERT INTO students (name, email, phone, status, monthly_fee) VALUES (?, ?, ?, ?, ?)").run(name, email, phone, status || 'Активен', monthly_fee || 0);
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/students/:id', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { name, email, phone, status, monthly_fee } = req.body;
        const result = db.prepare(
            "UPDATE students SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), status = COALESCE(?, status), monthly_fee = COALESCE(?, monthly_fee) WHERE id = ?"
        ).run(name, email, phone, status, monthly_fee, req.params.id);

        if (result.changes === 0) return res.status(404).json({ error: "Student not found" });
        recalcDebt(parseInt(req.params.id));
        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/students/:id', auth, requireRole('Admin'), (req, res) => {
    try {
        const result = db.prepare("DELETE FROM students WHERE id = ?").run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: "Student not found" });
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// COURSES CRUD
// ============================================================

app.get('/api/courses', auth, (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM courses ORDER BY id").all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/courses', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { name, teacher, description, price_per_month } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const result = db.prepare("INSERT INTO courses (name, teacher, description, price_per_month) VALUES (?, ?, ?, ?)").run(name, teacher, description, price_per_month || 0);
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/courses/:id', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { name, teacher, description, price_per_month, status, students_count } = req.body;
        const result = db.prepare(
            "UPDATE courses SET name = COALESCE(?, name), teacher = COALESCE(?, teacher), description = COALESCE(?, description), price_per_month = COALESCE(?, price_per_month), status = COALESCE(?, status), students_count = COALESCE(?, students_count) WHERE id = ?"
        ).run(name, teacher, description, price_per_month, status, students_count, req.params.id);

        if (result.changes === 0) return res.status(404).json({ error: "Course not found" });
        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/courses/:id', auth, requireRole('Admin'), (req, res) => {
    try {
        const result = db.prepare("DELETE FROM courses WHERE id = ?").run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: "Course not found" });
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// PAYMENTS CRUD
// ============================================================

app.get('/api/payments', auth, (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM payments ORDER BY id DESC").all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/payments', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { student_id, student_name, amount, period_months, date } = req.body;
        if (!amount) return res.status(400).json({ error: "Amount is required" });

        const period = period_months || 1;
        const startDate = date || new Date().toISOString().split('T')[0];

        // Считаем дату окончания: start_date + period_months
        const start = new Date(startDate);
        const end = new Date(start);
        end.setMonth(end.getMonth() + period);
        const endDate = end.toISOString().split('T')[0];

        const result = db.prepare(
            "INSERT INTO payments (student_id, student_name, amount, period_months, start_date, end_date, date, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        ).run(student_id, student_name, amount, period, startDate, endDate, startDate, 'Оплачен');

        // Пересчитываем долг
        if (student_id) recalcDebt(student_id);

        res.json({ id: result.lastInsertRowid, start_date: startDate, end_date: endDate });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/payments/:id', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { status } = req.body;
        const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(req.params.id);
        if (!payment) return res.status(404).json({ error: "Payment not found" });

        const result = db.prepare("UPDATE payments SET status = COALESCE(?, status) WHERE id = ?").run(status, req.params.id);

        // Пересчитываем долг при изменении статуса
        if (payment.student_id) recalcDebt(payment.student_id);

        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/payments/:id', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const payment = db.prepare("SELECT * FROM payments WHERE id = ?").get(req.params.id);
        if (!payment) return res.status(404).json({ error: "Payment not found" });

        db.prepare("DELETE FROM payments WHERE id = ?").run(req.params.id);

        // Пересчитываем долг после удаления
        if (payment.student_id) recalcDebt(payment.student_id);

        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// USERS CRUD
// ============================================================

app.get('/api/users', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const rows = db.prepare("SELECT id, username, name, role, status, created_at FROM users ORDER BY id").all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/users', auth, requireRole('Admin', 'Manager'), async (req, res) => {
    try {
        const { username, password, name, role } = req.body;
        if (!username || !password) return res.status(400).json({ error: "Missing fields" });

        if (req.user.role === 'Manager' && role === 'Admin') {
            return res.status(403).json({ error: "Менеджер не может создать администратора" });
        }

        const hash = await bcrypt.hash(password, 10);
        const userRole = ['Admin', 'Manager', 'Teacher'].includes(role) ? role : 'Teacher';

        const result = db.prepare("INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)").run(username, hash, name || username, userRole);
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: "User exists" });
    }
});

app.put('/api/users/:id', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { name, role, status } = req.body;

        if (req.user.role === 'Manager' && role === 'Admin') {
            return res.status(403).json({ error: "Менеджер не может назначить роль администратора" });
        }

        const result = db.prepare("UPDATE users SET name = COALESCE(?, name), role = COALESCE(?, role), status = COALESCE(?, status) WHERE id = ?").run(name, role, status, req.params.id);

        if (result.changes === 0) return res.status(404).json({ error: "User not found" });
        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/users/:id', auth, requireRole('Admin'), (req, res) => {
    try {
        if (req.user.id === parseInt(req.params.id)) {
            return res.status(400).json({ error: "Нельзя удалить самого себя" });
        }

        const result = db.prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: "User not found" });
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// STUDENT-COURSES
// ============================================================

app.post('/api/students/:id/courses', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { course_id } = req.body;
        const studentId = parseInt(req.params.id);

        // Проверяем что связь не существует
        const exists = db.prepare("SELECT 1 FROM student_courses WHERE student_id = ? AND course_id = ?").get(studentId, course_id);
        if (exists) return res.status(400).json({ error: "Студент уже записан на этот курс" });

        db.prepare("INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)").run(studentId, course_id);

        // Обновляем счётчик студентов в курсе
        db.prepare("UPDATE courses SET students_count = students_count + 1 WHERE id = ?").run(course_id);

        // Обновляем monthly_fee студента (сумма цен курсов)
        const totalFee = db.prepare(
            "SELECT COALESCE(SUM(c.price_per_month), 0) as total FROM courses c JOIN student_courses sc ON c.id = sc.course_id WHERE sc.student_id = ?"
        ).get(studentId);
        db.prepare("UPDATE students SET monthly_fee = ? WHERE id = ?").run(totalFee.total, studentId);

        recalcDebt(studentId);
        res.json({ added: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/students/:sid/courses/:cid', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const studentId = parseInt(req.params.sid);
        const courseId = parseInt(req.params.cid);

        db.prepare("DELETE FROM student_courses WHERE student_id = ? AND course_id = ?").run(studentId, courseId);
        db.prepare("UPDATE courses SET students_count = MAX(0, students_count - 1) WHERE id = ?").run(courseId);

        // Пересчитываем monthly_fee
        const totalFee = db.prepare(
            "SELECT COALESCE(SUM(c.price_per_month), 0) as total FROM courses c JOIN student_courses sc ON c.id = sc.course_id WHERE sc.student_id = ?"
        ).get(studentId);
        db.prepare("UPDATE students SET monthly_fee = ? WHERE id = ?").run(totalFee.total, studentId);

        recalcDebt(studentId);
        res.json({ removed: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// PRODUCTS (legacy)
// ============================================================

app.get('/products', auth, (req, res) => {
    try {
        const rows = db.prepare("SELECT * FROM products").all();
        res.json(rows.map(p => ({ ...p, total: p.quantity * p.price })));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/products', auth, (req, res) => {
    try {
        const { name, quantity, price } = req.body;
        if (!name || !quantity || !price) return res.status(400).json({ error: "Invalid data" });

        const result = db.prepare("INSERT INTO products (name, quantity, price) VALUES (?, ?, ?)").run(name, quantity, price);
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/products/:id', auth, (req, res) => {
    try {
        db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// HEALTH & METRICS
// ============================================================

app.get('/health', (req, res) => {
    res.json({ status: "OK", uptime: process.uptime(), memory: process.memoryUsage() });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});

// ============================================================
// START
// ============================================================

app.listen(PORT, () => {
    console.log(`CRM Server started on http://localhost:${PORT}`);
    console.log('Test accounts:');
    console.log('  Admin:   admin@school.com / admin123');
    console.log('  Manager: manager@school.com / manager123');
    console.log('  Teacher: teacher@school.com / teacher123');
    console.log('');
    console.log('Auto-check: expired payments every 60s');
});
