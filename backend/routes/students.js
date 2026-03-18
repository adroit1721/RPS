const express = require('express');
const Student = require('../models/Student');
const auth = require('../middleware/auth');
const router = express.Router();

// GET all students (optionally filter by class)
router.get('/', auth(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId } = req.query;
    const query = classId ? { classId: classId } : {};
    const students = await Student.find(query).populate('classId');
    res.json(students);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// POST add student
router.post('/', auth(['admin']), async (req, res) => {
  try {
    const student = new Student(req.body);
    await student.save();
    const io = req.app.get('io');
    io.emit('student-updated', student);
    res.status(201).json(student);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// PUT update student
router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('classId');
    const io = req.app.get('io');
    io.emit('student-updated', student);
    res.json(student);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// DELETE student
router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Student deleted' });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

module.exports = router;
