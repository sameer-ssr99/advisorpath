const User = require('../models/User');
const Plan = require('../models/Plan');

exports.getUsers = async (req, res, next) => {
  try {
    const users = await User.find({}).select('-password');
    res.json({ success: true, users });
  } catch (err) {
    next(err);
  }
};

exports.getMyStudents = async (req, res, next) => {
  try {
    // If advisor, find students where advisor field matches
    const query = req.user.role === 'admin' ? { role: 'student' } : { advisor: req.user._id, role: 'student' };
    const students = await User.find(query).select('-password');
    res.json({ success: true, students });
  } catch (err) {
    next(err);
  }
};

exports.getUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const plans = await Plan.find({ student: user._id });
    res.json({ success: true, user, plans });
  } catch (err) {
    next(err);
  }
};

exports.updateUserRole = async (req, res, next) => {
  try {
    const { role } = req.body;
    if (!['student', 'advisor', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};

exports.updateCompletedCourses = async (req, res, next) => {
  try {
    const { completedCourses } = req.body;
    if (!Array.isArray(completedCourses)) {
      return res.status(400).json({ success: false, message: 'completedCourses must be an array' });
    }
    const targetUserId = req.params.id;
    if (req.user.role === 'student' && String(req.user._id) !== String(targetUserId)) {
      return res.status(403).json({ success: false, message: 'Forbidden: You can only update your own completed courses' });
    }

    const user = await User.findByIdAndUpdate(targetUserId, { completedCourses }, { new: true }).select('-password');
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    next(err);
  }
};
