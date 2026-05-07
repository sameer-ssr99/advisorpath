const Mark = require('../models/Mark');
const User = require('../models/User');

exports.getMarks = async (req, res, next) => {
  try {
    let query = {};
    if (req.user.role === 'advisor') {
      if (req.query.studentId) {
        query = { student: req.query.studentId };
      } else {
        const students = await User.find({ advisor: req.user._id });
        const studentIds = students.map(s => s._id);
        query = { student: { $in: studentIds } };
      }
    } else {
      query = { student: req.user._id };
    }

    const marks = await Mark.find(query).populate('student', 'name email').sort({ semester: 1 });
    res.json({ success: true, marks });
  } catch (err) {
    next(err);
  }
};

exports.updateMarks = async (req, res, next) => {
  try {
    const { semester, subjects } = req.body;
    const studentId = req.user._id;

    let markEntry = await Mark.findOne({ student: studentId, semester });

    if (markEntry) {
      markEntry.subjects = subjects;
      await markEntry.save();
    } else {
      markEntry = await Mark.create({
        student: studentId,
        semester,
        subjects
      });
    }

    res.json({ success: true, mark: markEntry });
  } catch (err) {
    next(err);
  }
};

exports.addFeedback = async (req, res, next) => {
  try {
    const { markId } = req.params;
    const { text, relatedSubject } = req.body;
    const advisorId = req.user._id;

    const markEntry = await Mark.findById(markId);
    if (!markEntry) return res.status(404).json({ success: false, message: 'Mark entry not found' });

    markEntry.advisorFeedback.push({
      advisor: advisorId,
      text,
      relatedSubject
    });

    await markEntry.save();
    res.json({ success: true, mark: markEntry });
  } catch (err) {
    next(err);
  }
};
