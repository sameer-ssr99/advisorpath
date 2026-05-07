const Grade = require('../models/Grade');
const User = require('../models/User');
const { marksToGradePoint } = require('../utils/gpa');

exports.getStudentGrades = async (req, res) => {
  const studentId = req.params.id;
  if (req.user.role === 'student' && String(req.user._id) !== studentId) return res.status(403).json({ success: false, message: 'Forbidden' });

  const grades = await Grade.find({ student: studentId }).populate('course', 'code name credits category').populate('reviewedBy', 'name').sort({ term: 1 });
  res.json({ success: true, grades });
};

exports.createGrade = async (req, res) => {
  const { student, course, term, marks, advisorComment } = req.body;
  const gradePoint = marksToGradePoint(Number(marks));
  const grade = await Grade.create({ student, course, term, marks, gradePoint, advisorComment: advisorComment || '', reviewedBy: req.user._id, reviewedAt: new Date() });
  res.status(201).json({ success: true, grade });
};

exports.updateGrade = async (req, res) => {
  const grade = await Grade.findById(req.params.id);
  if (!grade) return res.status(404).json({ success: false, message: 'Grade not found' });
  if (req.body.marks !== undefined) {
    grade.marks = Number(req.body.marks);
    grade.gradePoint = marksToGradePoint(grade.marks);
  }
  if (req.body.advisorComment !== undefined) grade.advisorComment = req.body.advisorComment;
  grade.reviewedBy = req.user._id;
  grade.reviewedAt = new Date();
  await grade.save();
  res.json({ success: true, grade });
};
