const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  session: { type: String, required: true },
  name: { type: String, required: true },
  fatherName: { type: String, required: true },
  motherName: { type: String, required: true },
  dob: { type: Date, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  roll: { type: String, required: true }
}, { timestamps: true });

// Ensure roll is unique within a specific class and session
studentSchema.index({ roll: 1, classId: 1, session: 1 }, { unique: true });

module.exports = mongoose.model('Student', studentSchema);
