const express = require('express');
const router = express.Router();
const Result = require('../models/Result');
const Student = require('../models/Student');
const Class = require('../models/Class');
const Exam = require('../models/Exam');

// Public lookup for results
router.get('/result', async (req, res) => {
  try {
    const { session, classId, examId, roll } = req.query;

    if (!session || !classId || !examId || !roll) {
      return res.status(400).json({ msg: 'Missing required parameters' });
    }

    // 1. Find the student
    const student = await Student.findOne({ 
      roll: roll, 
      classId: classId, 
      session: session 
    });

    if (!student) {
      return res.status(404).json({ msg: 'Student not found with provided details.' });
    }

    // 2. Find the published exam
    const exam = await Exam.findOne({ _id: examId, isPublished: true });
    if (!exam) {
      return res.status(404).json({ msg: 'Exam not found or results are not yet published.' });
    }

    // 3. Find the result linking student and exam
    const result = await Result.findOne({ student: student._id, exam: exam._id });
    
    if (!result) {
      return res.status(404).json({ msg: 'Result record not found for this student.' });
    }

    // 4. Fetch class details for UI
    const classData = await Class.findById(classId);

    // Return aggregated data needed for marksheet
    res.json({
      student: {
        name: student.name,
        roll: student.roll,
        session: student.session,
        fatherName: student.fatherName,
        motherName: student.motherName,
        dob: student.dob
      },
      classData: {
        name: classData.name
      },
      exam: {
        name: exam.name
      },
      marks: result.marks,
      totalMarks: result.totalMarks,
      grade: result.grade
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ err: 'Server error processing request' });
  }
});

// Used by the public frontend dropdown
router.get('/published-exams', async (req, res) => {
    try {
        const { classId } = req.query;
        if (!classId) return res.status(400).json({ msg: 'Class ID required' });
        
        const exams = await Exam.find({ classId, isPublished: true });
        res.json(exams);
    } catch(err) {
        res.status(500).json({ err: err.message });
    }
});

module.exports = router;
