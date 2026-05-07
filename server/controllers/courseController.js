const Course = require('../models/Course');
const { getPrerequisiteChain } = require('../utils/dagValidator');

exports.getCourses = async (req, res, next) => {
  try {
    const courses = await Course.find({ isActive: true }).populate('prerequisites', 'code name credits');
    res.json({ success: true, courses });
  } catch (err) {
    next(err);
  }
};

exports.getCourse = async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.id).populate('prerequisites', 'code name credits');
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

exports.createCourse = async (req, res, next) => {
  try {
    const course = await Course.create(req.body);
    res.status(201).json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

exports.updateCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, course });
  } catch (err) {
    next(err);
  }
};

exports.deleteCourse = async (req, res, next) => {
  try {
    const course = await Course.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!course) return res.status(404).json({ success: false, message: 'Course not found' });
    res.json({ success: true, message: 'Course disabled' });
  } catch (err) {
    next(err);
  }
};

exports.getCoursePrereqChain = async (req, res, next) => {
  try {
    const allCourses = await Course.find({});
    const result = getPrerequisiteChain(req.params.id, allCourses);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
