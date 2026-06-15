const { Pool } = require("pg");

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "crm",
  password: "QueOta",
  port: 5432,
});

module.exports = pool;