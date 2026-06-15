const express = require("express");
const router = express.Router();

const Client = require("../models/Client");

router.post("/", async (req, res) => {
  try {
    const client = await Client.create(req.body);
    res.json(client);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get("/", async (req, res) => {
  const clients = await Client.find();
  res.json(clients);
});

router.get("/:id", async (req, res) => {
  const client = await Client.findById(req.params.id);
  res.json(client);
});


router.put("/:id", async (req, res) => {
  const client = await Client.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(client);
});


router.delete("/:id", async (req, res) => {
  await Client.findByIdAndDelete(req.params.id);
  res.json({ message: "Клиент удалён" });
});

module.exports = router;