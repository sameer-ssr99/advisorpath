const mongoose = require('mongoose');

const semesterSchema = new mongoose.Schema({
  name: { type: String },
  courses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Course' }],
  totalCredits: { type: Number, default: 0 }
}, { _id: false });

const planSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  semesters: [semesterSchema],
  status: { type: String, enum: ['draft', 'submitted', 'approved', 'rejected'], default: 'draft' },
  advisorNote: { type: String },
  submittedAt: { type: Date },
  reviewedAt: { type: Date },
  createdAt: { type: Date, default: Date.now }
});

// Pre-save hook to compute total credits for each semester if not already computed correctly
planSchema.pre('save', async function (next) {
  if (this.isModified('semesters')) {
    // Populate is not available in pre save hook easily, we rely on controller to compute credits
    // But schema requires totalCredits to be computed before save. Let's just allow the controller to set it.
  }
  next();
});

module.exports = mongoose.model('Plan', planSchema);
