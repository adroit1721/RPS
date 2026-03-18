const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Teacher' },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' },
  subjects: [String]
}, { timestamps: true });

module.exports = mongoose.model('Assignment', assignmentSchema);
