const client = require('prom-client');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');

const SECRET = "crm_secret_key";

const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use(express.json());


client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
    name: 'http_requests_total',
    help: 'Total HTTP requests',
    labelNames: ['method', 'route']
});

app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);

    httpRequestsTotal.inc({
        method: req.method,
        route: req.path
    });

    next();
});


const db = new sqlite3.Database('./database.db');

db.run(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT
)
`);

db.run(`
CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    quantity INTEGER,
    price REAL
)
`);


app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: "Missing fields" });
    }

    const hash = await bcrypt.hash(password, 10);

    db.run(
        "INSERT INTO users (username, password) VALUES (?, ?)",
        [username, hash],
        (err) => {
            if (err) return res.status(500).json({ error: "User exists" });
            res.json({ message: "User created" });
        }
    );
});

app.post('/login', (req, res) => {
    const { username, password } = req.body;

    db.get(
        "SELECT * FROM users WHERE username = ?",
        [username],
        async (err, user) => {
            if (!user) return res.status(401).json({ error: "User not found" });

            const ok = await bcrypt.compare(password, user.password);

            if (!ok) return res.status(401).json({ error: "Wrong password" });

            const token = jwt.sign(
                { id: user.id, username: user.username },
                SECRET,
                { expiresIn: "1h" }
            );

            res.json({ token });
        }
    );
});

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


app.get('/products', auth, (req, res) => {
    db.all("SELECT * FROM products", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json(rows.map(p => ({
            ...p,
            total: p.quantity * p.price
        })));
    });
});

app.post('/products', auth, (req, res) => {
    const { name, quantity, price } = req.body;

    if (!name || !quantity || !price) {
        return res.status(400).json({ error: "Invalid data" });
    }

    db.run(
        "INSERT INTO products (name, quantity, price) VALUES (?, ?, ?)",
        [name, quantity, price],
        function (err) {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ id: this.lastID });
        }
    );
});

app.delete('/products/:id', auth, (req, res) => {
    db.run("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
        if (err) return res.status(500).json({ error: err.message });

        res.json({ deleted: true });
    });
});


app.get('/health', (req, res) => {
    res.json({
        status: "OK",
        uptime: process.uptime(),
        memory: process.memoryUsage()
    });
});

app.get('/metrics', async (req, res) => {
    res.set('Content-Type', client.register.contentType);
    res.end(await client.register.metrics());
});


app.listen(4000, () => {
    console.log("CRM Server started on http://localhost:4000");
});