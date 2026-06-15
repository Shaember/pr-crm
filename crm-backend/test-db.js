const pool = require("./db");

pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error(err);
  } else {
    console.log("DB CONNECTED:", res.rows);
  }

  pool.end();
});