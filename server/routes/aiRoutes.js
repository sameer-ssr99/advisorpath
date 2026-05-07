const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const { verifyToken } = require('../middleware/auth.js');

router.post('/chat', verifyToken, aiController.chatWithAI);

module.exports = router;
