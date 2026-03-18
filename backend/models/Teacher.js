const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  id: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'teacher' },
  assigned: [{
    classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
    subjects: [String]
  }]
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);
