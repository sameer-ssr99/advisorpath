const mongoose = require('mongoose');

const markSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  semester: {
    type: String,
    required: true
  },
  subjects: [{
    code: String,
    name: String,
    components: {
      internal: { scored: { type: Number, default: 0 }, total: { type: Number, default: 30 } },
      midterm: { scored: { type: Number, default: 0 }, total: { type: Number, default: 30 } },
      assignment: { scored: { type: Number, default: 0 }, total: { type: Number, default: 20 } },
      final: { scored: { type: Number, default: 0 }, total: { type: Number, default: 20 } }
    },
    attendance: { type: Number, default: 0 },
    targetGrade: { type: String, default: 'A' },
    studentNote: String
  }],
  advisorFeedback: [{
    advisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: String,
    relatedSubject: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { timestamps: true });

module.exports = mongoose.model('Mark', markSchema);
