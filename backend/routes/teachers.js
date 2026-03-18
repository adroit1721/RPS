const express = require('express');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const Assignment = require('../models/Assignment');
const auth = require('../middleware/auth');
const router = express.Router();


// Get teacher's dashboard stats
router.get('/dashboard-stats', auth(['teacher']), async (req, res) => {
  try {
    const teacher = await Teacher.findById(req.user.id);
    if (!teacher) return res.status(404).json({ msg: 'Teacher not found' });

    const classesCount = teacher.assigned.length;
    
    // For pending submissions, we look for unpublished exams in assigned classes
    // This is a bit simplified, but gives a dynamic number
    const assignedClassIds = teacher.assigned.map(a => a.classId);
    const Exam = require('../models/Exam');
    const pendingExams = await Exam.countDocuments({ 
      classId: { $in: assignedClassIds },
      isPublished: false
    });

    res.json({
      assignedClassesCount: classesCount,
      pendingSubmissions: pendingExams
    });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Update teacher's own password
router.put('/password', auth(['teacher']), async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const teacher = await Teacher.findById(req.user.id);
    
    if (!await bcrypt.compare(oldPassword, teacher.password)) {
      return res.status(400).json({ msg: 'Current password incorrect' });
    }
    
    teacher.password = await bcrypt.hash(newPassword, 10);
    await teacher.save();
    
    res.json({ msg: 'Password updated successfully' });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

// --- ADMIN ONLY ROUTES ---

router.get('/', auth(['admin']), async (req, res) => {
  try {
    const teachers = await Teacher.find();
    res.json(teachers);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/', auth(['admin']), async (req, res) => {
  try {
    const { name, id, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const teacher = new Teacher({ name, id, password: hashedPassword });
    await teacher.save();
    res.status(201).json(teacher);
  } catch (err) {
    if(err.code === 11000) return res.status(400).json({ msg: 'Teacher ID already exists' });
    res.status(400).json({ err: err.message });
  }
});

router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const updatedTeacher = await Teacher.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updatedTeacher) {
      return res.status(404).json({ msg: 'Teacher not found' });
    }
    res.json(updatedTeacher);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    const deletedTeacher = await Teacher.findByIdAndDelete(req.params.id);
    if (!deletedTeacher) return res.status(404).json({ msg: 'Teacher not found' });
    res.json({ msg: 'Teacher deleted' });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});
const Result = require('../models/Result');

// Get teacher's assignments
router.get('/assignments', auth(['teacher']), async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.user.id }).populate('classId', 'name');
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// Submit marks for a subject/class under an exam
// Get existing marks for a class, subject, and exam
router.get('/marks', auth(['teacher']), async (req, res) => {
  try {
    let { classId, subjectName, examId } = req.query;
    if (subjectName) subjectName = subjectName.trim();
    if (!classId || !subjectName || !examId) {
      return res.status(400).json({ msg: 'Missing required parameters' });
    }

    const Student = require('../models/Student');
    const Result = require('../models/Result');
    
    // 1. Find all students in this class - the authoritative list
    const students = await Student.find({ classId }).sort({ roll: 1 });
    const studentIds = students.map(s => s._id);

    // 2. Find existing results for these students in this exam for this specific subject
    const results = await Result.find({ 
      student: { $in: studentIds },
      exam: examId,
      'marks.subject': subjectName
    });

    // 3. Map EVERY student to a mark object (empty if not found)
    const marks = students.map(stu => {
      const result = results.find(r => r.student.toString() === stu._id.toString());
      const subjectMark = result ? result.marks.find(m => m.subject === subjectName) : null;
      
      return {
        studentId: stu._id,
        studentName: stu.name,
        roll: stu.roll,
        score: subjectMark ? subjectMark.score : '',
        grade: subjectMark ? subjectMark.grade : 'F'
      };
    });

    res.json(marks);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/marks', auth(['teacher']), async (req, res) => {
  try {
    let { examId, subjectName, marks } = req.body;
    if (subjectName) subjectName = subjectName.trim();
    
    // marks is an array: [{ studentId: '...', score: 85 }]
    // Find or create result document for each student
    
    console.log(`Teacher ${req.user.id} submitting marks for ${subjectName} in exam ${examId}`);
    for (const m of marks) {
      const { studentId, score } = m;
      
      // Calculate grade (matching frontend logic)
      let grade = 'F';
      if (score >= 80) grade = 'A+';
      else if (score >= 70) grade = 'A';
      else if (score >= 60) grade = 'A-';
      else if (score >= 50) grade = 'B';
      else if (score >= 40) grade = 'C';
      
      let result = await Result.findOne({ student: studentId, exam: examId });
      
      if (result) {
        // Update existing result entry
        const subjectIndex = result.marks.findIndex(s => s.subject === subjectName);
        if (subjectIndex > -1) {
          result.marks[subjectIndex].score = score;
          result.marks[subjectIndex].grade = grade;
        } else {
          result.marks.push({ subject: subjectName, score, grade });
        }
        
        // Recalculate Total and Final Grade (Simplistic for now)
        result.totalMarks = result.marks.reduce((acc, curr) => acc + curr.score, 0);
        // Basic final grade check (if any subject is < 40, fail)
        const hasFailed = result.marks.some(curr => curr.score < 40);
        result.grade = hasFailed ? 'F' : 'PASS'; // Need actual logic based on average GPA
        
        await result.save();
      } else {
        // Create new result document
        const newResult = new Result({
          student: studentId,
          exam: examId,
          marks: [{ subject: subjectName, score, grade }],
          totalMarks: score,
          grade: score < 40 ? 'F' : 'PASS',
          status: 'Pending Admin Review'
        });
        await newResult.save();
      }
    }
    
    res.json({ msg: 'Marks submitted successfully' });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
