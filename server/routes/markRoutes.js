const express = require('express');
const router = express.Router();
const { getMarks, updateMarks, addFeedback } = require('../controllers/markController');
const { verifyToken } = require('../middleware/auth');
const { checkRole } = require('../middleware/roleGuard');

router.use(verifyToken);

router.get('/', getMarks);
router.post('/', checkRole(['student']), updateMarks);
router.post('/:markId/feedback', checkRole(['advisor', 'admin']), addFeedback);

module.exports = router;
