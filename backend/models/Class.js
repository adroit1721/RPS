const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  subjects: [{
    name: String,
    code: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Class', classSchema);
