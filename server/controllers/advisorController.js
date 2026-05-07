const Plan = require('../models/Plan');
const Session = require('../models/Session');
const User = require('../models/User');
const Notification = require('../models/Notification');

exports.dashboard = async (req, res) => {
  const advisees = await User.find({ advisorRef: req.user._id, role: 'student', isActive: true }).select('name profile');
  const pendingSessions = await Session.countDocuments({ advisor: req.user._id, status: 'requested' });
  const scheduledSessions = await Session.countDocuments({ advisor: req.user._id, status: 'scheduled' });
  const completedSessions = await Session.countDocuments({ advisor: req.user._id, status: 'completed' });
  const submittedPlans = await Plan.countDocuments({ status: 'submitted' });
  const alerts = await Notification.countDocuments({ user: req.user._id, read: false });

  res.json({ success: true, data: { advisees, pendingSessions, scheduledSessions, completedSessions, submittedPlans, alerts } });
};
