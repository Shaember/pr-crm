const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true
  },
  phone: String,
  email: String,
  company: String,
  status: {
    type: String,
    default: "new"
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Client", clientSchema);