const express = require('express');
const fs = require('fs');
const csv = require('csv-parser');
const multer = require('multer');
const path = require('path');
const bcrypt = require('bcryptjs');
const Teacher = require('../models/Teacher');
const Assignment = require('../models/Assignment');
const Student = require('../models/Student');
const Result = require('../models/Result');
const { calculateGradeAndGPA, calculateOverallStatus } = require('../utils/gradeCalculator');
const auth = require('../middleware/auth');
const router = express.Router();

// Configure Multer for CSV storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, `bulk-${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage });


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
      
      // Calculate grade (matching global scale)
      const { grade } = calculateGradeAndGPA(score);
      
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
        
        // Recalculate Total and Final Grade (Centralized logic)
        const status = calculateOverallStatus(result.marks);
        result.totalMarks = status.totalScore;
        result.grade = status.hasFailed ? 'F' : 'PASS';
        await result.save();
      } else {
        const status = calculateOverallStatus([{ score }]);
        const newResult = new Result({
          student: studentId,
          exam: examId,
          marks: [{ subject: subjectName, score, grade }],
          totalMarks: status.totalScore,
          grade: status.hasFailed ? 'F' : 'PASS',
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
router.post('/bulk-marks', auth(['teacher']), upload.single('file'), async (req, res) => {
  try {
    const { examId, subjectName, classId } = req.body;
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    
    const results = [];
    const filePath = path.join(__dirname, '..', req.file.path);

    // 1. Parse CSV
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => results.push(row))
      .on('end', async () => {
        try {
          // 2. Process each row
          for (const row of results) {
            const roll = parseInt(row.Roll || row.roll);
            const score = parseInt(row.Marks || row.marks || row.Score || row.score);
            
            if (isNaN(roll) || isNaN(score)) continue;

            const student = await Student.findOne({ classId, roll });
            if (!student) continue;

            // Calculate Grade
            const { grade } = calculateGradeAndGPA(score);

            let resultDoc = await Result.findOne({ student: student._id, exam: examId });

            if (resultDoc) {
              const subjectIndex = resultDoc.marks.findIndex(s => s.subject === subjectName);
              if (subjectIndex > -1) {
                resultDoc.marks[subjectIndex].score = score;
                resultDoc.marks[subjectIndex].grade = grade;
              } else {
                resultDoc.marks.push({ subject: subjectName, score, grade });
              }
              const status = calculateOverallStatus(resultDoc.marks);
              resultDoc.totalMarks = status.totalScore;
              resultDoc.grade = status.hasFailed ? 'F' : 'PASS';
              await resultDoc.save();
            } else {
              const status = calculateOverallStatus([{ score }]);
              await Result.create({
                student: student._id,
                exam: examId,
                marks: [{ subject: subjectName, score, grade }],
                totalMarks: status.totalScore,
                grade: status.hasFailed ? 'F' : 'PASS',
                status: 'Pending Admin Review'
              });
            }
          }
          // Clean up file
          fs.unlinkSync(filePath);
          res.json({ msg: 'Bulk marks processed successfully' });
        } catch (err) {
          res.status(500).json({ err: err.message });
        }
      });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;
