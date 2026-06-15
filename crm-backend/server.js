const express = require("express");
const cors = require("cors");
const clientsRoutes = require("./routes/clients");
const authRoutes = require("./routes/auth");
const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/clients", clientsRoutes);


module.exports = app;