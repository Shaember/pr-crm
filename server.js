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
// TABLES
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
    debt REAL DEFAULT 0,
    enrollment_date TEXT DEFAULT (date('now')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    teacher TEXT,
    description TEXT,
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
    date TEXT DEFAULT (date('now')),
    status TEXT DEFAULT 'В ожидании' CHECK(status IN ('Оплачен', 'В ожидании', 'Просрочен')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL
);
`);

// ============================================================
// SEED DATA
// ============================================================

function seedData() {
    const count = db.prepare("SELECT COUNT(*) as count FROM users").get();
    if (count.count > 0) return;

    console.log('Seeding initial data...');

    const insertUser = db.prepare("INSERT INTO users (username, password, name, role, status) VALUES (?, ?, ?, ?, ?)");
    const insertStudent = db.prepare("INSERT INTO students (name, email, phone, status, debt, enrollment_date) VALUES (?, ?, ?, ?, ?, ?)");
    const insertCourse = db.prepare("INSERT INTO courses (name, teacher, description, students_count, status) VALUES (?, ?, ?, ?, ?)");
    const insertLink = db.prepare("INSERT INTO student_courses (student_id, course_id) VALUES (?, ?)");
    const insertPayment = db.prepare("INSERT INTO payments (student_id, student_name, amount, date, status) VALUES (?, ?, ?, ?, ?)");

    const seed = db.transaction(() => {
        // Users
        insertUser.run('admin@school.com', bcrypt.hashSync('admin123', 10), 'Админ Админов', 'Admin', 'Активен');
        insertUser.run('manager@school.com', bcrypt.hashSync('manager123', 10), 'Менеджер Менеджеров', 'Manager', 'Активен');
        insertUser.run('teacher@school.com', bcrypt.hashSync('teacher123', 10), 'Анна Преподаватель', 'Teacher', 'Заблокирован');

        // Students
        insertStudent.run('Иван Иванов', 'ivan@example.com', '+7 999 123 45 67', 'Активен', 15000, '2023-09-01');
        insertStudent.run('Алексей Смирнов', 'alexey@example.com', '+7 999 234 56 78', 'Отстранен', 40000, '2023-10-15');
        insertStudent.run('Мария Петрова', 'maria@example.com', '+7 999 345 67 89', 'Активен', 0, '2024-01-10');

        // Courses
        insertCourse.run('Основы React', 'Анна Преподаватель', 'Базовый курс по React', 15, 'Активен');
        insertCourse.run('Продвинутый TypeScript', 'Иван Сергеев', 'Углублённый TypeScript', 8, 'Активен');

        // Student-Course links
        insertLink.run(1, 1);
        insertLink.run(2, 2);
        insertLink.run(3, 1);

        // Payments
        insertPayment.run(1, 'Иван Иванов', 15000, '2026-05-01', 'Оплачен');
        insertPayment.run(2, 'Алексей Смирнов', 40000, '2026-05-02', 'Просрочен');
        insertPayment.run(3, 'Мария Петрова', 15000, '2026-05-04', 'В ожидании');
    });

    seed();
    console.log('Seed data inserted.');
}

seedData();

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
        const rows = db.prepare("SELECT * FROM students ORDER BY id").all();
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.get('/api/students/:id', auth, (req, res) => {
    try {
        const row = db.prepare("SELECT * FROM students WHERE id = ?").get(req.params.id);
        if (!row) return res.status(404).json({ error: "Student not found" });

        const courses = db.prepare(`
            SELECT c.* FROM courses c JOIN student_courses sc ON c.id = sc.course_id WHERE sc.student_id = ?
        `).all(req.params.id);

        res.json({ ...row, courses });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/students', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { name, email, phone, status, debt } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const result = db.prepare("INSERT INTO students (name, email, phone, status, debt) VALUES (?, ?, ?, ?, ?)").run(name, email, phone, status || 'Активен', debt || 0);
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/students/:id', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { name, email, phone, status, debt } = req.body;
        const result = db.prepare("UPDATE students SET name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone), status = COALESCE(?, status), debt = COALESCE(?, debt) WHERE id = ?").run(name, email, phone, status, debt, req.params.id);

        if (result.changes === 0) return res.status(404).json({ error: "Student not found" });
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
        const { name, teacher, description } = req.body;
        if (!name) return res.status(400).json({ error: "Name is required" });

        const result = db.prepare("INSERT INTO courses (name, teacher, description) VALUES (?, ?, ?)").run(name, teacher, description);
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/courses/:id', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { name, teacher, description, status, students_count } = req.body;
        const result = db.prepare("UPDATE courses SET name = COALESCE(?, name), teacher = COALESCE(?, teacher), description = COALESCE(?, description), status = COALESCE(?, status), students_count = COALESCE(?, students_count) WHERE id = ?").run(name, teacher, description, status, students_count, req.params.id);

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
        const { student_id, student_name, amount, date, status } = req.body;
        if (!amount) return res.status(400).json({ error: "Amount is required" });

        const result = db.prepare("INSERT INTO payments (student_id, student_name, amount, date, status) VALUES (?, ?, ?, ?, ?)").run(student_id, student_name, amount, date || new Date().toISOString().split('T')[0], status || 'В ожидании');
        res.json({ id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.put('/api/payments/:id', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const { status } = req.body;
        const result = db.prepare("UPDATE payments SET status = COALESCE(?, status) WHERE id = ?").run(status, req.params.id);

        if (result.changes === 0) return res.status(404).json({ error: "Payment not found" });
        res.json({ updated: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.delete('/api/payments/:id', auth, requireRole('Admin', 'Manager'), (req, res) => {
    try {
        const result = db.prepare("DELETE FROM payments WHERE id = ?").run(req.params.id);
        if (result.changes === 0) return res.status(404).json({ error: "Payment not found" });
        res.json({ deleted: true });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============================================================
// USERS CRUD (Admin/Manager only)
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

        // Manager cannot create Admin
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

        // Manager cannot change to Admin role
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
        // Cannot delete yourself
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
});
