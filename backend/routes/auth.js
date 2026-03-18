const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const Teacher = require('../models/Teacher');
const router = express.Router();

router.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await Admin.findOne({ username });
    if (!admin || !await bcrypt.compare(password, admin.password)) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: admin._id, role: 'admin' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: 'admin', username: admin.username });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

router.post('/teacher/login', async (req, res) => {
  try {
    const { id, password } = req.body;
    const teacher = await Teacher.findOne({ id });
    if (!teacher || !await bcrypt.compare(password, teacher.password)) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: teacher._id, teacherId: teacher.id, role: 'teacher' }, process.env.JWT_SECRET, { expiresIn: '1h' });
    res.json({ token, role: 'teacher', name: teacher.name, id: teacher.id, _id: teacher._id });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

module.exports = router;
