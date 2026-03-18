const express = require('express');
const Class = require('../models/Class');
const auth = require('../middleware/auth'); 
const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const classes = await Class.find();
    res.json(classes);
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

router.post('/', auth(['admin']), async (req, res) => {
  try {
    const classData = { ...req.body };
    if (classData.subjects) {
      classData.subjects = classData.subjects.map(s => ({ ...s, name: s.name.trim() }));
    }
    const newClass = new Class(classData);
    await newClass.save();
    res.status(201).json(newClass);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

router.put('/:id', auth(['admin']), async (req, res) => {
  try {
    const oldClass = await Class.findById(req.params.id);
    if (!oldClass) return res.status(404).json({ msg: 'Class not found' });

    const updateData = { ...req.body };
    if (updateData.subjects) {
      updateData.subjects = updateData.subjects.map(s => ({ ...s, name: s.name.trim() }));
    }

    const updatedClass = await Class.findByIdAndUpdate(req.params.id, updateData, { new: true });
    
    // Check for removed or renamed subjects
    const oldSubjectNames = oldClass.subjects.map(s => s.name);
    const newSubjectNames = updatedClass.subjects.map(s => s.name);
    
    const removedSubjects = oldSubjectNames.filter(s => !newSubjectNames.includes(s));
    
    if (removedSubjects.length > 0) {
      console.log(`Subjects removed/renamed in class ${updatedClass.name}: ${removedSubjects.join(', ')}. Cleaning up marks and assignments...`);
      
      const Result = require('../models/Result');
      const Student = require('../models/Student');
      const Assignment = require('../models/Assignment');
      const Teacher = require('../models/Teacher');
      
      const students = await Student.find({ classId: updatedClass._id });
      const studentIds = students.map(s => s._id);

      // 1. Delete marks for these subjects and recalculate totals
      const resultsToUpdate = await Result.find({ student: { $in: studentIds } });
      for (let result of resultsToUpdate) {
        const originalCount = result.marks.length;
        result.marks = result.marks.filter(m => !removedSubjects.includes(m.subject));
        
        if (result.marks.length !== originalCount) {
          // Recalculate totals
          result.totalMarks = result.marks.reduce((acc, curr) => acc + curr.score, 0);
          const hasFailed = result.marks.some(curr => curr.score < 40);
          result.grade = result.marks.length > 0 ? (hasFailed ? 'F' : 'PASS') : 'N/A';
          await result.save();
        }
      }

      // 2. Remove these subjects from Assignments
      await Assignment.updateMany(
        { classId: updatedClass._id },
        { $pull: { subjects: { $in: removedSubjects } } }
      );

      // 3. Remove these subjects from Teachers' assigned arrays
      await Teacher.updateMany(
        { 'assigned.classId': updatedClass._id },
        { $pull: { 'assigned.$.subjects': { $in: removedSubjects } } }
      );

      // Cleanup: Remove empty assignments or teacher-assigned entries
      await Assignment.deleteMany({ classId: updatedClass._id, subjects: { $size: 0 } });
      // Note: MongoDB $pull doesn't automatically remove the parent object if array is empty in Teacher model
      // We'll leave the empty 'assigned' entry for now or handle it if it causes UI issues.
    }

    res.json(updatedClass);
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

router.delete('/:id', auth(['admin']), async (req, res) => {
  try {
    await Class.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Class deleted' });
  } catch (err) {
    res.status(400).json({ err: err.message });
  }
});

module.exports = router;
