const Grade = require('../models/Grade');
const Requirement = require('../models/Requirement');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { computeGpa, computeTermGpa } = require('../utils/gpa');

exports.getStudentProgress = async (req, res) => {
  const studentId = req.params.id;
  if (req.user.role === 'student' && String(req.user._id) !== studentId) return res.status(403).json({ success: false, message: 'Forbidden' });

  const student = await User.findById(studentId).populate('completedCourses');
  if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

  const grades = await Grade.find({ student: studentId }).populate('course', 'credits category');
  const reqConfig = await Requirement.findOne({ program: student.profile.major || 'Computer Science' });

  const completedCredits = grades.filter((g) => g.gradePoint > 0).reduce((sum, g) => sum + (g.course?.credits || 0), 0);
  const byCategory = { core: 0, math: 0, elective: 0 };
  grades.filter((g) => g.gradePoint > 0).forEach((g) => {
    const cat = g.course?.category || 'elective';
    byCategory[cat] = (byCategory[cat] || 0) + (g.course?.credits || 0);
  });

  const overallGpa = computeGpa(grades);
  const lastTerm = grades.length ? grades[grades.length - 1].term : null;
  const lastTermGpa = lastTerm ? computeTermGpa(grades, lastTerm) : 0;

  const requiredCredits = reqConfig?.requiredCredits || 120;
  const remainingCredits = Math.max(requiredCredits - completedCredits, 0);

  const inProgressEnrollments = await Enrollment.countDocuments({ student: studentId, status: 'current' });
  const expectedYear = new Date().getFullYear() + Math.ceil(remainingCredits / 24);

  res.json({
    success: true,
    progress: {
      overall: { completedCredits, requiredCredits, percentage: Math.round((completedCredits / requiredCredits) * 100) },
      categories: {
        core: { completed: byCategory.core, required: reqConfig?.categoryRules.core || 45 },
        math: { completed: byCategory.math, required: reqConfig?.categoryRules.math || 12 },
        elective: { completed: byCategory.elective, required: reqConfig?.categoryRules.elective || 63 },
      },
      gpa: {
        overall: overallGpa,
        major: overallGpa,
        lastTerm: lastTermGpa,
      },
      credits: { completed: completedCredits, required: requiredCredits, remaining: remainingCredits, inProgress: inProgressEnrollments },
      expectedGraduation: `May ${expectedYear}`,
      requirementConfig: reqConfig,
    },
  });
};
