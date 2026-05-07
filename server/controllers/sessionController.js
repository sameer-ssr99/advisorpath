const Session = require('../models/Session');
const User = require('../models/User');

exports.getSessions = async (req, res, next) => {
  try {
    const query = req.user.role === 'advisor' ? { advisor: req.user._id } : { student: req.user._id };
    const sessions = await Session.find(query).populate('student advisor', 'name email').sort({ date: 1, time: 1 });
    res.json({ success: true, sessions });
  } catch (err) {
    next(err);
  }
};

exports.createSession = async (req, res, next) => {
  try {
    const { title, date, time, duration, notes } = req.body;
    
    let studentId, advisorId;

    if (req.user.role === 'student') {
      studentId = req.user._id;
      const student = await User.findById(req.user._id);
      advisorId = student.advisor;
    } else {
      // Advisor is creating
      advisorId = req.user._id;
      studentId = req.body.studentId;
    }

    if (!advisorId) return res.status(400).json({ success: false, message: 'Advisor not found' });
    if (!studentId) return res.status(400).json({ success: false, message: 'Student not found' });

    const session = await Session.create({
      student: studentId,
      advisor: advisorId,
      title,
      date,
      time,
      duration,
      notes,
      status: req.user.role === 'advisor' ? 'Confirmed' : 'Pending'
    });

    res.status(201).json({ success: true, session });
  } catch (err) {
    next(err);
  }
};

exports.updateSessionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const session = await Session.findByIdAndUpdate(id, { status }, { new: true });
    res.json({ success: true, session });
  } catch (err) {
    next(err);
  }
};
