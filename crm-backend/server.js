const express = require("express");
const cors = require("cors");
const client = require('prom-client');
const clientsRoutes = require("./routes/clients");
const authRoutes = require("./routes/auth");
const app = express();

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics();

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);

module.exports = app;