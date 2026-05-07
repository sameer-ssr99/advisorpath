const mongoose = require('mongoose');

const gradeSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  term: { type: String, required: true },
  marks: { type: Number, required: true, min: 0, max: 100 },
  gradePoint: { type: Number, required: true, min: 0, max: 4 },
  advisorComment: { type: String, default: '' },
  reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  reviewedAt: Date,
}, { timestamps: true });

gradeSchema.index({ student: 1, course: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Grade', gradeSchema);
