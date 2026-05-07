const Message = require('../models/Message');
const User = require('../models/User');

exports.getMessages = async (req, res, next) => {
  try {
    // Get all messages where user is sender or receiver
    const messages = await Message.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
    .populate('sender receiver', 'name email role')
    .sort({ createdAt: 1 });

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

exports.sendMessage = async (req, res, next) => {
  try {
    const { receiverId, text } = req.body;
    let finalReceiverId = receiverId;

    // If student sends without receiverId, default to their advisor
    if (req.user.role === 'student' && !finalReceiverId) {
      const student = await User.findById(req.user._id);
      finalReceiverId = student.advisor;
    }

    if (!finalReceiverId) {
      return res.status(400).json({ success: false, message: 'Receiver not specified' });
    }

    const message = await Message.create({
      sender: req.user._id,
      receiver: finalReceiverId,
      text
    });

    res.status(201).json({ success: true, message });
  } catch (err) {
    next(err);
  }
};

exports.markAsRead = async (req, res, next) => {
  try {
    const { senderId } = req.params;
    await Message.updateMany(
      { sender: senderId, receiver: req.user._id, read: false },
      { read: true }
    );
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
