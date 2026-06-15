const express = require("express");
const pool = require("../db");
const auth = require("../middleware/authMiddleware");

const router = express.Router();


router.post("/", auth, async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO clients (name, email, phone) VALUES ($1, $2, $3) RETURNING *",
      [name, email, phone]
    );

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clients ORDER BY id DESC"
    );

    res.json(result.rows);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/:id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM clients WHERE id = $1",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.put("/:id", auth, async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const result = await pool.query(
      "UPDATE clients SET name=$1, email=$2, phone=$3 WHERE id=$4 RETURNING *",
      [name, email, phone, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json(result.rows[0]);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.delete("/:id", auth, async (req, res) => {
  try {
    const result = await pool.query(
      "DELETE FROM clients WHERE id=$1 RETURNING *",
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Client not found" });
    }

    res.json({ message: "Client deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;