const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  credits: { type: Number, required: true, min: 1, max: 6 },
  description: { type: String },
  prerequisites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  department: { type: String },
  isActive: { type: Boolean, default: true }
});

module.exports = mongoose.model('Course', courseSchema);
