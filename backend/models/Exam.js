const mongoose = require('mongoose');

const examSchema = new mongoose.Schema({
  name: String,
  deadline: Date,
  publishDate: Date,
  isPublished: { type: Boolean, default: false },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class' }
}, { timestamps: true });

module.exports = mongoose.model('Exam', examSchema);
