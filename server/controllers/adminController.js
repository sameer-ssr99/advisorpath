const User = require('../models/User');
const Course = require('../models/Course');
const Plan = require('../models/Plan');
const Session = require('../models/Session');
const Message = require('../models/Message');
const Requirement = require('../models/Requirement');

exports.dashboard = async (req, res) => {
  const [users, courses, plans, sessions, messages] = await Promise.all([
    User.countDocuments(),
    Course.countDocuments(),
    Plan.countDocuments(),
    Session.countDocuments(),
    Message.countDocuments(),
  ]);

  res.json({ success: true, stats: { users, courses, plans, sessions, messages } });
};

exports.toggleUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  user.isActive = req.body.isActive;
  await user.save();
  res.json({ success: true, user });
};

exports.upsertRequirement = async (req, res) => {
  const { program, requiredCredits, categoryRules, courseCategoryMap = [] } = req.body;
  if (!program || !requiredCredits || !categoryRules) return res.status(400).json({ success: false, message: 'program, requiredCredits, categoryRules required' });
  const requirement = await Requirement.findOneAndUpdate(
    { program },
    { program, requiredCredits, categoryRules, courseCategoryMap },
    { upsert: true, new: true, runValidators: true }
  );
  res.json({ success: true, requirement });
};

exports.getRequirements = async (req, res) => {
  const requirements = await Requirement.find({}).populate('courseCategoryMap.course', 'code name category');
  res.json({ success: true, requirements });
};
