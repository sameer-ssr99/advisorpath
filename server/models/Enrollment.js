const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
  term: { type: String, required: true },
  status: { type: String, enum: ['current', 'upcoming', 'completed'], default: 'upcoming' },
}, { timestamps: true });

enrollmentSchema.index({ student: 1, course: 1, term: 1 }, { unique: true });

module.exports = mongoose.model('Enrollment', enrollmentSchema);
