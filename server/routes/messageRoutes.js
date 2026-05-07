const express = require('express');
const router = express.Router();
const { getMessages, sendMessage, markAsRead } = require('../controllers/messageController');
const { verifyToken } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', getMessages);
router.post('/', sendMessage);
router.patch('/read/:senderId', markAsRead);

module.exports = router;
