const Notification = require('../models/Notification');

exports.list = async (req, res) => {
  const notifications = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, notifications });
};

exports.markRead = async (req, res) => {
  const notification = await Notification.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { read: true }, { new: true });
  if (!notification) return res.status(404).json({ success: false, message: 'Notification not found' });
  res.json({ success: true, notification });
};
