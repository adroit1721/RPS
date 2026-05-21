const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { calculateGradeAndGPA, calculateOverallStatus } = require('../utils/gradeCalculator');
const auth = require('../middleware/auth');
const router = express.Router();

// Change password
router.put('/password', auth(['admin']), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const admin = await Admin.findById(req.user.id);
    
    // Verify old password
    if (!await bcrypt.compare(oldPassword, admin.password)) {
      return res.status(400).json({ msg: 'Old password incorrect' });
    }
    
    // Update password
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    admin.password = hashedNewPassword;
    await admin.save();
    
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// --- ASSIGNMENTS ---
const Assignment = require('../models/Assignment');

// Get all assignments
router.get('/assignments', auth(['admin']), async (req, res) => {
  try {
    const assignments = await Assignment.find().populate('teacherId', 'name id').populate('classId', 'name');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/assignments', auth(['admin']), async (req, res) => {
  try {
    let { teacherId, classId, subjectName } = req.body;
    subjectName = subjectName.trim();
    let assignment = await Assignment.findOne({ teacherId, classId });
    if (assignment) {
      if (!assignment.subjects.includes(subjectName)) {
        assignment.subjects.push(subjectName);
      }
    } else {
      assignment = new Assignment({ teacherId, classId, subjects: [subjectName] });
    }
    await assignment.save();
    
    // Also add classId and subjects directly to Teacher document for easier access
    const teacher = await require('../models/Teacher').findById(teacherId);
    if (teacher) {
      const assignedIndex = teacher.assigned.findIndex(a => a.classId.toString() === classId);
      if (assignedIndex > -1) {
        if (!teacher.assigned[assignedIndex].subjects.includes(subjectName)) {
          teacher.assigned[assignedIndex].subjects.push(subjectName);
        }
      } else {
        teacher.assigned.push({ classId, subjects: [subjectName] });
      }
      await teacher.save();
    }

    res.status(201).json(assignment);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// Delete assignment
router.delete('/assignments/:id', auth(['admin']), async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    if (!assignment) return res.status(404).json({ msg: 'Assignment not found' });

    const { teacherId, classId, subjects } = assignment;

    // 1. Remove subjects from Teacher's assigned array
    const Teacher = require('../models/Teacher');
    const teacher = await Teacher.findById(teacherId);
    if (teacher) {
      const assignedIndex = teacher.assigned.findIndex(a => a.classId.toString() === classId.toString());
      if (assignedIndex > -1) {
        // Remove the specific subjects mentioned in this assignment
        teacher.assigned[assignedIndex].subjects = teacher.assigned[assignedIndex].subjects.filter(
          s => !subjects.includes(s)
        );
        // If no subjects left for this class, remove the class entry
        if (teacher.assigned[assignedIndex].subjects.length === 0) {
          teacher.assigned.splice(assignedIndex, 1);
        }
        await teacher.save();
      }
    }

    // 2. Cascade Update Results: remove marks for these subjects and recalculate
    // Optimization: Bulk update using $pull and then we need to recalculate totalMarks/grade.
    // MongoDB doesn't easily support recalculating fields based on an array length changes in a single $pull.
    // So we'll fetch them, update them in memory, and use bulkWrite for speed.
    const resultsToUpdate = await Result.find({ student: { $in: studentIds }, 'marks.subject': { $in: subjects } });
    
    if (resultsToUpdate.length > 0) {
      const bulkOps = resultsToUpdate.map(result => {
        result.marks = result.marks.filter(m => !subjects.includes(m.subject));
        const status = calculateOverallStatus(result.marks);
        
        return {
          updateOne: {
            filter: { _id: result._id },
            update: {
              $set: {
                marks: result.marks,
                totalMarks: status.totalScore,
                grade: result.marks.length > 0 ? (status.hasFailed ? 'F' : 'PASS') : 'N/A'
              }
            }
          }
        };
      });
      await Result.bulkWrite(bulkOps);
    }

    // 3. Delete the assignment document itself
    await Assignment.findByIdAndDelete(req.params.id);
    
    res.json({ msg: 'Assignment and associated marks deleted successfully' });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// --- EXAMS ---
const Exam = require('../models/Exam');

// Get all exams (optionally filter by classId)
router.get('/exams', auth(['admin', 'teacher']), async (req, res) => {
  try {
    const { classId } = req.query;
    const query = classId ? { classId } : {};
    const exams = await Exam.find(query).populate('classId', 'name');
    res.json(exams);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Declare a new exam
router.post('/exams', auth(['admin']), async (req, res) => {
  try {
    const exam = new Exam(req.body);
    await exam.save();
    
    // Attempt socket emit
    try {
        const io = req.app.get('io');
        if(io) io.emit('exam-declared', exam);
    } catch(e) {}
    
    res.status(201).json(exam);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// Update an exam
router.put('/exams/:id', auth(['admin']), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exam) return res.status(404).json({ msg: 'Exam not found' });
    res.json(exam);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// Delete an exam
router.delete('/exams/:id', auth(['admin']), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndDelete(req.params.id);
    if (!exam) return res.status(404).json({ msg: 'Exam not found' });
    
    // Also might want to delete associated results? Left for future.
    res.json({ msg: 'Exam deleted' });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// Update Exam Publication status
router.put('/exams/:id/publish', auth(['admin']), async (req, res) => {
  try {
    const exam = await Exam.findByIdAndUpdate(req.params.id, { isPublished: req.body.isPublished }, { new: true });
    
    // Attempt socket emit
    try {
        const io = req.app.get('io');
        if(io) io.emit('exam-status-changed', exam);
    } catch(e) {}

    res.json(exam);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// --- RESULTS OVERVIEW ---
const Result = require('../models/Result');

router.get('/results/overview', auth(['admin']), async (req, res) => {
  try {
    const { classId } = req.query;
    if(!classId) return res.status(400).json({ msg: 'classId is required' });
    
    // 1. Find all students in this class
    const Student = require('../models/Student');
    const students = await Student.find({ classId });
    const studentIds = students.map(s => s._id);

    // 2. Find results for these students
    const query = { student: { $in: studentIds } };
    if (req.query.examId) query.exam = req.query.examId;

    const results = await Result.find(query)
        .populate('student')
        .populate('exam');
        
    res.json(results);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
