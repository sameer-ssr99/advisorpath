const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./config/db');

const authRoutes = require('./routes/authRoutes');
const courseRoutes = require('./routes/courseRoutes');
const planRoutes = require('./routes/planRoutes');
const userRoutes = require('./routes/userRoutes');
const markRoutes = require('./routes/markRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const messageRoutes = require('./routes/messageRoutes');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/plans', planRoutes);
app.use('/api/users', userRoutes);
app.use('/api/marks', markRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ai', require('./routes/aiRoutes'));

// Central Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Server Error' 
  });
});

const PORT = 5001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
