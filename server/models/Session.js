const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  advisor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  date: {
    type: String, // Storing as string YYYY-MM-DD for easier matching with frontend
    required: true
  },
  time: {
    type: String,
    required: true
  },
  duration: {
    type: String,
    default: '30 minutes'
  },
  notes: String,
  location: {
    type: String,
    default: 'Virtual / TBD'
  },
  link: {
    type: String,
    default: 'Pending'
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'Scheduled', 'Completed', 'Cancelled'],
    default: 'Pending'
  }
}, { timestamps: true });

module.exports = mongoose.model('Session', sessionSchema);
