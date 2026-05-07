const Plan = require('../models/Plan');
const Course = require('../models/Course');
const Mark = require('../models/Mark');
const { validatePlan } = require('../utils/dagValidator');

const populatePlan = (query) => query.populate('student', 'name email role').populate('semesters.courses', 'code name credits');

exports.getPlans = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'student') {
      query.student = req.user._id;
    }
    const plans = await populatePlan(Plan.find(query).sort({ createdAt: -1 }));
    res.json({ success: true, plans });
  } catch (err) {
    next(err);
  }
};

exports.getPlan = async (req, res, next) => {
  try {
    const plan = await populatePlan(Plan.findById(req.params.id));
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (req.user.role === 'student' && String(plan.student._id) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
    }
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

exports.createPlan = async (req, res, next) => {
  try {
    const { title, semesters = [] } = req.body;
    if (!title) return res.status(400).json({ success: false, message: 'Title is required' });
    const plan = await Plan.create({ student: req.user._id, title, semesters, status: 'draft' });
    res.status(201).json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

exports.updatePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (String(plan.student) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (plan.status !== 'draft' && plan.status !== 'rejected') return res.status(400).json({ success: false, message: 'Only draft or rejected plans can be edited' });

    // Ensure totalCredits is computed here if needed, or trust the frontend to send the exact semester updates
    plan.title = req.body.title || plan.title;
    if (req.body.semesters) plan.semesters = req.body.semesters;

    await plan.save();
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

exports.validate = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id).lean();
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    
    const allCourses = await Course.find({});
    const marks = await Mark.find({ student: req.user._id });

    // Extract completed course IDs from marks (map codes to IDs)
    const completedCourseCodes = new Set();
    marks.forEach(m => {
      m.subjects.forEach(sub => {
        completedCourseCodes.add(sub.code);
      });
    });

    // Combine with manual completedCourses on user profile
    const studentCompletedCourseIds = (req.user.completedCourses || []).map(id => String(id));
    
    // Add IDs for courses found in marks
    allCourses.forEach(c => {
      if (completedCourseCodes.has(c.code)) {
        studentCompletedCourseIds.push(String(c._id));
      }
    });

    const result = validatePlan(plan, allCourses, studentCompletedCourseIds);
    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

exports.submitPlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (String(plan.student) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (plan.status !== 'draft' && plan.status !== 'rejected') return res.status(400).json({ success: false, message: 'Plan cannot be submitted in its current status' });

    plan.status = 'submitted';
    plan.submittedAt = new Date();
    await plan.save();
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

exports.approvePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });

    plan.status = 'approved';
    plan.advisorNote = req.body.advisorNote || '';
    plan.reviewedAt = new Date();
    await plan.save();
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

exports.rejectPlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (!req.body.advisorNote) return res.status(400).json({ success: false, message: 'Advisor note is required for rejection' });

    plan.status = 'rejected';
    plan.advisorNote = req.body.advisorNote;
    plan.reviewedAt = new Date();
    await plan.save();
    res.json({ success: true, plan });
  } catch (err) {
    next(err);
  }
};

exports.deletePlan = async (req, res, next) => {
  try {
    const plan = await Plan.findById(req.params.id);
    if (!plan) return res.status(404).json({ success: false, message: 'Plan not found' });
    if (String(plan.student) !== String(req.user._id)) return res.status(403).json({ success: false, message: 'Forbidden' });
    if (plan.status !== 'draft') return res.status(400).json({ success: false, message: 'Can only delete draft plans' });

    await plan.deleteOne();
    res.json({ success: true, message: 'Plan deleted' });
  } catch (err) {
    next(err);
  }
};
