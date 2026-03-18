const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'Student' },
  exam: { type: mongoose.Schema.Types.ObjectId, ref: 'Exam' },
  marks: [{
    subject: String,
    score: Number,
    grade: String
  }],
  totalMarks: Number,
  grade: String
}, { timestamps: true });

module.exports = mongoose.model('Result', resultSchema);
