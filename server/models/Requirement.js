const mongoose = require('mongoose');

const requirementSchema = new mongoose.Schema({
  program: { type: String, required: true, unique: true },
  requiredCredits: { type: Number, required: true },
  categoryRules: {
    core: { type: Number, required: true },
    math: { type: Number, required: true },
    elective: { type: Number, required: true },
  },
  courseCategoryMap: [{
    course: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', required: true },
    category: { type: String, enum: ['core', 'math', 'elective'], required: true },
  }],
}, { timestamps: true });

module.exports = mongoose.model('Requirement', requirementSchema);
